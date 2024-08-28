import express from "express";
import DB_connection from "./db/db.js";
import dotenv from "dotenv"
import app from "./app.js";


dotenv.config({
    path:"../env"
})





DB_connection()
.then(()=>{
    console.log("Database connected successfully");
    app.listen(process.env.PORT||8000,()=>{
        console.log("Server is running on port", process.env.PORT||8000);
    });
})
.catch((error)=>{
    console.error("Error connectiong to DB", error);
    app.on("error",(e)=>{
        console.error("Server Error", e);
        process.exit(1);
    })
})