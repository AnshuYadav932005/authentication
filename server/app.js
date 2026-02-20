import express from "express";
import {config} from "dotenv";
import cookieParser from "cookie-parser";
import cors from "cors";
import {connection} from "./database/dbConnections.js"
import {errorMiddleware} from "./middlewares/error.js"
import userRouter from "./routes/userRouter.js";

export const app=express();

config({path: "./config.env"});

app.use(cors({
    origin: [process.env.FRONTEND_URL],
    method: ["GET","POST","PUT","DELETE"],
    credentials: true

}));

app.use(cookieParser()); //here hte cookieParser() function retuns a function that is use as an middleware
app.use(express.json());
app.use(express.urlencoded({extended: true}));//to get the data that is encoded in the url (like that in the form etc)

app.use("/api/v1/user",userRouter);



connection();

app.use(errorMiddleware);