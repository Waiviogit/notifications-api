const _ = require('lodash');
const { PRODUCTION_HOST } = require('constants/index');
const {
  campaignsModel,
  campaignsV2Model,
  blacklistModel,
  threadModel,
} = require('models');
const { RESERVATION_TITLES } = require('constants/campaignsData');
const { shareMessageBySubscribers } = require('telegram/broadcasts');
const { NOTIFICATIONS_TYPES, BELL_NOTIFICATIONS } = require('constants/notificationTypes');
const {
  getUsers, checkUserNotifications, getServiceBots,
  addNotificationForSubscribers, addNotificationsWobjectSubscribers,
  getThreadAuthorSubscriptions,
} = require('utilities/helpers/notificationsHelper');
const { getThreadBellNotifications } = require('../helpers/notificationsHelper');

const checkBlacklist = async ({ guideName, user }) => {
  const blacklist = await blacklistModel.getBlacklist({ user: guideName });
  return blacklist.includes(user);
};

module.exports = async (params) => {
  const notifications = [];
  let notification;
  const isRootPost = !params.parent_author;
  /** Find replies */
  const { users: authors } = await getUsers({ arr: [params.parent_author, params.author] });

  // post
  if (isRootPost) {
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

    if (!_.isEmpty(params.wobjects)) {
      const { wobjNotifications } = await addNotificationsWobjectSubscribers(params);
      notifications.push(...wobjNotifications);
    }

    if (await checkUserNotifications(
      { user: _.find(authors, { name: params.author }), type: NOTIFICATIONS_TYPES.MY_POST },
    )) {
      await shareMessageBySubscribers(params.author, `${params.author} published a post`,
        `${PRODUCTION_HOST}@${params.author}/${params.permlink}`);
      notifications.push([params.author, notification]);
    }
    // comment
  } else {
    const { result: campaign } = await campaignsModel.findOne(
      { activation_permlink: params.parent_permlink },
    );
    const { result: campaignV2 } = await campaignsV2Model.findOne(
      { filter: { activationPermlink: params.parent_permlink } },
    );
    const thread = await threadModel
      .findOneByAuthorPermlink({ author: params.author, permlink: params.permlink });

    if (await checkUserNotifications(
      { user: _.find(authors, { name: params.author }), type: NOTIFICATIONS_TYPES.MY_COMMENT },
    )) {
      notification = {
        timestamp: Math.round(new Date().valueOf() / 1000),
        type: NOTIFICATIONS_TYPES.MY_COMMENT,
        permlink: params.permlink,
        author: params.author,
        parentAuthor: params.parent_author,
      };
      notifications.push([params.author, notification]);

      await shareMessageBySubscribers(params.author, `${params.author} reply to ${params.parent_author}`,
        `${PRODUCTION_HOST}@${params.author}/${params.permlink}`);
    }
    if (thread) {
      const threadNotifications = await getThreadBellNotifications(thread);
      const threadAuthorNotifications = await getThreadAuthorSubscriptions(thread);

      for (const threadN of threadNotifications) {
        const [thUser, thNotification] = threadN;
        await shareMessageBySubscribers(
          thUser,
          `${thNotification.author} published thread to ${thNotification.authorPermlink}`,
          `${PRODUCTION_HOST}object/${thNotification.authorPermlink}/threads`,
        );
      }

      const aboutThread = thread?.hashtags?.length
          ? thread.hashtags.join(', ')
          : (thread?.mentions ?? []).join(', ')

      for (const threadAuthorNotification of threadAuthorNotifications) {
        const [thUser, thNotification] = threadAuthorNotification;
        await shareMessageBySubscribers(
          thUser,
          `${thNotification.author} published thread about ${aboutThread}`,
          `${PRODUCTION_HOST}@${thread.author}/threads`,
        );
      }
      notifications.push(...threadNotifications);
      notifications.push(...threadAuthorNotifications);
    }
    if (campaign) {
      const blacklisted = await checkBlacklist(
        { guideName: campaign.guideName, user: params.author },
      );
      if (blacklisted) return notifications;
      const isReleased = params.title === RESERVATION_TITLES.CANCELED;
      const urlQuery = isReleased
        ? `?campaign=${campaign.name.replace(/ /g, '%20')}&released=Released`
        : `?campaign=${campaign.name.replace(/ /g, '%20')}&reserved=Reserved`;
      notification = {
        timestamp: Math.round(new Date().valueOf() / 1000),
        type: NOTIFICATIONS_TYPES.CAMPAIGN_RESERVATION,
        campaignName: campaign.name,
        author: params.author,
        isReleased,
      };
      notifications.push([params.parent_author, notification]);
      await shareMessageBySubscribers(
        params.parent_author,
        `${params.author} ${isReleased ? 'released' : 'made'} a reservation for ${campaign.name}`,
        `${PRODUCTION_HOST}rewards/guideHistory${urlQuery}`,
      );
      return notifications;
    }
    if (campaignV2) {
      const blacklisted = await checkBlacklist(
        { guideName: campaignV2.guideName, user: params.author },
      );
      if (blacklisted) return notifications;
      const isReleased = params.title === RESERVATION_TITLES.CANCELED;
      const urlQuery = isReleased
        ? `?campaign=${campaignV2.name.replace(/ /g, '%20')}&released=Released`
        : `?campaign=${campaignV2.name.replace(/ /g, '%20')}&reserved=Reserved`;
      notification = {
        timestamp: Math.round(new Date().valueOf() / 1000),
        type: NOTIFICATIONS_TYPES.CAMPAIGN_RESERVATION,
        campaignName: campaignV2.name,
        author: params.author,
        isReleased,
        newCampaigns: true,
      };
      notifications.push([params.parent_author, notification]);
      await shareMessageBySubscribers(
        params.parent_author,
        `${params.author} ${isReleased ? 'released' : 'made'} a reservation for ${campaignV2.name}`,
        `${PRODUCTION_HOST}rewards-new/reservations${urlQuery}`,
      );
      return notifications;
    }
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
      const replyMessage = params.reply
        ? `${params.author} has replied to ${params.parent_author} comment`
        : `${params.author} commented on ${params.parent_author} post`;

      await shareMessageBySubscribers(params.parent_author,
        replyMessage,
        `${PRODUCTION_HOST}@${params.parent_author}/${params.parent_permlink}`);
    }
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
    if (error) {
      console.error(error);
      return notifications;
    }
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
