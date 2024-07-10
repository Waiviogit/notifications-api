const { redis, redisGetter, redisSetter } = require('../redis');
const wssHelper = require('./wssHelper');
const { CAMPAIGN_LISTENER, MAIN_PARSER_LISTENER } = require('../../constants/redis');
const { CALL_METHOD } = require('../../constants/notificationTypes');

const messageDataListener = async (channel, msg) => {
  const type = MAIN_PARSER_LISTENER[channel];
  if (type === CALL_METHOD.SUBSCRIBE_BLOCK) {
    const subscribers = await redisGetter.getBlockSubscribers(`${channel}:${+msg - 1}`);
    if (subscribers && subscribers.length) {
      await wssHelper.sendParsedBlockResponse(channel, subscribers, +msg - 1);
      await redisSetter.deleteSubscribers(`${channel}:${msg - 1}`);
    }
    return;
  }
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

const campaignDataListener = async (channel, msg) => {
  const type = CAMPAIGN_LISTENER[channel];

  console.log('channel', channel);
  const subscriber = await redisGetter.getSubscriber(msg);
  console.log('subscriber', subscriber);
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
