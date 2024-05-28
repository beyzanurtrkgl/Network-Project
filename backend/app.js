const express = require('express');
const app = express();
const bodyParser = require("body-parser");
const axios = require('axios');
const redisClient = require('./config/redis');
const dotenv = require('dotenv');
const cron = require('node-cron');
const User = require('./model/user');
dotenv.config();
require('./config/database').connect();

const { EXCHANGE_RATE_API_KEY } = process.env;
const BASE_URL = `https://v6.exchangerate-api.com/v6/${EXCHANGE_RATE_API_KEY}`;
const port = process.env.PORT;

app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.json());

const userAuthRoutes = require("./routes/userAuth");
app.use('/routes', userAuthRoutes);

const userRoutes = require('./routes/set-target');
app.use('/user', userRoutes);

// Dinamik olarak kullanıcı hedeflerini kontrol et ve döviz kuru verisini çek ve Redis'e yayınla
async function fetchAndPublishRates() {
  try {
    const users = await User.find();
    const uniqueCurrencies = new Set();

    // Kullanıcıların hedef döviz kurlarını belirle
    users.forEach(user => {
      user.targets.forEach(target => {
        uniqueCurrencies.add(target.currency);
      });
    });

    // Her döviz kuru için veriyi çek ve Redis'e yayınla
    for (const currency of uniqueCurrencies) {
      console.log(`Fetching exchange rate for ${currency} to TRY`);
      const response = await axios.get(`${BASE_URL}/pair/${currency}/TRY`);
      console.log('API Response:', response.data);

      if (response.data && response.data.conversion_rate) {
        const rateData = {
          currency: currency,
          rate: response.data.conversion_rate,
          timestamp: new Date().toISOString(),
          source: 'ExchangeRate-API'
        };

        console.log('Fetched rate data:', rateData);

        redisClient.publish('rateChange', JSON.stringify(rateData), (err, reply) => {
          if (err) {
            console.error('Error publishing to Redis:', err);
          } else {
            console.log('Successfully published to Redis:', reply);
          }
        });
      } else {
        console.error('Invalid API response:', response.data);
      }
    }
  } catch (error) {
    console.error('Error fetching currency exchange rate:', error);
  }
}

// GET /currency/:from_currency/to/:to_currency endpoint'i
app.get('/currency/:from_currency/to/:to_currency', async (req, res) => {
  const { from_currency, to_currency } = req.params;
  try {
    console.log(`Fetching exchange rate for ${from_currency} to ${to_currency}`);
    const response = await axios.get(`${BASE_URL}/pair/${from_currency}/${to_currency}`);
    console.log('API Response:', response.data);

    if (response.data && response.data.conversion_rate) {
      const rateData = {
        currency: from_currency,
        rate: response.data.conversion_rate,
        timestamp: new Date().toISOString(),
        source: 'ExchangeRate-API'
      };

      console.log('Fetched rate data:', rateData);

      redisClient.publish('rateChange', JSON.stringify(rateData), (err, reply) => {
        if (err) {
          console.error('Error publishing to Redis:', err);
        } else {
          console.log('Successfully published to Redis:', reply);
        }
      });

      res.json(rateData);
    } else {
      console.error('Invalid API response:', response.data);
      res.status(500).json({ error: 'An error occurred while fetching currency exchange rate.' });
    }
  } catch (error) {
    console.error('Error fetching currency exchange rate:', error);
    res.status(500).json({ error: 'An error occurred while fetching currency exchange rate.' });
  }
});

// Zamanlanmış görev: Her dakika döviz kuru kontrolü
cron.schedule('* * * * *', () => {
  console.log('Running a scheduled task');
  fetchAndPublishRates();
});

redisClient.on('ready', () => {
  console.log('Redis client is ready');
  console.log(`Process.env.PORT: ${process.env.PORT}`);
  console.log(`Port variable: ${port}`);
  app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
  });
});

redisClient.on('error', (err) => {
  console.error('Redis connection error:', err);
});

module.exports = app;
