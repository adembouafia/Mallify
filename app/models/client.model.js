const mongoose = require("mongoose");
const bcrypt = require("bcrypt");

const ClientSchema = new mongoose.Schema(
  {
    firstname: {
        type : String,
        required : true
    },
    
    lastname: {
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
    dateOfBirth :{
        type : Date,
        required : false 
    },
    phoneNumber : {
        type : String,
        required : false 
    },
    gender : {
        type : String,
        required : false
    },
    role: {
        type: String,
        default: "client"
    },
    resetPasswordToken: {
      type: String
    },
    resetPasswordExpires: {
      type: Date
    },
    resetPasswordCode: {
      type: String
    },
    profilePicture: {
      type: String,
      required: false
    }
  },
  {
    timestamps: true,
  }
);

//Hashing the password before saving 
ClientSchema.pre("save" , async function(next) {
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

module.exports = mongoose.model("Client", ClientSchema);