const logger = require("../lib/logger");

const attributeDao = require("../storage/dao/attributeDao");
const experimentRunDao = require("../storage/dao/experimentRunDao");
const userDao = require("../storage/dao/userDao");

const { generateAgentMessages } = require("./orchestrationEngine");
const {
  loadFeed,
  saveFeed,
  resetFeed,
  addSystemMessage,
  addStepToFeed,
} = require("./feedEngine");

const { printJson } = require("../lib/helperService");

const evaluateExperimentRun = async (userId, scenario, feed) => {
  const interactions = await attributeDao.find(userId, "interactions");
  const calls = await attributeDao.find(userId, "calls");
  const duration = await attributeDao.find(userId, "duration");
  const inputTokens = await attributeDao.find(userId, "inputTokens");
  const outputTokens = await attributeDao.find(userId, "outputTokens");
  const correctSwitches = await attributeDao.find(userId, "correctSwitches");
  const incorrectSwitches = await attributeDao.find(
    userId,
    "incorrectSwitches"
  );
  const coherentSwitches = await attributeDao.find(userId, "coherentSwitches");
  const incoherentSwitches = await attributeDao.find(
    userId,
    "incoherentSwitches"
  );
  const exitReason = await attributeDao.find(userId, "exitReason");
  const metrics = {
    scenario,
    interactions,
    calls,
    duration,
    inputTokens,
    outputTokens,
    correctSwitches: correctSwitches ? correctSwitches : parseInt(0),
    incorrectSwitches: incorrectSwitches ? incorrectSwitches : parseInt(0),
    coherentSwitches: coherentSwitches ? coherentSwitches : parseInt(0),
    incoherentSwitches: incoherentSwitches ? incoherentSwitches : parseInt(0),
    exitReason,
  };
  const experimentRunId = await attributeDao.find(userId, "experimentRunId");
  await experimentRunDao.updateById(experimentRunId, metrics);
  await printJson("FEED: ", feed);
  console.log("METRICS: ", JSON.stringify(metrics));
  return;
};

const getValidatorResponse = async (feed) => {
  if (!feed[feed.length - 1].agent === "validator") {
    throw new Error("Not validator agent", JSON.stringify(feed));
  }
  const validatorMessage = feed[feed.length - 1].message.content;
  let validatorResponse = {};
  if (validatorMessage.includes("Instructions completed: yes")) {
    validatorResponse.instructionsCompleted = true;
  } else if (validatorMessage.includes("Instructions completed: no")) {
    validatorResponse.instructionsCompleted = false;
  } else {
    throw new Error("Unexpected validator message", validatorMessage);
  }
  if (validatorMessage.includes("Last message coherent: yes")) {
    validatorResponse.lastMessageCoherent = true;
  } else if (validatorMessage.includes("Last message coherent: no")) {
    validatorResponse.lastMessageCoherent = false;
  } else {
    throw new Error("Unexpected validator message", validatorMessage);
  }
  return validatorResponse;
};

const checkInstructionsCompleted = async (feed, pa) => {
  if (
    feed[feed.length - 1][pa.therapist].content.includes(
      "(THINKING: I have completed my current section.)"
    )
  ) {
    return true;
  } else {
    return false;
  }
};

const checkContainsDispatching = async (feed, pa) => {
  let lastTherapistStep;
  for (let i = feed.length - 1; i >= 0; i--) {
    if (feed[i][pa.therapist]) {
      lastTherapistStep = feed[i];
      break;
    }
  }
  if (
    lastTherapistStep[pa.therapist].content.includes(
      "I should be following and completing is:"
    )
  ) {
    return true;
  } else {
    return false;
  }
};

const getSectionFromLastTherapistMessage = async (userId, feed, pa) => {
  let lastTherapistStep;
  for (let i = feed.length - 1; i >= 0; i--) {
    if (feed[i][pa.therapist]) {
      lastTherapistStep = feed[i];
      break;
    }
  }
  // console.log("relevant feed step: ", JSON.stringify(lastTherapistStep));
  if (
    lastTherapistStep[pa.therapist].content.includes(
      "I should be following and completing is:"
    )
  ) {
    let section = {};
    section.id = lastTherapistStep[pa.therapist].content
      .split("I should be following and completing is:")[1]
      .trim()
      .split("Section ")[1]
      .split(":")[0]
      .trim();
    section.tasks = lastTherapistStep[pa.therapist].content
      .split(`Section ${section.id}:`)[1]
      .split(")")[0]
      .trim();
    logger.info("Got section details", {
      sectionId: section.id,
    });
    return section;
  }
  throw new Error(
    "Unexpected dispatcher behavior",
    JSON.stringify(lastTherapistStep)
  );
};

