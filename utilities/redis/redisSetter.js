const { redisNotifyClient } = require('./redis.js');

exports.setSubscribe = async (key, subscriber) => redisNotifyClient.saddAsync(key, subscriber);

exports.setSubscribeSingle = async (key, subscriber) => (
  redisNotifyClient.setexAsync(key, 120, subscriber));

exports.deleteSubscribers = async (key) => redisNotifyClient.delAsync(key);
