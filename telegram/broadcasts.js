const { notifiersModel } = require('../models');
const { WaivioBot } = require('./notificationsBot');

exports.shareMessageBySubscribers = async (user, message, url) => {
  const { notifiers } = await notifiersModel.find({ condition: { subscribedUsers: user } });
  if (!notifiers || !notifiers.length) return;
  for (const notifier of notifiers) {
    await WaivioBot.bot.sendMessage(notifier.chatId, message, {
      reply_markup: {
        inline_keyboard: [[{ text: 'Go to website', url }]],
      },
    });
  }
};
