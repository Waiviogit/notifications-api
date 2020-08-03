const { BellNotifications } = require('../dbWaivio').models;

exports.getFollowers = async ({ following }) => {
  try {
    const result = await BellNotifications.find({ following }).select('follower')
      .lean();
    return { users: result.map((el) => el.follower) };
  } catch (error) {
    return { error };
  }
};
