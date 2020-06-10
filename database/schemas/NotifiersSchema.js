const mongoose = require('mongoose');
const db = require('../notifierDB_Connection');

const NotifiersSchema = new mongoose.Schema({
  chatId: {
    type: String, required: true, unique: true, index: true,
  },
  type: { type: String, enum: ['user', 'group'] },
  subscribedUsers: { type: [String], default: [], index: true },
});

NotifiersSchema.pre('save', function (next) {
  this.type = this.chatId > 0 ? 'user' : 'group';
  next();
});

module.exports = db.model('notification-сlients', NotifiersSchema);
