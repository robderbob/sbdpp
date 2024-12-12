const Context = require("../models/Context");

const update = (userId, name, value) => {
  const data = {};
  data[name] = value;
  return Context.findOneAndUpdate(
    {
      user_id: userId,
      name,
    },
    {
      $set: {
        value,
      },
    },
    {
      new: true,
      upsert: true,
    }
  ).lean();
};

const find = async (userId, name) => {
  const context = await Context.findOne({
    user_id: userId,
    name,
  }).lean();
  if (context) {
    return context.value;
  } else {
    return null;
  }
};

const getAllByUserId = (userId) => {
  return Context.find({
    user_id: userId,
  }).lean();
};

const deleteAllByUserId = (userId) => {
  return Context.deleteMany({
    user_id: userId,
  }).lean();
};

const getLastWellbeingRatingByUserId = async (userId) => {
  const wellbeingRatings = await Context.find({
    user_id: userId,
    name: /wellbeing_rating_.*/,
  })
    .sort({ createdAt: -1 })
    .lean();
  if (wellbeingRatings.length > 0) {
    return wellbeingRatings[0];
  } else {
    return null;
  }
};

module.exports = {
  update,
  find,
  getAllByUserId,
  deleteAllByUserId,
  getLastWellbeingRatingByUserId,
};
