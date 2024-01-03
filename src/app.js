import express from 'express'
import cors from 'cors'
import cookieParser from 'cookie-parser'
const app=express()

app.use(cors({   // use for middlware
    origin:process.env.CORS_ORIGIN,
    Credentials:true
}))

app.use(express.json({limit:"16kb"}))  // limit defined for json data configuration
app.use(express.urlencoded({extended:true , limit:"16kb"}))  // configuration for url decode 
app.use(express.static("public"))  // configuration for public assest like images,favicon etc
app.use(cookieParser())  // secure cookie configuration


// import router

import userRouter from './routes/user.routes.js'


// routes declartion
app.use("/api/v1/users",userRouter) // it is middleware  // standard practise to write api/version / users

// http:// localhost:/api/v1/users/register // url make this type

export { app }