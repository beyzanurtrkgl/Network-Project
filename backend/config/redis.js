const Redis = require('ioredis');
require('dotenv').config();

const redisClient = new Redis({
  host: process.env.REDIS_HOST,
  port: process.env.REDIS_PORT,
});

redisClient.on('connect', () => {
  console.log('Redis bağlantı başarılı');
});

redisClient.on('error', (err) => {
  console.error('Redis bağlantı hatası:', err);
});

module.exports = redisClient;
