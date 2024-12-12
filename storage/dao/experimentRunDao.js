const ExperimentRun = require("../models/ExperimentRun");

const add = async (userId, scenario, patientCase) => {
  return await new ExperimentRun({
    user_id: userId,
    scenario,
    patient_case: patientCase,
  }).save();
};

const updateById = async (id, metrics = {}) => {
  console.log("submitted metrics: ", JSON.stringify(metrics));
  return await ExperimentRun.findOneAndUpdate(
    {
      _id: id,
    },
    {
      $set: {
        date_completed: new Date(),
        interactions: metrics.interactions,
        calls: metrics.calls,
        duration: metrics.duration,
        input_tokens: metrics.inputTokens,
        output_tokens: metrics.outputTokens,
        correct_switches: metrics.correctSwitches,
        incorrect_switches: metrics.incorrectSwitches,
        coherent_switches: metrics.coherentSwitches,
        incoherent_switches: metrics.incoherentSwitches,
        exit_reason: metrics.exitReason,
      },
    },
    {
      new: true,
      upsert: true,
    }
  ).lean();
};

module.exports = {
  add,
  updateById,
};
