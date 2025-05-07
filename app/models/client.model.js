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
    },
    // New shipping information fields
    shippingInfo: {
      address: {
        type: String,
        required: false
      },
      city: {
        type: String,
        required: false
      },
      governorate: {
        type: String,
        required: false
      },
      postCode: {
        type: String,
        required: false
      },
      phone: {
        type: String,
        required: false
      }
    },
    // Multiple saved addresses
    savedAddresses: [{
      name: {
        type: String,
        default: "Home"
      },
      address: {
        type: String,
        required: true
      },
      city: {
        type: String,
        required: true
      },
      governorate: {
        type: String,
        required: true
      },
      postCode: {
        type: String,
        required: true
      },
      phone: {
        type: String,
        required: true
      },
      isDefault: {
        type: Boolean,
        default: false
      }
    }]
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