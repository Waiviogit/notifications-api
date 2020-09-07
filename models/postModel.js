const { Post } = require('../dbWaivio').models;

exports.find = async (condition, select) => {
  try {
    return { posts: await Post.find(condition).select(select).lean() };
  } catch (error) {
    return { error };
  }
};

exports.findOne = async (condition, select) => {
  try {
    return { post: await Post.findOne(condition).select(select).lean() };
  } catch (error) {
    return { error };
  }
};
