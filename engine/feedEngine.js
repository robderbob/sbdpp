const attributeDao = require("../storage/dao/attributeDao");
const contextDao = require("../storage/dao/contextDao");
const sectionCompletionDao = require("../storage/dao/sectionCompletionDao");
const feedStepDao = require("../storage/dao/feedStepDao");
const feedSubStepDao = require("../storage/dao/feedSubStepDao");
const logger = require("../lib/logger");

const { getContext } = require("./contextEngine");

const script = process.env.SCRIPT;

const config = require(`../scripts/${script}/config`);

const saveStepToDb = async (userId, step) => {
  console.log("saving step to db");
  const experimentRunId = await attributeDao.find(userId, "experimentRunId");
  const feedStep = await feedStepDao.add(userId, experimentRunId, step);
  const paaString = await attributeDao.find(userId, "participatingAgentsArray");
  let paa = JSON.parse(paaString);
  for (let participatingAgent of paa) {
    if (step[participatingAgent]) {
      feedSubStepDao.add(
        userId,
        experimentRunId,
        feedStep._id,
        participatingAgent,
        step[participatingAgent]
      );
    }
  }
  return;
};

const addStepToFeed = async (userId, feed, step) => {
  console.log("pushing step to feed");
  feed.push(step);
  if (script.includes("experiments")) {
    await saveStepToDb(userId, step);
  }
  return feed;
};

const addSystemMessage = async (userId, feed, targetAgent, message) => {
  let step = {};
  step.agent = "system";
  const content = `(SYSTEM MESSAGE: ${message})`;
  step.content = content;
  const systemMessage = {
    role: "user",
    content,
  };
  step[targetAgent] = systemMessage;
  step.sectionCompletionId = await attributeDao.find(
    userId,
    "currentSectionCompletionId"
  );
  if (feed.length > 0 && feed[feed.length - 1].currentInstructionsName) {
    step.currentInstructionsName =
      feed[feed.length - 1].currentInstructionsName;
  }
  feed = await addStepToFeed(userId, feed, step);
  return feed;
};

const getAgentFeed = async (userId, feed, agent) => {
  const context = await getContext(userId, agent);
  const getSystemMessage = require(`../scripts/${script}/systemMessages/${agent}`);
  const systemMessage = await getSystemMessage(context);
  let agentFeed = [];
  agentFeed[0] = {
    role: "system",
    content: systemMessage,
  };
  for (let i = 0; i < feed.length; i++) {
    const message = feed[i][agent];
    if (message && Object.keys(message).length > 0) {
      agentFeed.push(message);
    }
  }
  if (agentFeed.length === 1 && config.agents[agent]?.hasInitialUserMessage) {
    const getInitialUserMessage = require(`../scripts/${script}/initialUserMessages/${agent}`);
    const initialUserMessage = await getInitialUserMessage(context);
    agentFeed.push({
      role: "user",
      content: initialUserMessage,
    });
  }
  return agentFeed;
};

const createNewFeed = async (userId) => {
  logger.info("Creating new feed", {
    userId,
  });
  const feed = [];
  await saveFeed(userId, feed);
  return feed;
};

const loadFeed = async (userId) => {
  const feedJson = await attributeDao.find(userId, "feed");
  let feed;
  if (feedJson) {
    feed = JSON.parse(feedJson);
  } else {
    feed = await createNewFeed(userId);
  }
  return feed;
};

const saveFeed = async (userId, feed) => {
  logger.info("Saving feed", {
    userId,
  });
  await attributeDao.update(userId, "feed", JSON.stringify(feed));
  return;
};

const resetFeed = async (userId) => {
  logger.info("Resetting feed and section completions", {
    userId,
  });
  await attributeDao.deleteAllByUserId(userId);
  await contextDao.deleteAllByUserId(userId);
  await sectionCompletionDao.deleteAllByUserId(userId);
  return;
};

