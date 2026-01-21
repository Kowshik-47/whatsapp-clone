const mongoose = require('mongoose');

const chatSchema = new mongoose.Schema({
  name: String,
  isGroup: {
    type: Boolean,
    default: false
  },
  users: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  admin: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  lastMessage: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Message'
  },
  groupImage: String,
  description: String
}, { timestamps: true });

module.exports = mongoose.model('Chat', chatSchema);