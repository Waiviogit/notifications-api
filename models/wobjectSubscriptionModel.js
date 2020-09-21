const { WobjectSubscriptions } = require('../dbWaivio').models;

exports.getBellFollowers = async ({ following }) => {
  try {
    const result = await WobjectSubscriptions.find({ following, bell: true }).select('follower')
      .lean();
    return { users: result.map((el) => el.follower) };
  } catch (error) {
    return { error };
  }
};
