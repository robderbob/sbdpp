const mongoose = require("mongoose");

const { Schema } = mongoose;

const UserSchema = new Schema(
  {
    first_interaction: {
      type: Date,
      required: true,
      default: Date.now,
    },
    hash: {
      type: String,
      required: false,
    },
    email: {
      type: String,
      required: false,
    },
    code: {
      type: String,
      required: false,
    },
    age_group: {
      type: Number,
      required: false,
    },
    previous_segments_summary: {
      type: String,
      required: false,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("user", UserSchema);
