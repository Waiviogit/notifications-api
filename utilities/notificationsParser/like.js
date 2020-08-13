const _ = require('lodash');
const { subscriptionModel, postModel } = require('../../models');
const { NOTIFICATIONS_TYPES } = require('../../constants/notificationTypes');
const { getUsers, checkUserNotifications } = require('../helpers/notificationsHelper');

const prepareMyLikeNotifications = async ({
  params, users, posts, notifications,
}) => {
  for (const vote of params.votes) {
    if (!await checkUserNotifications({
      user: _.find(users, { name: vote.voter }), type: NOTIFICATIONS_TYPES.MY_LIKE,
    })) continue;
    const post = _.find(posts, (el) => el.author === vote.author && el.permlink === vote.permlink);
    if (!post) continue;
    notifications.push([vote.voter, {
      timestamp: Math.round(new Date().valueOf() / 1000),
      type: NOTIFICATIONS_TYPES.MY_LIKE,
      permlink: vote.permlink,
      author: vote.author,
      title: post.title,
      voter: vote.voter,
    }]);
  }
};

const prepareLikeNotifications = async ({
  params, users, posts, type, notifications,
}) => {
  for (const vote of params.votes) {
    if (!await checkUserNotifications({
      user: _.find(users, { name: vote.author }), type,
    })) continue;
    if (_.get(vote, 'guest_author', false)) vote.author = vote.guest_author;
    const post = _.find(posts, (el) => el.author === vote.author && el.permlink === vote.permlink);
    if (!post) continue;

    const likesCount = _
      .chain(post.active_votes)
      .filter((v) => v.weight > 0)
      .get('length')
      .value();
    const newTop = [];
    if (likesCount > 10) {
      newTop.push(..._
        .chain(post.active_votes).orderBy(['weight'], 'desc')
        .map(((el) => el.weight))
        .slice(0, 5)
        .value());
      vote.weight > newTop[4] && newTop.push(vote.weight);
    }
    const { result: followVoter } = await subscriptionModel
      .find({ follower: vote.author, following: vote.voter });
    if (likesCount > 10 && vote.weight < _.get(newTop, '4', 0) && !followVoter) continue;

    const notification = [vote.author, {
      type,
      voter: vote.voter,
      likesCount,
      title: post.title,
      newTop,
      author: vote.author,
      permlink: vote.permlink,
      timestamp: Math.round(new Date().valueOf() / 1000),
    }];
    if (notifications.length) {
      const samePostLike = _.findLast(
        notifications, (el) => el[1].author === vote.author && el[1].permlink === vote.permlink,
      );

      if (samePostLike) {
        const topArr = samePostLike[1].newTop.sort(((a, b) => b - a));
        if (followVoter || vote.weight > _.get(topArr, '4', 0)) {
          topArr.push(vote.weight);
          notification[1].newTop = topArr;
          notification[1].likesCount = samePostLike[1].likesCount + 1;
          notifications.push(notification);
          continue;
        }
        continue;
      } else {
        notifications.push(notification);
        continue;
      }
    }
    notifications.push(notification);
  }
};

module.exports = async (params) => {
  const notifications = [];
  const usersArr = [...new Set(_.concat(_.map(params.votes, 'author'), _.map(params.votes, 'voter')))];
  const { users } = await getUsers({ arr: usersArr });

  const { posts } = await postModel.find({
    author: { $in: _.map(params.votes, (el) => el.guest_author || el.author) },
    permlink: { $in: _.map(params.votes, 'permlink') },
  }, {
    author: 1, permlink: 1, title: 1, active_votes: 1,
  });

  await prepareLikeNotifications({
    params, users, posts, type: NOTIFICATIONS_TYPES.LIKE, notifications,
  });
  await prepareMyLikeNotifications({
    params, users, posts, notifications,
  });

  return notifications;
};
