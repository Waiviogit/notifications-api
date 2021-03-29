const mongoose = require('mongoose');
const db = require('./waivioDB_connection');

mongoose.Promise = global.Promise;

module.exports = {
  Mongoose: db,
  models: {
    User: require('./schemas/UserSchema'),
    App: require('./schemas/AppSchema'),
    Post: require('./schemas/PostSchema'),
    Subscriptions: require('./schemas/SubscriptionSchema'),
    WobjectSubscriptions: require('./schemas/WobjectSubscriptionSchema'),
    Campaigns: require('./schemas/CampaignsSchema'),
    VipTicket: require('./schemas/VipTicketSchema'),
  },
};
