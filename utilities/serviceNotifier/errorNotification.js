const axios = require('axios');

const TELEGRAM_API = {
  production: {
    HOST: 'https://www.waivio.com',
    BASE_URL: '/telegram-api',
    SENTRY_ERROR: '/sentry',
    WARNING_MESSAGE: '/cron-message',
  },
  staging: {
    HOST: 'https://waiviodev.com',
    BASE_URL: '/telegram-api',
    SENTRY_ERROR: '/sentry',
    WARNING_MESSAGE: '/cron-message',
  },
  development: {
    HOST: 'http://localhost:8000',
    BASE_URL: '/telegram-api',
    SENTRY_ERROR: '/sentry',
    WARNING_MESSAGE: '/cron-message',
  },
};

const API_BY_ENV = TELEGRAM_API[process.env.NODE_ENV] || TELEGRAM_API.development;

const sendTelegramWarning = async ({ message }) => {
  try {
    const result = await axios.post(
      `${API_BY_ENV.HOST}${API_BY_ENV.BASE_URL}${API_BY_ENV.WARNING_MESSAGE}`,
      {
        cron_service_key: process.env.CRON_SERVICE_KEY,
        message,
      },
      {
        timeout: 15000,
      },
    );
    return { result: result.data };
  } catch (error) {
    console.log('sendTelegramWarning Error:');
    console.log(error.message);
    return { error };
  }
};

module.exports = {
  sendTelegramWarning,
};