const setFirstSectionInstructions = async (userId, feed) => {
  const sectionId = 1;
  const sectionTasks = `{
        "Task 1a": "Welcome the patient warmly and introduce yourself. Let them know your name, and that you are an AI Therapist here to support them.",
        "Task 1b": "Ask the patient what name they prefer to be called by and wait for their response.",
        "Task 1c": "Ask the patient if they have any questions about the service or about you, and answer any questions they might have. Only proceed if they don't have any more questions."
      }
  `;
  let step = {
    agent: "event",
  };
  step.event = {
    sectionId: sectionId,
    sectionTasks: sectionTasks,
    status: "started",
  };
  feed = await addStepToFeed(userId, feed, step);
  await attributeDao.update(userId, "sectionId", sectionId);
  await attributeDao.update(userId, "sectionTasks", sectionTasks);
  return feed;
};

const addTherapistSystemMessage = async (userId, feed, pa) => {
  const sectionId = await attributeDao.find(userId, "sectionId");
  const sectionTasks = await attributeDao.find(userId, "sectionTasks");
  const currentSectionInstructions = `Section ${sectionId}: ${sectionTasks}`;
  feed = await addSystemMessage(
    userId,
    feed,
    pa.therapist,
    `Your current section's instructions:
      
        ${currentSectionInstructions}
      
      Please act according to "### WHAT TO DO ON EACH TURN ###".`
  );
  return feed;
};

const completeLastInstructions = async (userId, feed, pa) => {
  const sectionId = await attributeDao.find(userId, "sectionId");
  const sectionTasks = await attributeDao.find(userId, "sectionTasks");
  let step = {
    agent: "event",
  };
  step.event = {
    sectionId,
    sectionTasks,
    status: "completed",
  };
  feed = await addStepToFeed(userId, feed, step);
  // saving last completed for validator
  await attributeDao.update(userId, "lastSectionId", sectionId);
  await attributeDao.update(userId, "lastSectionTasks", sectionTasks);
  logger.info("Completed section", {
    sectionId,
    sectionTasks,
  });
  return feed;
};

const startNextInstructions = async (userId, feed, pa) => {
  const section = await getSectionFromLastTherapistMessage(userId, feed, pa);
  let step = {
    agent: "event",
  };
  step.event = {
    sectionId: section.id,
    sectionTasks: section.tasks,
    status: "started",
  };
  feed = await addStepToFeed(userId, feed, step);
  await attributeDao.update(userId, "sectionId", section.id);
  await attributeDao.update(userId, "sectionTasks", section.tasks);
  logger.info("Started section", {
    sectionId: section.id,
    sectionTasks: section.tasks,
  });
  return feed;
};

const increaseMetric = async (userId, metricName, increase) => {
  console.log("metricName: ", metricName);
  let metricValue = await attributeDao.find(userId, metricName);
  console.log("old metricValue: ", parseInt(metricValue));
  if (!metricValue) {
    metricValue = 0;
  }
  await attributeDao.update(
    userId,
    metricName,
    parseInt(metricValue) + parseInt(increase)
  );
  console.log("new metricValue: ", parseInt(metricValue) + parseInt(increase));
  return;
};

// only tracked for production agents: therapist, rater, dispatcher
// i.e. not for patient and not for rater_validating
const trackCallMetrics = async (userId, feed) => {
  await increaseMetric(userId, "calls", 1);
  const stats = feed[feed.length - 1].stats;
  await increaseMetric(userId, "duration", stats.duration);
  await increaseMetric(userId, "inputTokens", stats.usage.prompt_tokens);
  await increaseMetric(userId, "outputTokens", stats.usage.completion_tokens);
  return;
};

const runValidator = async (userId, feed) => {
  feed = await generateAgentMessages(userId, feed, "validator");
  const validatorResponse = await getValidatorResponse(feed);
  console.log("validatorResponse: ", JSON.stringify(validatorResponse));
  if (validatorResponse.instructionsCompleted) {
    await increaseMetric(userId, "correctSwitches", 1);
  } else {
    await increaseMetric(userId, "incorrectSwitches", 1);
  }
  if (validatorResponse.lastMessageCoherent) {
    await increaseMetric(userId, "coherentSwitches", 1);
  } else {
    await increaseMetric(userId, "incoherentSwitches", 1);
  }
  return feed;
};

const logExit = async (userId, exitReason) => {
  logger.info("Exit: " + exitReason, {
    userId,
  });
  await attributeDao.update(userId, "exitReason", exitReason);
  return;
};

