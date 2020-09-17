const mongoose = require('mongoose');
const db = require('../waivioDB_connection');

const { Schema } = mongoose;

const BellWobjectSchema = new Schema({
  follower: { type: String, required: true },
  following: { type: String, required: true },
}, { versionKey: false });

BellWobjectSchema.index({ following: 1, follower: 1 }, { unique: true });

const BellWobjectModel = db.model('bell_wobject', BellWobjectSchema);

module.exports = BellWobjectModel;
