const mongoose = require('mongoose');
const db = require('../waivioDB_connection');

const { Schema } = mongoose;

const VipTicketSchema = new Schema({
  userName: { type: String, required: true, index: true },
  ticket: { type: String, required: true, unique: true },
  valid: { type: Boolean, default: true },
  note: { type: String },
}, { versionKey: false, timestamps: true });

const VipTicketModel = db.model('vipTickets', VipTicketSchema, 'vip_tickets');

module.exports = VipTicketModel;
