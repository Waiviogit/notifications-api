const { HIVE_ON_BOARD } = require('constants/requestData');
const axios = require('axios');
const _ = require('lodash');

exports.getCurrencyFromCoingecko = async (type) => {
  let currency;
  switch (type) {
    case 'HIVE':
      currency = 'hive';
      break;
    case 'HBD':
      currency = 'hive_dollar';
      break;
    default:
      currency = 'hive';
  }
  try {
    const result = await axios.get(`https://api.coingecko.com/api/v3/simple/price?ids=${currency}&vs_currencies=usd`);
    const usdCurrency = result.data[currency].usd;
    return { usdCurrency };
  } catch (error) {
    return { error };
  }
};

exports.createVipTicket = async () => {
  try {
    const { data } = await axios.post(
      `${HIVE_ON_BOARD.HOST}${HIVE_ON_BOARD.BASE_URL}${HIVE_ON_BOARD.TICKETS}`,
      { accessToken: process.env.VIP_TICKETS_TOKEN },
    );
    const ticket = _.get(data, 'ticket');
    if (!ticket) return { error: { message: 'ticket not created' } };
    return { ticket };
  } catch (error) {
    return { error };
  }
};
