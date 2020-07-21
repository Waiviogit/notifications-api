const redis = require('redis');
const bluebird = require('bluebird');

bluebird.promisifyAll(redis.RedisClient.prototype);
bluebird.promisifyAll(redis.Multi.prototype);
const redisNotifyClient = redis.createClient({ db: 11 });

module.exports = {
  redisNotifyClient,
};
