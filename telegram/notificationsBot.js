const TelegramBot = require('node-telegram-bot-api');
const { notifiersModel } = require('../models');
const subscribeHelper = require('../utilities/helpers/subscribeHelper');
const keyboards = require('./keyboards');

const TELEGRAM_BOT_TOKEN = '1174166838:AAHCMuKln0WklTnWynZP7WrZ-fWzvWT2yYw';

class WaivioBot {
  constructor() {
    this.bot = new TelegramBot(process.env.BOT_TOKEN || TELEGRAM_BOT_TOKEN, {
      polling: {
        interval: 300,
        autoStart: true,
        params: {
          timeout: 10,
        },
      },
    });

    this.bot.on('message', async (msg) => {
      switch (msg.text) {
        case '/start':
          const { notifier, error } = await notifiersModel.getOne({ chatId: msg.chat.id });
          if (error) return console.error(error.message);
          if (!notifier) await notifiersModel.create({ chatId: msg.chat.id });
          await this.bot.sendMessage(msg.chat.id, 'Choose your subscription:', {
            reply_markup: {
              inline_keyboard: keyboards.selectSubscribtion,
              remove_keyboard: true,
            },
          });
          break;
        case '/showsubscriptions':
          return subscribeHelper.showSubscriptions(msg.chat.id, this.bot);
        default:
          return subscribeHelper.checkAndSubscribe(msg.text.toLowerCase(), msg.chat.id, this.bot);
      }
    });

    this.bot.on('callback_query', async (query) => {
      const { chat } = query.message;
      switch (query.data) {
        case 'notifications':
          await this.bot.sendMessage(chat.id, 'Please send me the username whose notifications you want to subscribe to. Or press /showsubscriptions to look at your subscriptions');
          break;
        default:
          const data = query.data.split(':');
          if (data[0] === 'unsubscribe') {
            await notifiersModel.updateOne(
              { condition: { chatId: chat.id }, updateData: { $pull: { subscribedUsers: data[1] } } },
            );
            return subscribeHelper.showSubscriptions(chat.id, this.bot);
          }
      }
    });
  }
}

const Bot = new WaivioBot();

module.exports = { WaivioBot: Bot };
