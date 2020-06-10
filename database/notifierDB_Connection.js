const mongoose = require('mongoose');
const config = require('../config');

const URI = `mongodb://${config.db.host}:${config.db.port}/${config.db.database}`;

module.exports = mongoose.createConnection(URI, {
  useNewUrlParser: true, useFindAndModify: false, useUnifiedTopology: true, useCreateIndex: true,
},
() => console.log('NotifierDB connection successful!'));
