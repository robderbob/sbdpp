const attributeDao = require("../storage/dao/attributeDao");
const contextDao = require("../storage/dao/contextDao");
const sectionCompletionDao = require("../storage/dao/sectionCompletionDao");

const logger = require("../lib/logger");

const script = process.env.SCRIPT;
const config = require(`../scripts/${script}/config`);

const getCurrentSectionInstructions = async (userId) => {
  logger.info("Getting current section", {
    userId,
  });
  const currentSectionCompletionId = await attributeDao.find(
    userId,
    "currentSectionCompletionId"
  );
  let currentSectionInstructions = "No instructions yet.";
  if (currentSectionCompletionId) {
    const currentSectionCompletion = await sectionCompletionDao.getById(
      currentSectionCompletionId
    );
    currentSectionInstructions = currentSectionCompletion.instructions;
  }
  return currentSectionInstructions;
};

const getCurrentDate = async (userId) => {
  return new Date();
};

const getHoursSinceLastInteraction = async (userId) => {
  const lastInteractionDate = await attributeDao.find(
    userId,
    "lastInteractionDate"
  );
  if (lastInteractionDate) {
    const currentDate = new Date();
    const hoursSinceLastInteraction = Math.round(
      Math.abs(currentDate - new Date(lastInteractionDate)) / 3600000
    );
    return hoursSinceLastInteraction;
  } else {
    return "No previous interactions yet";
  }
};

const getManual = async (userId) => {
  let manualNumber = await attributeDao.find(userId, "manualNumber");
  if (!manualNumber) {
    manualNumber = 1;
  }
  const getManual = require(`../scripts/${script}/manuals/manual_${manualNumber}`);
  const manual = await getManual();
  return manual;
};

const getLastConversationMessages = async (userId) => {
  const feedJson = await attributeDao.find(userId, "feed");
  const feed = JSON.parse(feedJson);
  if (!feed || feed.length === 0) {
    return "No conversation yet.";
  }
  // console.log("feed: ", JSON.stringify(feed));
  const therapistAgent = await attributeDao.find(userId, "therapistAgent");
  const therapistMessages = feed
    .filter((step) => step[therapistAgent])
    .map((step) => step[therapistAgent]);
  let transcript = "";
  for (const message of therapistMessages) {
    if (
      message.role === "user" &&
      !message.content.includes("(SYSTEM MESSAGE:")
    ) {
      transcript += `Patient: ${message.content}\n`;
    } else if (message.role === "assistant") {
      // strip out both thoughts matching "(THINKING: ...)" from message before adding rest to feeds
      let messageContent = message.content;
      messageContent = messageContent.trim().replace(/\(THINKING:.*?\)/gs, "");
      messageContent = messageContent.trim().replace(/\(THINKING:.*?\)/gs, "");
      if (messageContent.trim() !== "") {
        transcript += `Therapist: ${messageContent}\n`;
      }
    }
  }
  return transcript;
};

const getSectionInstructions = async (userId) => {
  const sectionId = await attributeDao.find(userId, "sectionId");
  const sectionTasks = await attributeDao.find(userId, "sectionTasks");
  if (!sectionId || !sectionTasks) {
    return "No section instructions yet.";
  } else {
    return `Section ${sectionId}: ${sectionTasks}`;
  }
};

const getLastCompletedInstructions = async (userId) => {
  const lastSectionId = await attributeDao.find(userId, "lastSectionId");
  const lastSectionTasks = await attributeDao.find(userId, "lastSectionTasks");
  if (!lastSectionId || !lastSectionTasks) {
    return "No last completed instructions.";
  } else {
    return `Section ${lastSectionId}: ${lastSectionTasks}`;
  }
};

const getPatientCase = async (userId) => {
  const patientCaseNumber = await attributeDao.find(
    userId,
    "patientCaseNumber"
  );
  console.log("getting case, patientCaseNumber: ", patientCaseNumber);
  if (!patientCaseNumber) {
    console.log("No patient case.");
    return "No patient case.";
  } else {
    const patientCase = require(`../scripts/${script}/systemMessages/patient_cases/case_${patientCaseNumber}`);
    console.log("patientCase: ", patientCase);
    return patientCase;
  }
};

const fieldGetters = {
  getCurrentSectionInstructions,
  getCurrentDate,
  getHoursSinceLastInteraction,
  getManual,
  getLastConversationMessages,
  getSectionInstructions,
  getLastCompletedInstructions,
  getPatientCase,
};

const getContext = async (userId, agent) => {
  let context = {};
  const agentContextFields = config.agents[agent]?.contextFields;
  if (!agentContextFields || agentContextFields.length === 0) {
    return context;
  }
  for (const field of agentContextFields) {
    const fieldGetter =
      fieldGetters[`get${field.charAt(0).toUpperCase() + field.slice(1)}`];
    context[field] = await fieldGetter(userId);
  }
  return context;
};

module.exports = {
  getContext,
};
