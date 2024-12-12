const SectionCompletion = require("../models/SectionCompletion");

const startNewSection = async (userId, name, instructions) => {
  const sectionCompletion = new SectionCompletion({
    user_id: userId,
    name,
    instructions,
    completion_status: "started",
    started_date: new Date(),
  });
  const savedSectionCompletion = await sectionCompletion.save();
  return savedSectionCompletion;
};

const completeSection = async (sectionCompletionId, summary = "") => {
  const savedSectionCompletion = await SectionCompletion.findOneAndUpdate(
    { _id: sectionCompletionId },
    {
      $set: {
        completion_status: "completed",
        completed_date: new Date(),
        summary: summary,
      },
    },
    { new: true }
  );
  return savedSectionCompletion;
};

const deleteAllByUserId = async (userId) => {
  return SectionCompletion.deleteMany({
    user_id: userId,
  }).lean();
};

const getById = async (sectionCompletionId) => {
  return SectionCompletion.findById(sectionCompletionId).lean();
};

const getLastCompletedByUserId = async (userId) => {
  return await SectionCompletion.findOne({
    user_id: userId,
    completion_status: "completed",
  })
    .sort({ completed_date: -1 })
    .lean();
};

const getAllCompletedByUserId = async (userId) => {
  return await SectionCompletion.find({
    user_id: userId,
    completion_status: "completed",
  })
    .sort({ completed_date: 1 })
    .lean();
};

module.exports = {
  startNewSection,
  completeSection,
  deleteAllByUserId,
  getById,
  getLastCompletedByUserId,
  getAllCompletedByUserId,
};
