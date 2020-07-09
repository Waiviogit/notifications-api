const { notifiersModel } = require('../models');


exports.shareMessageBySubscribers = async (user, message, url) => {
  if (process.env.NODE_ENV !== 'production') return;
  const { WaivioBot } = require('./notificationsBot');
  const { notifiers } = await notifiersModel.find({ condition: { subscribedUsers: user } });
  if (!notifiers || !notifiers.length) return;
  for (const notifier of notifiers) {
    await WaivioBot.bot.sendMessage(notifier.chatId, message, {
      reply_markup: {
        inline_keyboard: [[{ text: 'Go to website', url }], [{ text: `Unsubscribe ${user}`, callback_data: `unsubscribe:${user}` }]],
      },
    });
  }
};