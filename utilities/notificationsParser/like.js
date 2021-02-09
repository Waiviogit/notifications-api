const _ = require('lodash');
const { PRODUCTION_HOST } = require('constants/index');
const { subscriptionModel, postModel } = require('models');
const { shareMessageBySubscribers } = require('telegram/broadcasts');
const { NOTIFICATIONS_TYPES } = require('constants/notificationTypes');
const { getUsers, checkUserNotifications } = require('utilities/helpers/notificationsHelper');

const prepareMyLikeNotifications = async ({
  likes, users, posts, notifications,
}) => {
  for (const vote of likes) {
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
    await shareMessageBySubscribers(
      vote.voter,
      `${vote.voter} liked ${post.title}`,
      `${PRODUCTION_HOST}@${vote.author}/${vote.permlink}`,
    );
  }
};

const prepareLikeNotifications = async ({
  likes, users, posts, type, notifications,
}) => {
  for (const vote of likes) {
    if (!await checkUserNotifications({
      user: _.find(users, { name: vote.author }), type,
    })) continue;
    if (_.get(vote, 'guest_author', false)) vote.author = vote.guest_author;
    const post = _.find(posts, (el) => el.author === vote.author && el.permlink === vote.permlink);
    if (!post) continue;
    const likesCount = _
      .chain(post.active_votes)
      .filter((v) => v.percent > 0 && !_.includes(_.map(likes, 'voter'), v.voter))
      .get('length')
      .value();
    const newTop = [];
    if (likesCount > 5) {
      newTop.push(..._
        .chain(post.active_votes).orderBy(['weight'], 'desc')
        .map(((el) => el.weight))
        .slice(0, 3)
        .value());
      vote.weight > newTop[2] && newTop.push(vote.weight);
    }
    const { result: followVoter } = await subscriptionModel
      .find({ follower: vote.author, following: vote.voter });
    if (likesCount > 5 && vote.weight < _.get(newTop, '2', 0) && !followVoter) continue;
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
    let telegramMessage = likesCount
      ? `${vote.voter} and ${likesCount} others liked your post ${post.title}`
      : `${vote.voter} liked ${post.title}`;
    const url = `${PRODUCTION_HOST}@${vote.author}/${vote.permlink}`;
    if (notifications.length) {
      const samePostLike = _.findLast(
        notifications, (el) => el[1].author === vote.author && el[1].permlink === vote.permlink,
      );
      if (samePostLike) {
        const topArr = samePostLike[1].newTop.sort(((a, b) => b - a));
        if (followVoter || vote.weight > _.get(topArr, '2', 0) || samePostLike[1].likesCount < 5) {
          topArr.push(vote.weight);
          notification[1].newTop = topArr;
          notification[1].likesCount = samePostLike[1].likesCount + 1;
          notifications.push(notification);
          telegramMessage = `${vote.voter} and ${samePostLike[1].likesCount + 1} others liked your post ${post.title}`;
          await shareMessageBySubscribers(vote.author, telegramMessage, url);
          continue;
        }
        continue;
      } else {
        notification[1].newTop.push(vote.weight);
        notifications.push(notification);
        await shareMessageBySubscribers(vote.author, telegramMessage, url);
        continue;
      }
    }
    notification[1].newTop.push(vote.weight);
    notifications.push(notification);
    await shareMessageBySubscribers(vote.author, telegramMessage, url);
  }
  _.forEach(notifications, (n) => { n[1] = _.omit(n[1], 'newTop'); });
};

module.exports = async ({ likes }) => {
  const notifications = [];
  _.forEach(likes, (like) => {
    if (_.get(like, 'guest_author')) like.author = like.guest_author;
  });

  const { users } = await getUsers({ arr: [..._.uniq(_.map(likes, 'author')), ..._.map(likes, 'voter')] });
  const { posts = [] } = await postModel.getManyPosts(
    _.chain(likes)
      .uniqWith((x, y) => x.author === y.author && x.permlink === y.permlink)
      .map((v) => ({ author: v.guest_author || v.author, permlink: v.permlink }))
      .value(),
  );
  if (!posts) return notifications;
  await prepareLikeNotifications({
    likes, users, posts, type: NOTIFICATIONS_TYPES.LIKE, notifications,
  });
  await prepareMyLikeNotifications({
    likes, users, posts, notifications,
  });

  return notifications;
};
