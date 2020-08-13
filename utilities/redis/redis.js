const redis = require('redis');
const bluebird = require('bluebird');
const config = require('../../config');
const redisSubHelper = require('./redisSubHelper.js');

bluebird.promisifyAll(redis.RedisClient.prototype);
bluebird.promisifyAll(redis.Multi.prototype);
const redisNotifyClient = redis.createClient(process.env.REDISCLOUD_URL);
const lastBlockClient = redis.createClient(process.env.REDISCLOUD_URL);

lastBlockClient.select(config.redis.lastBlock);
redisNotifyClient.select(config.redis.notifications);

const messageListener = (onMessageCallBack) => {
  const subscribeMessage = () => {
    const subscriber = redis.createClient({ db: config.redis.lastBlock });
    const publisherKeys = ['last_vote_block_num', 'last_block_num', 'campaign_last_block_num'];
    redisSubHelper.subscribe(subscriber, publisherKeys, onMessageCallBack);
  };

  lastBlockClient.send_command('config', ['subscribe'], subscribeMessage);
};

module.exports = {
  redisNotifyClient, messageListener, lastBlockClient,
};
