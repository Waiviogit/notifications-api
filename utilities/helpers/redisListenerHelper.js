const { redis, redisGetter, redisSetter } = require('../redis');
const wssHelper = require('./wssHelper');
const { CAMPAIGN_LISTENER } = require('../../constants/redis');

const messageDataListener = async (channel, msg) => {
  const subscribers = await redisGetter.getBlockSubscribers(`${channel}:${+msg - 1}`);
  if (subscribers && subscribers.length) {
    await wssHelper.sendParsedBlockResponse(channel, subscribers, +msg - 1);
    await redisSetter.deleteSubscribers(`${channel}:${msg - 1}`);
  }
};

const campaignDataListener = async (channel, msg) => {
  const type = CAMPAIGN_LISTENER[channel];
  const subscriber = await redisGetter.getSubscriber(msg);
  if (!subscriber) return;
  const success = !new RegExp('false').test(channel);
  await wssHelper.sendToSubscriber(
    subscriber,
    JSON.stringify({
      type,
      success,
      permlink: msg,
    }),
  );
};

exports.startRedisListener = () => {
  redis.messageListener(messageDataListener);
  redis.campaignMessageListener(campaignDataListener);
};