const associatePrecedingSteps = async (feed, sectionCompletionId) => {
  // go back to next tool call and associate all steps with the section
  for (let i = feed.length - 1; i >= 0; i--) {
    feed[i].sectionCompletionId = sectionCompletionId;
    if (feed[i].messageType === "tool-call") {
      break;
    }
  }
  // if there are preceding steps with no section id, associate them with the section
  for (let i = feed.length - 2; i >= 0; i--) {
    if (feed[i].sectionCompletionId && feed[i].sectionCompletionId !== null) {
      break;
    }
    feed[i].sectionCompletionId = sectionCompletionId;
  }
  return feed;
};

// agent: as defined in config
// messageType: message, tool-call, tool-response
const addMessage = async (
  userId,
  feed,
  agent,
  messageType,
  message,
  stats = {}
) => {
  const paaString = await attributeDao.find(userId, "participatingAgentsArray");
  let paa = JSON.parse(paaString);
  if (!paa) {
    paa = config.participatingAgents;
  }
  let step = {
    agent,
    messageType,
    message,
    stats,
  };
  if (!script.includes("experiments")) {
    let sectionCompletionId = await attributeDao.find(
      userId,
      "currentSectionCompletionId"
    );
    let currentInstructionsName = "";
    if (feed.length > 0 && feed[feed.length - 1].currentInstructionsName) {
      currentInstructionsName = feed[feed.length - 1].currentInstructionsName;
    }
    step.sectionCompletionId = sectionCompletionId;
    step.currentInstructionsName = currentInstructionsName;
  }
  logger.info("Adding message to feed", {
    userId,
    agent,
    messageType,
    message: JSON.stringify(message),
    stats: JSON.stringify(stats),
  });
  for (let participatingAgent of paa) {
    if (config.agents[participatingAgent]?.hasNoFeed) {
      // skip if participating agent has no feed
      continue;
    }
    // add user messages to all agents directly
    // for the talking agent, add as "assistant" message; this includes own tool calls and responses
    // for participating agents that can hear talking agent, add as "assistant" message
    logger.info("Adding message to agent feed", {
      userId,
      participatingAgent,
    });
    if (
      agent === "user" ||
      participatingAgent === agent ||
      (config.agents[participatingAgent]?.seesFeedOf &&
        config.agents[participatingAgent]?.seesFeedOf.includes(agent))
    ) {
      step[participatingAgent] = message;
    } else {
      // if a text message, i.e. not tool call or response
      if (messageType === "message") {
        let messageContent = message.content;
        // if message with "thoughts"
        if (message.content.includes("(THINKING:")) {
          if (
            config.agents[agent]?.injectingInto &&
            config.agents[agent]?.injectingInto.includes(participatingAgent)
          ) {
            // message with thoughts is injected into other agents' feeds if specified
            step[participatingAgent] = {
              role: "assistant",
              content: messageContent,
            };
          } else {
            // strip out both thoughts matching "(THINKING: ...)" from message before adding rest to feeds
            messageContent = messageContent
              .trim()
              .replace(/\(THINKING:.*?\)/gs, "");
            messageContent = messageContent
              .trim()
              .replace(/\(THINKING:.*?\)/gs, "");
            // if message has remaining non-thought content, it is injected as user message
            if (messageContent.trim() !== "" && messageContent.trim() !== `"`) {
              step[participatingAgent] = {
                role: "user",
                content: messageContent.trim(),
              };
            }
          }
        } else {
          // non-thought messages are added as user messages to other agent's feeds
          // unless already added as assistant message for seesFeedOf agents
          if (agent !== "validator") {
            step[participatingAgent] = {
              role: "user",
              content: messageContent.trim(),
            };
          }
        }
      }
      // tool calls and respones are generally not added to other agents' feeds
    }
  }
  feed = await addStepToFeed(userId, feed, step);
  return feed;
};

module.exports = {
  loadFeed,
  saveFeed,
  addMessage,
  resetFeed,
  getAgentFeed,
  associatePrecedingSteps,
  addSystemMessage,
  addStepToFeed,
};
