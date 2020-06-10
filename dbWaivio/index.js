const mongoose = require('mongoose');
const db = require('../dbWaivio/waivioDB_connection');

mongoose.Promise = global.Promise;

module.exports = {
  Mongoose: db,
  models: {
    User: require('./schemas/UserSchema'),
  },
};
