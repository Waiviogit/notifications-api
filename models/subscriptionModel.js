const { Subscriptions } = require('../dbWaivio').models;

exports.find = async (condition, select) => {
  try {
    return { result: await Subscriptions.findOne(condition).select(select).lean() };
  } catch (error) {
    return { error };
  }
};
