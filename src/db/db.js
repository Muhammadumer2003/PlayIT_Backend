import Mongoose from "mongoose";

import { DB_NAME } from "../constants.js";


const DB_connection=async()=>{
    try{
        const connection=await Mongoose.connect(`${process.env.MONGODB_URI}/${DB_NAME}`);
        console.log(`MongoDB is hosted at ${connection.connection.host }`);


    }
    catch(error){
        console.error("Error connecting to MongoDB", error);
        process.exit(1);
    }

}

export default DB_connection;