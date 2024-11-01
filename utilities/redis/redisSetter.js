const { redisNotifyClient } = require('./redis.js');

exports.setSubscribe = async (key, subscriber) => redisNotifyClient.saddAsync(key, subscriber);

exports.setSubscribeSingle = async (key, subscriber) => (
  redisNotifyClient.setexAsync(key, 120, subscriber));

exports.deleteSubscribers = async (key) => redisNotifyClient.delAsync(key);

exports.set = async ({ key, value, client = redisNotifyClient }) => client
  .setAsync(key, value);

exports.incr = async ({ key, client = redisNotifyClient }) => client
  .incrAsync(key);

exports.expire = async ({ key, ttl, client = redisNotifyClient }) => client
  .expireAsync(key, ttl);
