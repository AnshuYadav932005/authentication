/*this is used for the authentication of the user who is sending all the repsonses 
like if we are not logged it then and sending the request to the logout endpoint then it should
say that user not authenticated not that the user is suceessfully logged out that should happen on the first try only */


import { catchAsyncError } from "./catchAsyncError.js";
import ErrorHandler from "./error.js";
import jwt from "jsonwebtoken";
import {User} from "../models/userModels.js";




export const isAuthenticated=catchAsyncError(async(req, res,next)=>{
    const {token}=req.cookies;/*this is called destructure */
    if(!token){
        return next(new ErrorHandler("User is not authenticated ",400));
    }
    const decoded=await jwt.verify(token, process.env.JWT_SUPER_KEY);

    req.user=await User.findById(decoded.id);//here we have modified the req object so the next route or the middleware will get the this 
    //modified user object

    next();

})


 