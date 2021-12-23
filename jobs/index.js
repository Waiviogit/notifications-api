const cron = require('cron');
const engineBlockDelay = require('./engineBlockDelay');

const engineBlockDelayJob = cron.job('*/10 * * * *', engineBlockDelay, null, false, null, null, false);

engineBlockDelayJob.start();
