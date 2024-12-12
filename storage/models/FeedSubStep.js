const mongoose = require("mongoose");

const { Schema } = mongoose;
const { ObjectId } = mongoose.Schema.Types;

const FeedSubStepSchema = new Schema(
  {
    user_id: {
      type: ObjectId,
      required: true,
    },
    experiment_run_id: {
      type: ObjectId,
      required: true,
    },
    feed_step_id: {
      type: ObjectId,
      required: true,
    },
    participating_agent: {
      type: String,
      required: true,
    },
    role: {
      type: String,
      required: true,
    },
    content: {
      type: String,
      required: true,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("feedSubStep", FeedSubStepSchema);
