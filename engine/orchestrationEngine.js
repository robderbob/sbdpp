const attributeDao = require("../storage/dao/attributeDao");
const logger = require("../lib/logger");

const {
  addMessage,
  getAgentFeed,
  addSystemMessage,
  saveFeed,
  loadFeed,
} = require("./feedEngine");
const { getCompletion } = require("./completionEngine");

const script = process.env.SCRIPT;
const config = require(`../scripts/${script}/config`);

const checkIsMultiToolUse = async (toolCalls) => {
  return ["multi_tool_use.parallel", "multi_tool_use"].includes(
    toolCalls[0].function.name
  );
};

const generateAgentMessages = async (userId, feed, agent) => {
  // return;
  logger.info("Generating agent messages", {
    userId,
    agent,
  });
  const agentModel = config.agents[agent]?.llmName || config.llmName;
  const agentTemperature =
    config.agents[agent]?.llmTemperature || config.llmTemperature;
  const agentFeed = await getAgentFeed(userId, feed, agent);
  const agentTools = [];
  const agentToolCallsRequired =
    config.agents[agent]?.toolCallsRequired || false;
  const startTime = new Date().getTime();
  const completion = await getCompletion(
    userId,
    agentModel,
    agentTemperature,
    agentFeed,
    agentTools,
    agentToolCallsRequired
  );
  const endTime = new Date().getTime();
  const stats = {
    model: agentModel,
    temperature: agentTemperature,
    usage: completion.usage,
    duration: endTime - startTime,
  };
  const agentMessage = completion.choices[0].message;
  if (agentMessage.tool_calls) {
    const toolCalls = agentMessage.tool_calls;
    const isMultiToolUse = await checkIsMultiToolUse(toolCalls);
    let containsFinalToolCall = false;
    if (isMultiToolUse) {
      logger.info("Tried calling multi_tool_use or multi_tool_user.parallel", {
        userId,
      });
    } else {
      feed = await addMessage(
        userId,
        feed,
        agent,
        "tool-call",
        agentMessage,
        stats
      );
      for (const toolCall of toolCalls) {
        // save and load feed for feed processing inside actions
        await saveFeed(userId, feed);
        const toolCallResponse = await processToolCall(userId, toolCall);
        feed = await loadFeed(userId);
        feed = await addMessage(
          userId,
          feed,
          agent,
          "tool-response",
          toolCallResponse.message,
          {}
        );
        if (toolCallResponse.injectSystemMessage) {
          feed = await addSystemMessage(
            userId,
            feed,
            "therapist",
            toolCallResponse.message.content
          );
        }
        if (toolCallResponse.isFinalToolCall) {
          containsFinalToolCall = true;
        }
      }
    }
    // if not allowed to talk and just finished all tool calls, return
    if (agentToolCallsRequired && containsFinalToolCall) {
      return feed;
    } else {
      feed = await generateAgentMessages(userId, feed, agent);
    }
  } else {
    feed = await addMessage(
      userId,
      feed,
      agent,
      "message",
      agentMessage,
      stats
    );
  }
  return feed;
};

const saveLastInteractionDate = async (userId) => {
  logger.info("Saving last interaction date", {
    userId,
  });
  await attributeDao.update(userId, "lastInteractionDate", new Date());
  return;
};

const addSupervisorSystemMessage = async (userId, feed) => {
  let supervisorSystemMessage;
  if (feed.length === 1) {
    supervisorSystemMessage = `You don't have any instructions yet. Please immediately proceed accoring to "Welcome" instructions by calling the tool "proceed_with" with the argument "Welcome".`;
  } else if (feed.length > 1) {
    supervisorSystemMessage = `Please check the cases under "### WHAT TO DO ON EACH TURN ###" and act accordingly. Remember that your current instructions are only completed when all tasks in the current instructions are done.`;
  }
  feed = await addSystemMessage(
    userId,
    feed,
    "supervisor",
    supervisorSystemMessage
  );
  return feed;
};

const generateModelMessages = async (userId, feed) => {
  feed = await addSupervisorSystemMessage(userId, feed);
  const participatingAgents = config.participatingAgents || ["therapist"];
  for (const agent of participatingAgents) {
    feed = await generateAgentMessages(userId, feed, agent);
  }
  // await printJson("FEED: ", feed);
  saveLastInteractionDate(userId);
  return feed;
};

module.exports = {
  generateModelMessages,
  generateAgentMessages,
};
