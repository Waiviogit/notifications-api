const { redisNotifyClient } = require('./redis.js');

exports.setSubscribe = async (key, subscriber) => redisNotifyClient.saddAsync(key, subscriber);

exports.deleteSubscribers = async (key) => redisNotifyClient.delAsync(key);
