const { redis, redisGetter, redisSetter } = require('../redis');
const wssHelper = require('./wssHelper');

const messageDataListener = async (channel, msg) => {
  const subscribers = await redisGetter.getBlockSubscribers(`${channel}:${msg}`);
  if (subscribers && subscribers.length) {
    await wssHelper.sendParsedBlockResponse(channel, subscribers, msg);
    await redisSetter.deleteSubscribers(`${channel}:${msg}`);
  }
};

exports.startRedisListener = () => {
  redis.messageListener(messageDataListener);
};
