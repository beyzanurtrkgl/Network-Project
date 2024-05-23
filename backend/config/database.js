const mongoose = require("mongoose");
const {MONGO_URL} = process.env;

mongoose.Promise = global.Promise;

exports.connect = () => {}

mongoose
.connect(MONGO_URL,{
    useNewUrlParser: true
})
.then(() => {
    console.log("Database bağlandı");
})
.catch((err) => {
    console.log("Database Bağlanmadı");
    console.log(err);
    process.exit(1);

})