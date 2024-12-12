const mongoose = require("mongoose");

const { Schema } = mongoose;
const { ObjectId } = mongoose.Schema.Types;

const ExperimentRunSchema = new Schema(
  {
    user_id: {
      type: ObjectId,
      required: true,
    },
    scenario: {
      type: String,
      required: true,
    },
    patient_case: {
      type: Number,
      required: true,
    },
    date_started: {
      type: Date,
      default: Date.now,
      required: true,
    },
    date_completed: {
      type: Date,
      required: false,
    },
    interactions: {
      type: String,
      required: false,
    },
    calls: {
      type: String,
      required: false,
    },
    duration: {
      type: String,
      required: false,
    },
    input_tokens: {
      type: String,
      required: false,
    },
    output_tokens: {
      type: String,
      required: false,
    },
    correct_switches: {
      type: String,
      required: false,
    },
    incorrect_switches: {
      type: String,
      required: false,
    },
    coherent_switches: {
      type: String,
      required: false,
    },
    incoherent_switches: {
      type: String,
      required: false,
    },
    exit_reason: {
      type: String,
      required: false,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("experimentRun", ExperimentRunSchema);
