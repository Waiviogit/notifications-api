const { redis, redisGetter, redisSetter } = require('../redis');
const wssHelper = require('./wssHelper');
const { CALL_METHOD } = require('../../constants/notificationTypes');

const messageDataListener = async (channel, msg) => {
  const subscribers = await redisGetter.getBlockSubscribers(`${channel}:${+msg - 1}`);
  if (subscribers && subscribers.length) {
    await wssHelper.sendParsedBlockResponse(channel, subscribers, +msg - 1);
    await redisSetter.deleteSubscribers(`${channel}:${msg - 1}`);
  }
};

const campaignDataListener = async (channel, msg) => {
  switch (channel) {
    case 'expire:assign':
    case 'expire:assign:false':
      const subscriber = await redisGetter.getSubscriber(msg);
      if (!subscriber) return;
      const assigned = !new RegExp('false').test(channel);
      await wssHelper.sendToSubscriber(
        subscriber,
        JSON.stringify({
          type: CALL_METHOD.SUBSCRIBE_CAMPAIGN_ASSIGN,
          assigned,
          permlink: msg,
        }),
      );
      break;
  }
};

exports.startRedisListener = () => {
  redis.messageListener(messageDataListener);
  redis.campaignMessageListener(campaignDataListener);
};
