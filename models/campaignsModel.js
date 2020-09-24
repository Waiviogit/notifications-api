const { Campaigns } = require('dbWaivio').models;

exports.findOne = async (condition) => {
  try {
    return { result: await Campaigns.findOne(condition) };
  } catch (error) {
    return { error };
  }
};
