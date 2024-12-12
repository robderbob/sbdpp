const OpenAI = require("openai");
const logger = require("../lib/logger");

const { printJson, getLlmProviderByLlmName } = require("../lib/helperService");

const getOpenAICompletion = async (
  llmName,
  llmTemperature,
  messages,
  tools = [],
  toolChoiceRequired = false
) => {
  /*
  console.log(
    "entering getOpenAICompletion",
    llmName,
    tools,
    toolChoiceRequired
  );
  */
  const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
  });
  const completionRequest = {
    model: llmName,
    temperature: llmTemperature,
    messages,
    // parallel_tool_calls: false,
  };
  if (tools.length > 0) {
    completionRequest.tools = tools;
  }
  if (toolChoiceRequired === true) {
    completionRequest.tool_choice = "required";
  }
  await printJson(
    "Completion request to OpenAI API: ",
    completionRequest.messages
  );
  const completion = await openai.chat.completions.create(completionRequest);
  // await printJson("Completion received from OpenAI API: ", completion);
  return completion;
};

const getCompletion = async (
  userId,
  llmName,
  llmTemperature,
  messages,
  tools = [],
  toolChoiceRequired = false
) => {
  logger.info("Getting completion", {
    userId,
    llmName,
    llmTemperature,
  });
  const llmProvider = getLlmProviderByLlmName(llmName);
  let completion;
  if (llmProvider === "openai") {
    completion = await getOpenAICompletion(
      llmName,
      llmTemperature,
      messages,
      tools,
      toolChoiceRequired
    );
  } else {
    throw new Error("LLM provider not supported");
  }
  return completion;
};

module.exports = {
  getCompletion,
};
