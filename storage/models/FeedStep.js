const mongoose = require("mongoose");

const { Schema } = mongoose;
const { ObjectId } = mongoose.Schema.Types;

const FeedStepSchema = new Schema(
  {
    user_id: {
      type: ObjectId,
      required: true,
    },
    experiment_run_id: {
      type: ObjectId,
      required: true,
    },
    agent: {
      type: String,
      required: true,
    },
    section_number: {
      type: Number,
      required: false,
    },
    section_status: {
      type: String,
      required: false,
    },
    message_type: {
      type: String,
      required: false,
    },
    role: {
      type: String,
      required: false,
    },
    content: {
      type: String,
      required: false,
    },
    model: {
      type: String,
      required: false,
    },
    temperature: {
      type: Number,
      required: false,
    },
    input_tokens: {
      type: Number,
      required: false,
    },
    output_tokens: {
      type: Number,
      required: false,
    },
    duration: {
      type: Number,
      required: false,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("feedStep", FeedStepSchema);
