import bcrypt from 'bcrypt'  //  for encryte the data
import mongoose, { Schema } from "mongoose";
import  Jwt  from 'jsonwebtoken';

const UserSchema = new Schema(
    {
        username: {
            type: String,
            required: true,
            unique: true,
            lowercase: true,
            trim: true,
            index: true
        },
        email: {
            type: String,
            required: true,
            unique: true,
            lowercase: true,
            trim: true,

        },
        fullname: {
            type: String,
            required: true,
            trim: true,
            index: true
        },
        avatar: {
            type: String, // cloudnary  url
            required: true
        },
        coverImage: {
            type: String
        },
        watchHistory: [
            {
                type: Schema.Types.ObjectId,
                ref: "Video"
            }
        ],
        password: {
            type: String,
            required: [true, "Password must be required"]
        },
        refreshToken: {
            type: String
        }

    }, { timestamps: true }
)

// pre is middlaware hooks for perform evnt or action before data save ( save,deleteone,updateone all 
// are event of middleware )
UserSchema.pre("save",async function(next ){
    if(!this.isModified("password")) return next();

    this.password= await bcrypt.hash(this.password ,10)
    next()

})

UserSchema.methods.isPasswordCorrect= async function(password){
    return await bcrypt.compare(password,this.password)  // it check the password encryted and password
}


// JWT TOKEN GENERATE METHOD

UserSchema.methods.generateAccessToken =function(){
     return Jwt.sign(
        {
            _id:this._id,
            email:this.email,
            username:this.username,
            fullname:this.fullname
        },
         process.env.ACCESS_TOKEN_SECRET,
         {
             expiresIn: process.env.ACCESS_TOKEN_EXPIRY
         }
    )
    
}

UserSchema.methods.generateRefreshToken = function () {
    return Jwt.sign(
        {
            _id: this._id,
            
        },
        process.env.REFRESH_TOKEN_SECRET,
        {
            expiresIn: process.env.REFRESH_TOKEN_EXPIRY
        }
    )

}

export const User= mongoose.model("User",UserSchema)