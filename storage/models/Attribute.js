const mongoose = require('mongoose');

const { Schema } = mongoose;
const { ObjectId } = mongoose.Schema.Types;

const AttributeSchema = new Schema({
  user_id: {
    type: ObjectId,
    required: true,
  },
  name: {
    type: String,
    required: true,
  },
  value: {
    type: String,
    required: true,
  },
}, { timestamps: true });

module.exports = mongoose.model('attribute', AttributeSchema);
