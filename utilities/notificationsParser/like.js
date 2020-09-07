const _ = require('lodash');
const { PRODUCTION_HOST } = require('constants/index');
const { subscriptionModel, postModel } = require('models');
const { shareMessageBySubscribers } = require('telegram/broadcasts');
const { NOTIFICATIONS_TYPES } = require('constants/notificationTypes');
const { getUsers, checkUserNotifications } = require('utilities/helpers/notificationsHelper');

const prepareMyLikeNotifications = async ({
  params, users, post, notifications,
}) => {
  if (!await checkUserNotifications({
    user: _.find(users, { name: params.voter }), type: NOTIFICATIONS_TYPES.MY_LIKE,
  })) return;

  notifications.push([params.voter, {
    timestamp: Math.round(new Date().valueOf() / 1000),
    type: NOTIFICATIONS_TYPES.MY_LIKE,
    permlink: params.permlink,
    author: params.author,
    title: post.title,
    voter: params.voter,
  }]);
  await shareMessageBySubscribers(
    params.voter,
    `${params.voter} liked ${post.title}`,
    `${PRODUCTION_HOST}@${params.author}/${params.permlink}`,
  );
};

const prepareLikeNotifications = async ({
  params, users, post, type, notifications,
}) => {
  if (!await checkUserNotifications({
    user: _.find(users, { name: params.author }), type,
  })) return;
  if (_.get(params, 'guest_author', false)) params.author = params.guest_author;

  const likesCount = _
    .chain(post.active_votes)
    .filter((v) => (v.weight >= 0 && v.percent > 0))
    .get('length')
    .value();
  const topFive = [];
  if (likesCount > 10) {
    topFive.push(..._
      .chain(post.active_votes)
      .orderBy(['weight'], 'desc')
      .map('voter')
      .slice(0, 5)
      .value());
  }
  const { result: followVoter } = await subscriptionModel
    .find({ follower: params.author, following: params.voter });
  if (likesCount > 10 && !_.includes(topFive, params.voter) && !followVoter) return;

  const notification = [params.author, {
    type,
    voter: params.voter,
    likesCount: likesCount - 1,
    title: post.title,
    author: params.author,
    permlink: params.permlink,
    timestamp: Math.round(new Date().valueOf() / 1000),
  }];

  const telegramMessage = likesCount
    ? `${params.voter} and ${likesCount - 1} others liked your post ${post.title}`
    : `${params.voter} liked ${post.title}`;
  const url = `${PRODUCTION_HOST}@${params.author}/${params.permlink}`;
  notifications.push(notification);
  await shareMessageBySubscribers(params.author, telegramMessage, url);
};

module.exports = async (params) => {
  const notifications = [];

  const { users } = await getUsers({ arr: [params.author, params.voter] });
  const { post } = await postModel.findOne({
    author: params.author,
    permlink: params.permlink,
  }, {
    author: 1, permlink: 1, title: 1, active_votes: 1,
  });
  if (!post) return;
  await prepareLikeNotifications({
    params, users, post, type: NOTIFICATIONS_TYPES.LIKE, notifications,
  });
  await prepareMyLikeNotifications({
    params, users, post, notifications,
  });

  return notifications;
};
