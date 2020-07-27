const { SubscribeNotifications } = require('../dbWaivio').models;

exports.getFollowers = async ({ following }) => {
  try {
    const result = await SubscribeNotifications.find({ following }).select('follower')
      .lean();
    return { users: result.map((el) => el.follower) };
  } catch (error) {
    return { error };
  }
};
