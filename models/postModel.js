const { Post } = require('../dbWaivio').models;

exports.find = async (condition, select) => {
  try {
    return { posts: await Post.find(condition).select(select).lean() };
  } catch (error) {
    return { error };
  }
};
