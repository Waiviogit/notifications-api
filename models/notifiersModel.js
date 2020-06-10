const { Notifier } = require('../database').models;

exports.getOne = async ({ chatId }) => {
  try {
    const notifier = await Notifier.findOne({ chatId });
    return { notifier };
  } catch (error) {
    return { error };
  }
};

exports.create = async ({ chatId }) => {
  try {
    const notifier = await Notifier.create({ chatId });
    return { notifier };
  } catch (error) {
    return { error };
  }
};

exports.updateOne = async ({ condition, updateData }) => {
  try {
    const result = await Notifier.updateOne(condition, updateData);
    return { result };
  } catch (error) {
    return { error };
  }
};
