const mongoose = require('mongoose');
const Redis = require('ioredis');
const User = require('./model/user');
const sendNotification = require('./notifications/notificationService.js');
const dotenv = require('dotenv');
dotenv.config();

const redisClient = new Redis({
  host: process.env.REDIS_HOST,
  port: process.env.REDIS_PORT,
});

mongoose.connect(process.env.MONGO_URL, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  serverSelectionTimeoutMS: 10000  // 10 saniye zaman aşımı
}).then(() => {
  console.log('MongoDB bağlantısı başarılı');
}).catch(err => {
  console.error('MongoDB bağlantı hatası:', err);
});

redisClient.on('connect', () => {
  console.log('Redis bağlantı başarılı');
});

redisClient.on('error', (err) => {
  console.error('Redis client error in subscriber:', err);
});

redisClient.on('ready', async () => {
  console.log('Redis client is ready in subscriber');
  try {
    await redisClient.subscribe('rateChange');
    console.log('Subscribed successfully to rateChange');
  } catch (err) {
    console.error('Failed to subscribe: ', err.message);
  }
});

redisClient.on('message', async (channel, message) => {
  if (channel === 'rateChange') {
    try {
      const rate = JSON.parse(message);
      console.log('Rate change detected:', rate);

      // Kullanıcı hedef fiyatına ulaşıldığında bildirim gönderme
      const users = await User.find({ 'targets.currency': rate.currency });
      users.forEach(user => {
        user.targets.forEach(target => {
          if (target.currency === rate.currency && rate.rate <= target.targetPrice) {
            sendNotification(user.email, `Your target price for ${rate.currency} ${target.targetPrice} has been reached! Current rate is ${rate.rate}`);
          }
        });
      });
    } catch (error) {
      console.error('Error processing message:', error);
    }
  } else {
    console.log("Unhandled channel:", channel);
  }
});

module.exports = redisClient;
