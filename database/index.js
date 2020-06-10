const mongoose = require('mongoose');
const db = require('./notifierDB_Connection');

mongoose.Promise = global.Promise;

module.exports = {
  Mongoose: db,
  models: {
    Notifier: require('./schemas/NotifiersSchema'),
  },
};
