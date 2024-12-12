const replaceTextWithArray = (jsonData) => {
  // Helper function to split text with "\n"
  function splitText(text) {
    return text.split("\n");
  }

  // Recursive function to traverse through the JSON object
  function traverse(obj) {
    for (let key in obj) {
      if (typeof obj[key] === "string" && obj[key].includes("\n")) {
        obj[key] = splitText(obj[key]);
      } else if (typeof obj[key] === "object") {
        traverse(obj[key]);
      }
    }
  }

  // Clone the jsonData object to avoid modifying the original object
  const clonedData = JSON.parse(JSON.stringify(jsonData));

  // Traverse through the cloned object and replace text fields with arrays
  traverse(clonedData);

  return clonedData;
};

const printJson = async (title, jsonData) => {
  console.log(title, JSON.stringify(replaceTextWithArray(jsonData), null, 2));
  // const formattedData = JSON.stringify(replaceTextWithArray(jsonData), null, 2);
  // logger.info(title, formattedData);
  return;
};

const getLlmProviderByLlmName = (llmName) => {
  console.log("llmName: ", llmName);
  const matching = {
    "gpt-3.5-turbo": "openai",
    "gpt-4o": "openai",
    "gpt-4o-mini": "openai",
  };
  const llmProvider = matching[llmName];
  console.log("llmProvider: ", llmProvider);
  return llmProvider;
};

const getAssistantMessageContent = async (assistantMessage, llmProvider) => {
  if (llmProvider === "openai") {
    return assistantMessage.content;
  } else {
    throw new Error("LLM provider not supported");
  }
};

const checkIsExperiment = async (userId, temp) => {
  const script = process.env.SCRIPT;
  if (script.includes("experiments") && temp.userMessage === "exp") {
    return true;
  } else {
    return false;
  }
};

module.exports = {
  printJson,
  getAssistantMessageContent,
  getLlmProviderByLlmName,
  checkIsExperiment,
};
