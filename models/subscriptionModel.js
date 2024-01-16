const { Subscriptions } = require('../dbWaivio').models;

exports.find = async (condition, select) => {
  try {
    return { result: await Subscriptions.findOne(condition).select(select).lean() };
  } catch (error) {
    return { error };
  }
};

exports.getBellFollowers = async ({ following }) => {
  try {
    const result = await Subscriptions.find({ following, bell: true }).select('follower')
      .lean();
    return { users: result.map((el) => el.follower) };
  } catch (error) {
    return { error };
  }
};

exports.getFollowers = async ({ following }) => {
  try {
    const result = await Subscriptions.find({ following }).select('follower')
      .lean();
    return { users: result.map((el) => el.follower) };
  } catch (error) {
    return { error };
  }
};
