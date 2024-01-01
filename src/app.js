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
export { app }