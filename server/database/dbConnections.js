import mongoose from "mongoose";


export const connection=()=>{
    // console.log(`THE CONNECTION IS BEING MADE TO :${process.env.MONGO_URI}`);
    mongoose.connect(process.env.MONGO_URI,{
        dbName: "MERN_AUTHENTICATION",

    })
    .then(()=>{
        console.log("Connection to the database was sucessful");
    }).catch((err)=>{
        console.log(`Connection to the database was unsucessful due to the error ${err}`);
    })
};