const mongoose = require('mongoose');
const db = require('../waivioDB_connection');

const { Schema } = mongoose;

const BellNotificationsSchema = new Schema({
  follower: { type: String, required: true },
  following: { type: String, required: true },
}, { versionKey: false });

BellNotificationsSchema.index({ following: 1, follower: 1 }, { unique: true });

const BellNotificationsModel = db.model('BellNotifications', BellNotificationsSchema);

module.exports = BellNotificationsModel;