// pa = participatingAgents
const generateExperimentalInteraction = async (
  userId,
  feed,
  pa,
  maxInteractions,
  interactionsCount = 1
) => {
  await increaseMetric(userId, "interactions", 1);

  if (interactionsCount > maxInteractions) {
    await logExit(userId, "maxInteractionsReached");
    return feed;
  }

  if (interactionsCount === 1) {
    feed = await setFirstSectionInstructions(userId, feed);
  }

  // patient talking in subsequent turns only
  if (interactionsCount > 1) {
    feed = await generateAgentMessages(userId, feed, pa.patient);
  }

  feed = await addTherapistSystemMessage(userId, feed, pa);

  // rating OR talking in non-rater scenario
  if (pa.rater) {
    await saveFeed(userId, feed);
    feed = await generateAgentMessages(userId, feed, pa.rater);
    await trackCallMetrics(userId, feed);
  } else {
    feed = await generateAgentMessages(userId, feed, pa.therapist);
    await trackCallMetrics(userId, feed);
  }

  // completing section & (optional) dispatching in dispatcher scenario
  let instructionsCompleted = false;
  instructionsCompleted = await checkInstructionsCompleted(feed, pa);
  if (instructionsCompleted) {
    if (interactionsCount === 1) {
      await logExit(userId, "faultyCompletionOnFirstInteraction");
      return feed;
    }
    feed = await completeLastInstructions(userId, feed, pa);
    const lastSectionId = await attributeDao.find(userId, "lastSectionId");
    if (lastSectionId !== "8") {
      if (pa.dispatcher) {
        await saveFeed(userId, feed);
        feed = await generateAgentMessages(userId, feed, pa.dispatcher);
        await trackCallMetrics(userId, feed);
      } else {
        const containsDispatching = await checkContainsDispatching(feed, pa);
        if (!containsDispatching) {
          await logExit(userId, "missingDispatchingOnTherapistCompletion");
          return feed;
        }
      }
      feed = await startNextInstructions(userId, feed, pa);
    }
  }

  // talking in rater scenario
  if (pa.rater) {
    feed = await generateAgentMessages(userId, feed, pa.therapist);
    await trackCallMetrics(userId, feed);
  }

  // validating
  if (instructionsCompleted) {
    await saveFeed(userId, feed);
    feed = await runValidator(userId, feed);
    const lastSectionId = await attributeDao.find(userId, "lastSectionId");
    if (lastSectionId === "8") {
      await logExit(userId, "allSectionsCompleted");
      return feed;
    }
  }

  // recursive call
  feed = await generateExperimentalInteraction(
    userId,
    feed,
    pa,
    maxInteractions,
    interactionsCount + 1
  );
  return feed;
};

const generateExperimentalConversation = async (
  userId,
  feed,
  agents,
  maxInteractions
) => {
  feed = await generateExperimentalInteraction(
    userId,
    feed,
    agents,
    maxInteractions
  );
  return feed;
};

const runExperiment = async (
  userId,
  scenario,
  patientCase,
  participatingAgents,
  maxInteractions
) => {
  logger.info("Initiating experiment", {
    userId,
    participatingAgents,
    maxInteractions,
  });
  const experimentRun = await experimentRunDao.add(
    userId,
    scenario,
    patientCase
  );
  await attributeDao.update(userId, "experimentRunId", experimentRun._id);
  let feed = await loadFeed(userId);
  feed = await generateExperimentalConversation(
    userId,
    feed,
    participatingAgents,
    maxInteractions
  );
  await evaluateExperimentRun(userId, scenario, feed);
  return;
};

const runExperiments = async () => {
  userId = await userDao.create();
  const manuals = [1];
  const patientCases = [1, 2, 3, 4, 5];
  const scenarios = ["a", "b"];
  const runs = 7;
  const maxInteractions = 50;
  const setups = {
    a: {
      isExternalRater: false,
      isExternalDispatcher: false,
    },
    b: {
      isExternalRater: true,
      isExternalDispatcher: true,
    },
  };
  logger.info("Initiating experiments", {
    userId,
  });
  for (const manualNumber of manuals) {
    for (const patientCaseNumber of patientCases) {
      for (const scenario of scenarios) {
        // data preparation
        let participatingAgents = {
          patient: "patient",
          therapist: `therapist_${scenario}`,
        };
        if (setups[scenario].isExternalRater) {
          participatingAgents.rater = "rater";
        }
        if (setups[scenario].isExternalDispatcher) {
          participatingAgents.dispatcher = "dispatcher";
        }
        // experiments loop
        for (let i = 0; i < runs; i++) {
          await resetFeed(userId);
          await attributeDao.update(userId, "manualNumber", manualNumber);
          await attributeDao.update(
            userId,
            "patientCaseNumber",
            patientCaseNumber
          );
          await attributeDao.update(
            userId,
            "therapistAgent",
            participatingAgents.therapist
          );
          const participatingAgentsArray = [
            ...new Set(Object.values(participatingAgents)),
          ];
          await attributeDao.update(
            userId,
            "participatingAgentsArray",
            JSON.stringify(participatingAgentsArray)
          );
          await runExperiment(
            userId,
            scenario,
            patientCaseNumber,
            participatingAgents,
            maxInteractions
          );
          // repeat run if not successfully completed
          const exitReason = await attributeDao.find(userId, "exitReason");
          if (
            exitReason === "faultyCompletionOnFirstInteraction" ||
            exitReason === "missingDispatchingOnTherapistCompletion" ||
            exitReason === "maxInteractionsReached"
          ) {
            logger.info("Repeating run", {
              userId,
              scenario,
              patientCaseNumber,
              maxInteractions,
              exitReason,
            });
            i--;
          }
        }
      }
    }
  }
  logger.info("Finished experiments", {
    userId,
  });
  return;
};

module.exports = {
  runExperiments,
};
