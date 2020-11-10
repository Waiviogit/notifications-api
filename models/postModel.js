const { Post } = require('dbWaivio').models;

exports.getManyPosts = async (postsRefs) => {
  try {
    return { posts: await Post.find({ $or: [...postsRefs] }).lean() };
  } catch (error) {
    return { error };
  }
};
