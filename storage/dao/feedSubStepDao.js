const FeedSubStep = require("../models/FeedSubStep");

const add = (
  userId,
  experimentRunId,
  feedStepId,
  participatingAgent,
  subStep
) => {
  new FeedSubStep({
    user_id: userId,
    experiment_run_id: experimentRunId,
    feed_step_id: feedStepId,
    participating_agent: participatingAgent,
    role: subStep.role,
    content: subStep.content,
  }).save();
};

module.exports = {
  add,
};
