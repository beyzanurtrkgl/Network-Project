const express = require('express');
const axios = require('axios');
const app = express();
const PORT = process.env.PORT || 3000;

const API_KEY = 'QEJHAMPT0I2OSI0S'; 
const BASE_URL = 'https://www.alphavantage.co/query';

app.get('/', (req, res) => {
  res.send('Exchange Notifier API');
});

app.get('/currency/:from_currency/to/:to_currency', async (req, res) => {
  const from_currency = req.params.from_currency;
  const to_currency = req.params.to_currency;
  try {
    const response = await axios.get(`${BASE_URL}?function=CURRENCY_EXCHANGE_RATE&from_currency=${from_currency}&to_currency=${to_currency}&apikey=${API_KEY}`);
    
    if (response.data && response.data['Realtime Currency Exchange Rate']) {
      const exchangeRate = response.data['Realtime Currency Exchange Rate'];
      res.json({
        "currency": from_currency,
        "rate": parseFloat(exchangeRate['5. Exchange Rate']),
        "timestamp": exchangeRate['6. Last Refreshed'],
        "source": "Alpha Vantage"
      });
    } else {
      res.status(500).json({ error: 'An error occurred while fetching currency exchange rate.' });
    }
  } catch (error) {
    res.status(500).json({ error: 'An error occurred while fetching currency exchange rate.' });
  }
});


app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});



