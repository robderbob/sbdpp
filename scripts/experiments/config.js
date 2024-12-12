const config = {
  feedSectionsLimit: 100,
  loadScriptContext: false,
  summarizeSections: false,
  llmName: "gpt-4o-mini",
  llmTemperature: 0,
  agents: {
    patient: {
      llmTemperature: 1,
      contextFields: ["patientCase"],
    },
    therapist_a: {
      contextFields: ["manual"],
    },
    therapist_b: {},
    rater: {
      llmTemperature: 0,
      contextFields: ["sectionInstructions", "lastConversationMessages"],
      hasNoFeed: true,
      hasInitialUserMessage: true,
      injectingInto: ["therapist_a", "therapist_b"],
    },
    dispatcher: {
      llmTemperature: 0,
      contextFields: [
        "manual",
        "sectionInstructions",
        "lastConversationMessages",
      ],
      hasNoFeed: true,
      hasInitialUserMessage: true,
      injectingInto: ["therapist_a", "therapist_b"],
    },
    validator: {
      llmName: "gpt-4o",
      llmTemperature: 0,
      contextFields: ["lastCompletedInstructions", "lastConversationMessages"],
      hasNoFeed: true,
      hasInitialUserMessage: true,
    },
  },
};

module.exports = config;
