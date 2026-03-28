const Redis = require('ioredis');
const url = 'redis-15519.crce292.ap-south-1-2.ec2.cloud.redislabs.com:15519';
const redis = new Redis(url);

redis.on('error', (err) => {
  console.log('Redis error:', err.message);
  process.exit(1);
});

redis.on('connect', () => {
  console.log('Redis connected');
  process.exit(0);
});

setTimeout(() => {
  console.log('Connection timeout');
  process.exit(1);
}, 5000);
