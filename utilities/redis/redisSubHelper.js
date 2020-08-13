exports.subscribe = (subscriber, messageKeys, onMessageCallback) => {
  subscriber.on('ready', (error) => {
    if (error) {
      console.error('ConnectionError: Unable connect to Redis', error);
      process.exit();
    } else {
      console.log('OK: Redis connection is ready');
      subscriber.on('message', onMessageCallback);
      subscriber.subscribe(...messageKeys);
    }
  });
};
