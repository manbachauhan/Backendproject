import mongoose from "mongoose";
import { DB_NAME } from "../constants.js";


const connectDB= async()=>{
    try{
        const connectionInstance = await mongoose.connect(`${process.env.MONGODB_URL}/${DB_NAME}`)
        console.log(`MongoDb is Connected !!  DB HOST : ${connectionInstance.connection.host}`);  // connectionInsrance check in console

    }
    catch(error){
        console.log(" Mongo DB connection Error : ",error);
        process.exit(1)

    }
}

export default  connectDB;