const { changeRedisDataType } = require('./changeRedisDataType');

(async () => {
  await changeRedisDataType();
  process.exit();
})();
