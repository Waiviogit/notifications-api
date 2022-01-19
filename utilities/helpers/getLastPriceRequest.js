const axios = require('axios');
const _ = require('lodash');

exports.getLastPriceRequest = async (data) => {
  const obj = {
    jsonrpc: '2.0',
    id: 7,
    method: 'find',
    params: {
      contract: 'market',
      table: 'metrics',
      query: data,
      limit: 1000,
      offset: 0,
      indexes: '',
    },
  };
  try {
    const result = await axios.post('https://ha.herpc.dtools.dev/contracts', obj);
    return { lastPrice: _.get(result, 'data.result[0].lastPrice') };
  } catch (error) {
    return { error };
  }
};
