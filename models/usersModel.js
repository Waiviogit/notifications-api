const { User } = require('../dbWaivio').models;

exports.findByNames = async (names) => {
  try {
    return { users: await User.find({ name: { $in: names } }).lean() };
  } catch (error) {
    return { error };
  }
};

exports.findOne = async (name) => {
  try {
    return { user: await User.findOne({ name }).lean() };
  } catch (error) {
    return { error };
  }
};

exports.aggregate = async (pipeline) => {
  try {
    return { result: await User.aggregate(pipeline) };
  } catch (error) {
    return { error };
  }
};
