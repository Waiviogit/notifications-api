const axios = require('axios');
const _ = require('lodash');

module.exports = async ({ params, method, hostUrl = 'https://blocks.waivio.com' }) => {
  try {
    const resp = await axios.post(
      hostUrl,
      {
        jsonrpc: '2.0',
        method,
        params,
        id: 1,
      },
    );
    return _.get(resp, 'data.result');
  } catch (error) {
    return { error };
  }
};
