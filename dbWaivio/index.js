const mongoose = require('mongoose');
const db = require('./waivioDB_connection');

mongoose.Promise = global.Promise;

module.exports = {
  Mongoose: db,
  models: {
    User: require('./schemas/UserSchema'),
    App: require('./schemas/AppSchema'),
    Post: require('./schemas/PostSchema'),
    BellWobject: require('./schemas/BellWobjectSchema'),
    Subscriptions: require('./schemas/SubscriptionSchema'),
    BellNotifications: require('./schemas/BellNotificationsSchema'),
  },
};
