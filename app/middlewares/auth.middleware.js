const jwt = require("jsonwebtoken");
require('dotenv').config();

module.exports = (req , res , next) =>{
    const token = req.header("Authorization");
    if (!token){
        return res.status(401).send({message : "Access denied. No token provided."});
    }
    try{
        const verified = jwt.verify(token.replace("Bearer ", "") , process.env.SECRET_KEY);
        req.user = verified;
        next();
    }catch(err){
        res.status(500).send({message : "Invalid Token"});
    }
}