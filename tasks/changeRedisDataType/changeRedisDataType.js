const redis = require('redis');
const crypto = require('crypto');
const bluebird = require('bluebird');

bluebird.promisifyAll(redis.RedisClient.prototype);
bluebird.promisifyAll(redis.Multi.prototype);
const redisFrom = redis.createClient({ db: 0 });
const redisTo = redis.createClient({ db: 11 });

const changeRedisDataType = async () => {
  const keys = await redisFrom.keysAsync('notifications*');
  await Promise.all(keys.map(async (key) => {
    const notifications = await redisFrom.lrangeAsync(key, 0, -1);
    if (notifications.length) {
      await writeToAnotherDB(key, notifications);
    }
  }));
  console.log('task done!');
};

const writeToAnotherDB = async (key, notfications) => {
  await Promise.all(notfications.map(async (notification) => {
    await redisTo.hsetAsync(key, crypto.randomBytes(20).toString('hex'), notification);
  }));
};
module.exports = { changeRedisDataType };
