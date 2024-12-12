const User = require("../models/User");

const create = async () => {
  const newUser = new User();
  await newUser.save();
  return newUser._id;
};

const updateHash = (userId, hash) =>
  User.findOneAndUpdate(
    { _id: userId },
    { $set: { hash } },
    { new: true }
  ).lean();

const findAll = () => User.find().lean();

const findByEmail = (email) => User.findOne({ email }).lean();

const findById = (id) => User.findOne({ _id: id }).lean();

const findLast = async () => {
  const user = await User.findOne().sort({ $natural: -1 }).lean();
  if (user) {
    return user;
  } else {
    return null;
  }
};

module.exports = {
  create,
  updateHash,
  findAll,
  findByEmail,
  findById,
  findLast,
};
