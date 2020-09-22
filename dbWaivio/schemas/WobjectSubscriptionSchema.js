const mongoose = require('mongoose');
const db = require('../waivioDB_connection');

const { Schema } = mongoose;

const WobjectSubscriptionSchema = new Schema({
  follower: { type: String, required: true },
  following: { type: String, required: true },
  bell: { type: Boolean },
}, { versionKey: false });

WobjectSubscriptionSchema.index({ follower: 1, following: 1 }, { unique: true });
WobjectSubscriptionSchema.index({ following: 1 });

const WobjectSubscriptionModel = db.model('WobjectSubscriptions', WobjectSubscriptionSchema);

module.exports = WobjectSubscriptionModel;
