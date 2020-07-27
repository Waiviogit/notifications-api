const mongoose = require('mongoose');
const db = require('../waivioDB_connection');

const { Schema } = mongoose;

const SubscriptionSchema = new Schema({
  follower: { type: String, required: true },
  following: { type: String, required: true },
}, { versionKey: false });

SubscriptionSchema.index({ follower: 1, following: 1 }, { unique: true });

const SubscriptionModel = db.model('Subscriptions', SubscriptionSchema);

module.exports = SubscriptionModel;
