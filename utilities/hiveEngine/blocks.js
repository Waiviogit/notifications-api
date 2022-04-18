const { engineProxy } = require('./engineQuery');

exports.getLatestBlockInfo = async () => engineProxy({
  method: 'getLatestBlockInfo',
  endpoint: '/blockchain',
});
