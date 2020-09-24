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

  const votes = _
    .chain(post.active_votes)
    .filter((v) => (v.weight >= 0 && v.percent > 0))
    .orderBy(['weight'], 'desc')
    .value();

  const { result: followVoter } = await subscriptionModel
    .find({ follower: params.author, following: params.voter });
  const voteInTop = !!_.find(votes.slice(0, 5), (v) => v.voter === params.voter);
  if (votes.length > 10 && !voteInTop && !followVoter) return;

  const notification = [params.author, {
    type,
    voter: params.voter,
    likesCount: votes.length - 1,
    title: post.title,
    author: params.author,
    permlink: params.permlink,
    timestamp: Math.round(new Date().valueOf() / 1000),
  }];

  const telegramMessage = votes.length === 1
    ? `${params.voter} liked ${post.title}`
    : `${params.voter} and ${votes.length - 1} others liked your post ${post.title}`;
  const url = `${PRODUCTION_HOST}@${params.author}/${params.permlink}`;
  notifications.push(notification);
  await shareMessageBySubscribers(params.author, telegramMessage, url);
};

module.exports = async (params) => {
  const notifications = [];
  if (_.get(params, 'guest_author', false)) params.author = params.guest_author;
  const { users } = await getUsers({ arr: [params.author, params.voter] });
  const { post } = await postModel.findOne({
    author: params.author,
    permlink: params.permlink,
  }, {
    author: 1, permlink: 1, title: 1, active_votes: 1,
  });
  if (!post) return notifications;
  await prepareLikeNotifications({
    params, users, post, type: NOTIFICATIONS_TYPES.LIKE, notifications,
  });
  await prepareMyLikeNotifications({
    params, users, post, notifications,
  });

  return notifications;
};
