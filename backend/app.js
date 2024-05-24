require("dotenv").config();
require("./config/database").connect();
const axios = require('axios');
const express = require('express');
const app = express();
const User = require("./model/user");
const bodyParser = require("body-parser");
const jwt = require("jsonwebtoken");
const auth = require("./middleware/auth");
const { JWT_KEY } = process.env; 

app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.json());


/**********************************Kullanıcı Kayıt******************************************** */
// Kullanıcı oluşturma
app.post('/register', async (req, res) => {
  console.log("Register endpoint çalışıyor");
  //hata kontrolü için try catch 
  try {
    const {username , email, password } = req.body;
    console.log("Gelen istek verisi:", req.body);

    // Kullanıcının username, email ve password yazdığını kontrol et
    if (!(username && email && password)) {
      console.log("Boş alan bırakılmaz");
      return res.status(400).send("Please enter username, email and password");
    }

    // Kullanıcı daha önce kayıt olmuş mu kontrol et
    const oldUser = await User.findOne({ email });
    if (oldUser) {
      console.log("Bu email daha önce kullanılmış");
      return res.status(400).send("This email has been used before");
    }

    // Yeni kullanıcı oluşturmak
    const user = await User.create({
      username,
      email,
      password
      
    });
    console.log("Yeni kullanıcı oluşturuldu:", user);

    // Kullanıcıyı JSON formatında yanıt olarak döndür
    return res.status(200).json(user);

  } catch (err) {
    console.error("Bir hata oluştu:", err);
    return res.status(500).send("Internal Server Error");
  }
});

//kullanıcı girişi 
app.post('/login', async (req, res) => {
  console.log("aaa")
  //hataları kontrol etmek için try 
  try{
    
    //inputları al
    const {email, password} = req.body; 
    
    // Kullanıcının username, email ve password yazdığını kontrol et 
    if(!(email && password)){
      return res.status(400).send("Please enter username, email and password");
    }

    //veritabanında kayıtlı mı kontrol et
    const user = await User.findOne({email}); 
    if(user &&  (password === user.password)){
      //token oluştur
      const token = jwt.sign(
        {user_id: user._id, email},
        JWT_KEY,
        {
          expiresIn: "1h"
        }
      );
      console.log(`tokenn: ${token} `)
      //oluşturulan tokeni kullanıcı tokenine eşitle
      user.token =token; 
      res.status(200).json(user);
    }
    res.status(400).send("Invalid Credenatials");

  }catch(err){
    console.log(err);
    
  }
});

//token kontrolü
app.post('/welcome', auth, (req ,res )=>{
  console.log("token kontrolü")
  res.status(200).send("Welcome");
})
/********************************************************************************************** */


/******************************** Döviz Kurları Api ***********************************************/
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

/************************************************************************************************/



app.listen(process.env.PORT, () => {
  console.log("Port 3000 is listening");
});

