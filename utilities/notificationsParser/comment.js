const _ = require('lodash');
const { PRODUCTION_HOST } = require('constants/index');
const { shareMessageBySubscribers } = require('telegram/broadcasts');
const { NOTIFICATIONS_TYPES, BELL_NOTIFICATIONS } = require('constants/notificationTypes');
const {
  getUsers, checkUserNotifications, getServiceBots,
  addNotificationForSubscribers,
} = require('../helpers/notificationsHelper');

module.exports = async (params) => {
  const notifications = [];
  let notification;
  const isRootPost = !params.parent_author;
  /** Find replies */
  const { users: authors } = await getUsers({ arr: [params.parent_author, params.author] });
  switch (isRootPost) {
    case true:
      notification = {
        timestamp: Math.round(new Date().valueOf() / 1000),
        type: NOTIFICATIONS_TYPES.MY_POST,
        permlink: params.permlink,
        author: params.author,
        title: params.title,
      };
      await addNotificationForSubscribers({
        changeType: BELL_NOTIFICATIONS.BELL_POST,
        notificationData: notification,
        user: params.author,
        notifications,
      });

      if (await checkUserNotifications(
        { user: _.find(authors, { name: params.author }), type: NOTIFICATIONS_TYPES.MY_POST },
      )) {
        await shareMessageBySubscribers(params.author, `${params.author} published a post`,
          `${PRODUCTION_HOST}@${params.author}/${params.permlink}`);
        notifications.push([params.author, notification]);
      }
      break;

    case false:
      if (await checkUserNotifications(
        { user: _.find(authors, { name: params.parent_author }), type: NOTIFICATIONS_TYPES.REPLY },
      )) {
        notification = {
          timestamp: Math.round(new Date().valueOf() / 1000),
          parent_permlink: params.parent_permlink,
          type: NOTIFICATIONS_TYPES.REPLY,
          permlink: params.permlink,
          author: params.author,
          reply: params.reply,
        };
        notifications.push([params.parent_author, notification]);

        await shareMessageBySubscribers(params.parent_author,
          `${params.author} replied to ${params.parent_author} comment`,
          `${PRODUCTION_HOST}@${params.parent_author}/${params.parent_permlink}`);
      }
      if (await checkUserNotifications(
        { user: _.find(authors, { name: params.author }), type: NOTIFICATIONS_TYPES.MY_COMMENT },
      )) {
        notification = {
          timestamp: Math.round(new Date().valueOf() / 1000),
          type: NOTIFICATIONS_TYPES.MY_COMMENT,
          permlink: params.permlink,
          author: params.author,
        };
        notifications.push([params.author, notification]);

        await shareMessageBySubscribers(params.author, `${params.author} write a comment`,
          `${PRODUCTION_HOST}@${params.author}/${params.permlink}`);
      }
      break;
  }

  /** Find mentions */
  const pattern = /(@[a-z][\_\-.a-z\d]+[a-z\d])/gi;
  const content = `${params.title} ${params.body}`;
  const mentions = _.without(_
    .uniq(
      (content.match(pattern) || [])
        .join('@')
        .toLowerCase()
        .split('@'),
    )
    .filter((n) => n),
  params.author)
    .slice(0, 9); // Handle maximum 10 mentions per post

  if (mentions.length) {
    const { users, error } = await getUsers({ arr: mentions });
    if (error) return console.error(error);
    const serviceBots = await getServiceBots();
    for (const mention of mentions) {
      if (!await checkUserNotifications(
        { user: _.find(users, { name: mention }), type: NOTIFICATIONS_TYPES.MENTION },
      ) || _.includes(serviceBots || [], params.author)) continue;

      notification = {
        timestamp: Math.round(new Date().valueOf() / 1000),
        type: NOTIFICATIONS_TYPES.MENTION,
        permlink: params.permlink,
        is_root_post: isRootPost,
        author: params.author,
      };
      notifications.push([mention, notification]);
      const commentOrPost = isRootPost ? 'post' : 'comment';
      await shareMessageBySubscribers(mention,
        `${params.author} mentioned ${mention} in a ${commentOrPost}`,
        `${PRODUCTION_HOST}@${params.author}/${params.permlink}`);
    }
  }
  return notifications;
};
