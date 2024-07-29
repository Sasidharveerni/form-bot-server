const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  username: { type: String, required: true },
  email: { type: String, required: true },
  password: { type: String, required: true },
  folders: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Folder' }],
  flows: [{ type: mongoose.Schema.Types.ObjectId, ref: 'ConversationFlow' }]
});

module.exports = mongoose.model('User', userSchema);
