const express = require('express');
const router = express.Router();
const User = require("../model/user");
const jwt = require("jsonwebtoken");
const auth = require("../middleware/auth");



//kullanıcı kayıt
router.post('/register', async (req, res) => {
  console.log("Register endpoint çalışıyor");
  try {
    const { username, email, password } = req.body;
    console.log("Gelen istek verisi:", req.body);

    if (!(username && email && password)) {
      console.log("Boş alan bırakılmaz");
      return res.status(400).send("Please enter username, email and password");
    }

    const oldUser = await User.findOne({ email });
    if (oldUser) {
      console.log("Bu email daha önce kullanılmış");
      return res.status(400).send("This email has been used before");
    }

    const user = await User.create({ username, email, password });
    console.log("Yeni kullanıcı oluşturuldu:", user);

    return res.status(200).json(user);
  } catch (err) {
    console.error("Bir hata oluştu:", err);
    return res.status(500).send("Internal Server Error");
  }
});


//kullanıcı giriş
router.post('/login', async (req, res) => {

  try {
    const { email, password } = req.body;

    if (!(email && password)) {
      return res.status(400).send("Please enter email and password");
    }

    const user = await User.findOne({ email });
    if (user && (password === user.password)) {
      const token = jwt.sign(
        { user_id: user._id, email },
        process.env.JWT_KEY,
        { expiresIn: "1h" }
      );
      console.log(`tokenn: ${token} `);
      user.token = token;
      res.status(200).json(user);
    } else {
      res.status(400).send("Invalid Credentials");
    }
  } catch (err) {
    console.log(err);
  }
});


//token kontrolü
router.post('/welcome', auth, (req, res) => {
  console.log("token kontrolü");
  res.status(200).send("Welcome");
});

module.exports = router;

