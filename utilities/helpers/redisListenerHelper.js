const { redis, redisGetter, redisSetter } = require('../redis');
const wssHelper = require('./wssHelper');

const messageDataListener = async (channel, msg) => {
  const subscribers = await redisGetter.getBlockSubscribers(`${channel}:${+msg - 1}`);
  if (subscribers && subscribers.length) {
    await wssHelper.sendParsedBlockResponse(channel, subscribers, +msg - 1);
    await redisSetter.deleteSubscribers(`${channel}:${msg - 1}`);
  }
};

exports.startRedisListener = () => {
  redis.messageListener(messageDataListener);
};
