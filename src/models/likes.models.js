import mongoose, { Mongoose ,Schema } from "mongoose";


const likesSchema=new Schema(
    {
         video:{
            type:Schema.Types.ObjectId,
            ref:"Video"
         },
        comment: {
            type: Schema.Types.ObjectId,
            ref: "Comment"
        },
        tweets: {
            type: Schema.Types.ObjectId,
            ref: "Tweet"
        },
        likedBy: {
            type: Schema.Types.ObjectId,
            ref: "User"
        },
    },
    {
        timestamps:true
    }
)

export const Like=mongoose.Model('Like',likesSchema)