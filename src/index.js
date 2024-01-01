
import dotenv from "dotenv"
import connectDB from "./db/index.js";

dotenv.config({
    path:'./env'
})

connectDB();























/*
import  Express  from "express";
const app=express()

// database connection to  things must use  because database data connect many error occurs so esaly
// 1. try catch use must and 2. async await () must use  

( async ()=>{  // database take time for connect database for use async and await
    try {
        await mongoose.connect(`${process.env.MONGODB_URL}/${DB_NAME}`)
        app.on("error",(error)=>{
            console.log("error",error)
            throw error
        })
        app.listen(process.env.PORT,()=>{
            console.log( `App is listing on port ${process.env.PORT}`)
        })
        
    } catch (error) {
        console.log("Error "+error)
        throw error
        
    }
})()*/