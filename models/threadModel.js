const { Threads } = require('../dbWaivio').models;

const findOne = async ({ filter, projection, options }) => {
  try {
    return { result: await Threads.findOne(filter, projection, options).lean() };
  } catch (error) {
    return { error };
  }
};

const findOneByAuthorPermlink = async ({ author, permlink }) => {
  const { result } = await findOne({
    filter: { author, permlink },
  });
  return result;
};

module.exports = {
  findOneByAuthorPermlink,
};
