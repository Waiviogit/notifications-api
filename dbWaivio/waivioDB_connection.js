const mongoose = require('mongoose');
const config = require('../config');

const URI = `mongodb://${config.waivioDB.host}:${config.waivioDB.port}/${config.waivioDB.database}`;

module.exports = mongoose.createConnection(URI, {
  useNewUrlParser: true, useFindAndModify: false, useUnifiedTopology: true, useCreateIndex: true,
},
() => console.log('WaivioDB connection successful!'));
