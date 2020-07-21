const _ = require('lodash');
const { redisNotifyClient } = require('./redis');

exports.getUserNotifications = async (name) => {
  let result;
  try {
    result = await redisNotifyClient.hgetallAsync(`notifications:${name}`);
  } catch (error) {
    return { error };
  }
  const values = Object.values(result);

  const notifications = _
    .chain(values)
    .map((notification) => JSON.parse(notification))
    .sortBy('timestamp').reverse()
    .value();
  return { result: notifications };
};
