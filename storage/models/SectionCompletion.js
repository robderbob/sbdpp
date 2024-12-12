const mongoose = require("mongoose");

const { Schema } = mongoose;
const { ObjectId } = mongoose.Schema.Types;

const SectionCompletionSchema = new Schema(
  {
    user_id: {
      type: ObjectId,
      required: true,
    },
    name: {
      type: String,
      required: true,
    },
    instructions: {
      type: String,
      required: true,
    },
    completion_status: {
      // started, completed
      type: String,
      required: true,
    },
    started_date: {
      type: Date,
      required: true,
    },
    completed_date: {
      type: Date,
      required: false,
    },
    summary: {
      type: String,
      required: false,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("sectionCompletion", SectionCompletionSchema);
