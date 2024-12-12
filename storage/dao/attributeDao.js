const Attribute = require("../models/Attribute");

const update = async (userId, name, value) => {
  const data = {};
  data[name] = value;
  return await Attribute.findOneAndUpdate(
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
  const attribute = await Attribute.findOne({
    user_id: userId,
    name,
  }).lean();
  if (attribute) {
    return attribute.value;
  } else {
    return null;
  }
};

const findLast = async (userId, name) => {
  const attribute = await Attribute.findOne({
    user_id: userId,
    name,
  })
    .sort({ $natural: -1 })
    .lean();
  if (attribute) {
    return attribute.value;
  } else {
    return null;
  }
};

const findAllByName = (name) =>
  Attribute.find({
    name,
  }).lean();

const findAllByUserId = (userId) =>
  Attribute.find({
    user_id: userId,
  }).lean();

const findAllByNameAndValue = (name, value) =>
  Attribute.find({
    name,
    value,
  }).lean();

const deleteByUserIdAndName = (userId, name) =>
  Attribute.deleteOne({
    user_id: userId,
    name,
  });

// migration only
const deleteAllByName = (name) =>
  Attribute.deleteMany({
    name,
  });

// migration only
const deleteAllByUserId = (userId) =>
  Attribute.deleteMany({
    user_id: userId,
  });

// migration only
const deleteAllWithSessionId = () =>
  Attribute.deleteMany({
    session_id: {
      $ne: null,
    },
    user_id: null,
  });

module.exports = {
  update,
  find,
  findLast,
  findAllByName,
  findAllByUserId,
  findAllByNameAndValue,
  deleteByUserIdAndName,
  deleteAllByName,
  deleteAllByUserId,
  deleteAllWithSessionId,
};
