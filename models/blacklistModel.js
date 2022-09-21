const { Blacklist } = require('../dbWaivio').models;

const findOne = async (condition) => {
  try {
    return { blackList: await Blacklist.findOne(condition).lean() };
  } catch (error) {
    return { error };
  }
};

const getBlacklist = async ({ user }) => {
  const { blackList, error } = await findOne({ user });
  if (!blackList) return [];
  if (error) return [];
  const list = [...blackList.blackList];
  for (const item of blackList.followLists) list.push(...item.blackList);
  return list;
};

module.exports = {
  findOne,
  getBlacklist,
};
