const axios = require('axios');

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
    console.log(result);
    const usdCurrency = result.data[currency].usd;
    return { usdCurrency };
  } catch (error) {
    return { error };
  }
};
