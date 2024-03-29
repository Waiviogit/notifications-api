const _ = require('lodash');
const config = require('config');
const { dsteemModel } = require('models');

exports.getAmountFromVests = async (vests) => {
  try {
    const { result, error } = await dsteemModel.getGlobalProperties();
    if (error) return vests;
    const HP = (parseFloat(result.total_vesting_fund_hive) * parseFloat(vests.replace(',', ''))) / parseFloat(result.total_vesting_shares);
    return `${_.round(HP, 3)} ${config.currency}`;
  } catch (error) {
    return vests;
  }
};
