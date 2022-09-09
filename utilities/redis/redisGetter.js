const { redisNotifyClient, lastBlockClient } = require('./redis');

exports.getUserNotifications = async (name) => {
  let result;
  try {
    result = await redisNotifyClient.lrangeAsync(`notifications:${name}`, 0, -1);
  } catch (error) {
    return { error };
  }
  const notifications = result.map((notification) => JSON.parse(notification));
  return { result: notifications };
};

exports.getBlockSubscribers = async (key) => redisNotifyClient.smembersAsync(key);

exports.getSubscriber = async (key) => redisNotifyClient.getAsync(key);

exports.getBlockNum = async (key) => lastBlockClient.getAsync(key);

exports.getHashAll = async ({ key, client = lastBlockClient }) => {
  try {
    return { result: await client.hgetallAsync(key) };
  } catch (error) {
    return { error };
  }
};
