const mongoose = require("mongoose");
const bcrypt = require("bcrypt");

const VendorSchema = new mongoose.Schema(
  {
    vendorname: {
        type : String,
        required : true
    },
    
    shopname: {
        type : String,
        required : true
    },

    email: {
      type: String,
      unique: [true, "The email is unique"],
    },
    phone: {
        type : Number,
        required : true
    },
    shoplogo : {
        type : String,
        required : true
    },
    adresse: {
        type : String,
        required :false
    },
    shopdescription: {
        type : String,
        required : false
    },

    vendorpassword: {
        type : String ,
        required : true
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

module.exports = mongoose.model("vendor", VendorSchema);