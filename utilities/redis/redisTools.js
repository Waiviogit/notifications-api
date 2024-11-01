const { redisGetter, redisSetter } = require('./index');

const checkAndIncrementDailyLimit = async ({ key, limit }) => {
  let count = await redisGetter.get({ key });

  if (!count) {
    await redisSetter.set({ key, value: 1 });
    await redisSetter.expire({ key, ttl: 86400 });
    return { currentCount: 1, limitExceeded: false };
  }

  count = parseInt(count, 10);

  if (count < limit) {
    // Increment the count
    const newCount = await redisSetter.incr({ key });
    return { currentCount: newCount, limitExceeded: false };
  }
  // Limit reached
  return { currentCount: count, limitExceeded: true };
};

module.exports = {
  checkAndIncrementDailyLimit,
};
