const mongoose = require("mongoose");
const bcrypt = require("bcrypt");

const moderatorSchema = new mongoose.Schema(
    {
    moderatorName: {
        type : String,
        required : true
    },
    
    email: {
        type: String,
        unique: [true, "The email is unique"],
    },

    moderatorPassword: {
        type : String ,
        required : true
    },

    role: {
        type: String,
        default: "moderator"
    },
    moderatorImage: {
        type: String,
        required: true
    },
    
    },

    {
        timestamps: true,
    }
);

//Hashing the password before saving 
moderatorSchema.pre("save" , async function(next) {
    try{
        if (!this.isModified("password")){
            return next();
        }
        const hashedPassword = await bcrypt.hash(this.password , 10);
        this.password = hashedPassword;
        next()
    }catch(err){
        next(err)
    }
})

module.exports = mongoose.model("moderator", moderatorSchema);