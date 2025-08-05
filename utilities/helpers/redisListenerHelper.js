const { redis, redisGetter, redisSetter } = require('../redis');
const wssHelper = require('./wssHelper');
const { CAMPAIGN_LISTENER, MAIN_PARSER_LISTENER } = require('../../constants/redis');
const { CALL_METHOD } = require('../../constants/notificationTypes');

// Deduplication cache to prevent processing same notification multiple times
const processedNotifications = new Map();
const DEDUP_TTL = 5000; // 5 seconds
let lastCleanup = Date.now();
const CLEANUP_INTERVAL = 10000; // Clean up every 10 seconds

const cleanupOldEntries = () => {
  const now = Date.now();
  for (const [entryKey, timestamp] of processedNotifications.entries()) {
    if (now - timestamp > DEDUP_TTL) {
      processedNotifications.delete(entryKey);
    }
  }
  lastCleanup = now;
};

const isDuplicateNotification = (channel, msg) => {
  const key = `${channel}:${msg}`;
  const now = Date.now();

  // Periodic cleanup to avoid running cleanup on every notification
  if (now - lastCleanup > CLEANUP_INTERVAL) {
    cleanupOldEntries();
  }

  if (processedNotifications.has(key)) {
    return true;
  }

  processedNotifications.set(key, now);
  return false;
};

const messageDataListener = async (channel, msg) => {
  if (isDuplicateNotification(channel, msg)) {
    console.log(`Skipping duplicate notification: ${channel}:${msg}`);
    return;
  }

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
  const success = !/false/.test(channel);
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
  if (isDuplicateNotification(channel, msg)) {
    console.log(`Skipping duplicate notification: ${channel}:${msg}`);
    return;
  }

  const type = CAMPAIGN_LISTENER[channel];
  const subscriber = await redisGetter.getSubscriber(msg);
  if (!subscriber) return;
  await redisSetter.deleteSubscribers(msg);
  const success = !/false/.test(channel);
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
