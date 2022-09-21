const { redis, redisGetter } = require('../redis');
const wssHelper = require('./wssHelper');
const { CAMPAIGN_LISTENER, MAIN_PARSER_LISTENER } = require('../../constants/redis');

const messageDataListener = async (channel, msg) => {
  const type = MAIN_PARSER_LISTENER[channel];
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
