const mongoose = require('mongoose');

const flowStepSchema = new mongoose.Schema({
  stepType: {
    type: String,
    enum: ['bot', 'human'],
    required: true
  },
  contentType: {
    type: String,
    required: true
  },
  value: String,
  inputType: String
});

const conversationFlowSchema = new mongoose.Schema({
  name: { type: String, required: true },
  steps: [flowStepSchema],
  creator: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  sharedWith: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('ConversationFlow', conversationFlowSchema);
