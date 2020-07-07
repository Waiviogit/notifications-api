const { App } = require('../dbWaivio').models;

exports.getOne = async ({ condition, select }) => {
  try {
    const app = await App.findOne(condition).select(select).lean();
    return { app };
  } catch (error) {
    return { error };
  }
};
