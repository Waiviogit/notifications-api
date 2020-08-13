const { PRODUCTION_HOST } = require('../../constants');
const { userModel, notifiersModel } = require('../../models');

exports.checkAndSubscribe = async (name, chatId, bot) => {
  const { error, user } = await userModel.findOne(name);
  if (error || !user) return bot.sendMessage(chatId, `Sorry, user ${name} not found`);
  await notifiersModel.updateOne(
    { condition: { chatId }, updateData: { $addToSet: { subscribedUsers: name } } },
  );
  return this.showSubscriptions(chatId, bot);
};

exports.showSubscriptions = async (chatId, bot) => {
  const { notifier } = await notifiersModel.getOne({ chatId });
  const emptySubscribesText = `${'-'.repeat(80)}\n You are not subscribed to any user, send me a username to subscribe\n ${'-'.repeat(80)}`;
  if (!notifier) {
    await notifiersModel.create({ chatId });
    return bot.sendMessage(chatId, emptySubscribesText);
  } if (!notifier.subscribedUsers.length) return bot.sendMessage(chatId, emptySubscribesText);
  const successMessage = 'You are subscribed to:';
  const keyboard = [];
  for (const user of notifier.subscribedUsers) {
    keyboard.push([{ text: user, url: `${PRODUCTION_HOST}@${user}` }, { text: `Unsubscribe ${user}`, callback_data: `unsubscribe:${user}` }]);
  }
  return bot.sendMessage(chatId, successMessage, {
    reply_markup: {
      inline_keyboard: keyboard,
      remove_keyboard: true,
    },
  });
};
