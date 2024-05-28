const jwt = require("jsonwebtoken");
const config = process.env;

const verifyToken = (req, res, next) => {
    console.log("kontrol ediliyor");
    const token = req.body.token || req.query.token || req.headers["x-access-token"];
    
    // Token varlığını kontrol etme
    if (!token) {
        return res.status(403).send("A token is required for authentication");
    }
    
    try {
        const decoded = jwt.verify(token, config.JWT_KEY);
        req.user = decoded;
        console.log("kontrol edildi");
        console.log("User ID:", req.user.user_id); // UserID'yi kontrol etmek için
        next(); // Middleware'nin sonraki adıma geçmesi için next() fonksiyonunu çağırın
    } catch(err) {
        console.error("Token verification error:", err);
        return res.status(401).send("Invalid Token");
    }
}

module.exports = verifyToken;
