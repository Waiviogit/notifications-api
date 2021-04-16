const { VipTicket } = require('../dbWaivio').models;

exports.create = async (data) => {
  try {
    const ticket = new VipTicket(data);
    return { result: await ticket.save() };
  } catch (error) {
    return { error };
  }
};

exports.countDocuments = async (condition) => {
  try {
    return { result: await VipTicket.countDocuments(condition).lean() };
  } catch (error) {
    return { error };
  }
};
