//database bağlantısı

require("dotenv").config();
const mongoose = require("mongoose");

const connect = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URL, {
      useNewUrlParser: true,
      useUnifiedTopology: true
  
    });
    console.log("Database bağlandı");
  } catch (error) {
    console.error("Veritabanına bağlanırken hata oluştu:", error);
    process.exit(1);
  }
};

module.exports = { connect };