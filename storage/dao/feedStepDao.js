const FeedStep = require("../models/FeedStep");

const add = async (userId, experimentRunId, step) => {
  const newFeedStep = new FeedStep({
    user_id: userId,
    experiment_run_id: experimentRunId,
    agent: step.agent,
    section_number: step.event?.sectionId ? step.event.sectionId : null,
    section_status: step.event?.status ? step.event.status : null,
    message_type: step.messageType ? step.messageType : null,
    role: step.message?.role ? step.message.role : null,
    content: step.message?.content ? step.message.content : null,
    model: step.stats?.model ? step.stats.model : null,
    temperature: step.stats?.temperature ? step.stats.temperature : null,
    input_tokens: step.stats?.usage?.prompt_tokens
      ? step.stats.usage.prompt_tokens
      : null,
    output_tokens: step.stats?.usage?.completion_tokens
      ? step.stats.usage.completion_tokens
      : null,
    duration: step.stats?.duration ? step.stats.duration : null,
  });
  const savedFeedStep = await newFeedStep.save();
  return savedFeedStep;
};

module.exports = {
  add,
};
