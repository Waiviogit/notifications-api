const { BellWobject } = require('../dbWaivio').models;

exports.getFollowers = async ({ following }) => {
  try {
    const result = await BellWobject.find({ following }, { follower: 1 }).lean();
    return { users: result.map((el) => el.follower) };
  } catch (error) {
    return { error };
  }
};
