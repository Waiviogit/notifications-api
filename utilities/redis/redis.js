const redis = require('redis');
const bluebird = require('bluebird');
const config = require('../../config');
const { CAMPAIGN_LISTENER } = require('../../constants/redis');
const redisSubHelper = require('./redisSubHelper');

bluebird.promisifyAll(redis.RedisClient.prototype);
bluebird.promisifyAll(redis.Multi.prototype);
const redisNotifyClient = redis.createClient(process.env.REDISCLOUD_URL);
const lastBlockClient = redis.createClient(process.env.REDISCLOUD_URL);
const campaignClient = redis.createClient(process.env.REDISCLOUD_URL);

lastBlockClient.select(config.redis.lastBlock);
redisNotifyClient.select(config.redis.notifications);
campaignClient.select(config.redis.campaign);

const messageListener = (onMessageCallBack) => {
  const subscribeMessage = () => {
    const subscriber = redis.createClient({ db: config.redis.lastBlock });
    const publisherKeys = ['last_vote_block_num', 'last_block_num', 'campaign_last_block_num'];
    redisSubHelper.subscribe(subscriber, publisherKeys, onMessageCallBack);
  };

  lastBlockClient.send_command('config', ['subscribe'], subscribeMessage);
};

const campaignMessageListener = (onMessageCallBack) => {
  const subscribeMessage = () => {
    const subscriber = redis.createClient({ db: 6 });
    redisSubHelper.subscribe(subscriber, Object.keys(CAMPAIGN_LISTENER), onMessageCallBack);
  };

  campaignClient.send_command('config', ['subscribe'], subscribeMessage);
};

module.exports = {
  redisNotifyClient, messageListener, lastBlockClient, campaignMessageListener,
};
