const mongoose = require("mongoose");
const bcrypt = require("bcrypt");

const VendorSchema = new mongoose.Schema(
    {
    vendorName: {
        type : String,
        required : true,
    },

    email: {
        type: String,
        unique: [true, "The email is unique"],
    },
    phone: {
        type : Number,
    },

    vendorPassword: {
        type : String ,
    },

    role: {
        type: String,
        enum: ["vendor", "moderator"],
        default: "vendor"
    },
    shop: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "shop"
    },
    },

    {
        timestamps: true,
    }
);

//Hashing the password before saving 
VendorSchema.pre("save" , async function(next) {
    try{
        if (!this.isModified("vendorPassword")) {
            return next();
        }
        const hashedPassword = await bcrypt.hash(this.vendorPassword , 10);
        this.vendorPassword = hashedPassword;
        next()
    }catch(err){
        next(err)
    }
})

module.exports = mongoose.model("vendor", VendorSchema);