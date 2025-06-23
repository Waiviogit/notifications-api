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

  if (type === CALL_METHOD.SUBSCRIBE_SUPPOSED_UPDATE) {
    const [fieldName, authorPermlink] = msg.split(':');
    const subscriber = await redisGetter.getSubscriber(authorPermlink);
    if (!subscriber) return;
    await redisSetter.deleteSubscribers(msg);

    await wssHelper.sendToSubscriber(
      subscriber,
      JSON.stringify({
        type,
        authorPermlink,
        fieldName,
        parser: 'main',
      }),
    );
    return;
  }

  const subscriber = await redisGetter.getSubscriber(msg);
  if (!subscriber) return;
  await redisSetter.deleteSubscribers(msg);
  const success = !new RegExp('false').test(channel);
  await wssHelper.sendToSubscriber(
    subscriber,
    JSON.stringify({
      type,
      success,
      permlink: msg,
      id: msg,
      parser: 'main',
    }),
  );
};

const campaignDataListener = async (channel, msg) => {
  const type = CAMPAIGN_LISTENER[channel];
  const subscriber = await redisGetter.getSubscriber(msg);
  if (!subscriber) return;
  await redisSetter.deleteSubscribers(msg);
  const success = !new RegExp('false').test(channel);
  await wssHelper.sendToSubscriber(
    subscriber,
    JSON.stringify({
      type,
      success,
      permlink: msg,
      parser: 'campaigns',
    }),
  );
};

exports.startRedisListener = () => {
  redis.messageListener(messageDataListener);
  redis.campaignMessageListener(campaignDataListener);
};
