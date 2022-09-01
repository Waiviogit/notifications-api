const { CampaignsV2 } = require('dbWaivio').models;

exports.findOne = async ({ filter, projection, options }) => {
  try {
    return { result: await CampaignsV2.findOne(filter, projection, options).lean() };
  } catch (error) {
    return { error };
  }
};
