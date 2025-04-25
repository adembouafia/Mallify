const mongoose = require("mongoose");
const bcrypt = require("bcrypt");

const adminSchema = new mongoose.Schema(
    {
    firstname: {
        type : String,
        required : true
    },

    lastname:{
        type : String,
        required : true
    },
    
    email: {
        type: String,
        unique: [true, "The email is unique"],
    },

    password: {
        type : String ,
        required : true
    },

    role: {
        type: String,
        enum: ["admin", "superAdmin"],
        default: "admin"
    },

    adminImage: {
        type: String,
        required: true
    },
    resetPasswordCode: {
        type: String,
    },

    resetPasswordExpires: {
        type: Date,
    }
    },

    {
        timestamps: true,
    }
);

//Hashing the password before saving 
adminSchema.pre("save" , async function(next) {
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

module.exports = mongoose.model("Admin", adminSchema);