const { WobjectSubscriptions } = require('../dbWaivio').models;

exports.getBellFollowers = async ({ following }) => {
  try {
    const result = await WobjectSubscriptions.find({ following, bell: true }).select('follower')
      .lean();
    return { wobjFollowers: result.map((el) => el.follower) };
  } catch (error) {
    return { error };
  }
};
