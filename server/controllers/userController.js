import { catchAsyncError} from "../middlewares/catchAsyncError.js";
import ErrorHandler from "../middlewares/error.js";
import {User} from "../models/userModels.js" ;
import {sendEmail} from "../utils/sendEmail.js"
import twilio from "twilio";
import { sendToken } from "../utils/sendToken.js";
import crypto  from "crypto";

const client=twilio("ACbdb4f5a0ce098e7479a470234b5d00ec","2ec14748947e68a4c46f4b074896d7a3");

export const register=catchAsyncError(async (req,res,next)=>{
    try{
        const {name,email,phone,password,verificationMethod}= req.body;
        //------------------------------
        if(!name || !email || !phone || !password || !verificationMethod){
            return next(new ErrorHandler("All the required data was not provided",400));

        }
        //------------------------------
        function validatePhoneNumber(phone){
            const phoneRegex= /^\+91[6-9]\d{9}$/;        
            return phoneRegex.test(phone);
        }
        if(!validatePhoneNumber(phone)){
            return next(new ErrorHandler("Invalid PhoneNumber",400));
        }
        //------------------------------
        const existingUser= await User.findOne({
            $or:[
                {
                    email,
                    accountVerified: true,
                },
                {
                     phone,
                    accountVerified: true,
                }
            ],
        });
        if(existingUser){
            return next(new ErrorHandler("Email or Phone already used"),400);
        }
        
        const registrationAttemptsByUser=await User.find({
            $or:[
                {phone,accountVerified:false},
                {email,accountVerified:false}
            ]
        });

        if(registrationAttemptsByUser.length>3){
            return  next(new ErrorHandler("You have reached the maximim no of attempts(3).Please try after an hour.",400));
        }
        //------------------------------
        const userData={
            name, 
            email, 
            phone, 
            password
        }

        const user = await User.create(userData);
        const verificationCode = await user.generateVerificationCode();
        await user.save();   

        sendVerificationCode(verificationMethod,verificationCode,name,email,phone,res);
    }catch(error){
        next(error);
    }
});

/*now here we are trying to implement the sendverificationcode */
async function sendVerificationCode(verificationMethod,verificationCode,name,email,phone,res){
    try{
        console.log("SID:", process.env.TWILIO_ACCOUNT_SID);
        console.log("TOKEN:", process.env.TWILIO_AUTH_TOKEN);
        if(verificationMethod==="email"){
            const message=generateEmailTemplate(verificationCode);
            await sendEmail({email,subject: "Your verification code",message});
            res.status(200).json({
                success: "true",
                message: `Verification code sent successfully to ${name}`
            });   
        } else if(verificationMethod==="phone"){
            const verificationCodeWithSpaces=verificationCode
            .toString()
            .split("")
            .join(" ");/*it has one major problem that call can only go to only verfied  */
            await client.calls.create({
                twiml: `      
                <Response>
                    <Say>
                        Your Verification Code is : ${verificationCodeWithSpaces}.  
                        Your Verification Code is : ${verificationCodeWithSpaces}.  
                    </Say>
                </Response>`,
                from : process.env.TWILIO_PHONE,
                to:phone,
            });
            res.status(200).json({
                success: "true",
                message: `OTP Sent`
            });   
        }else{
            return next(new ErrorHandler("Invalid verification method."),400);
            
      
            /*always remember that there are many types of flows there are function or js flow and there are request-res 
            flow that that might be giving worng anwer as if not correctly identified as here there were an async function 
            that lead to an error but after that the function had lines to send the res without any check and hence the 
            response of success was sent without considering the previous error hence we changed the location of the 
            response  */
        }

    }catch(error){
        console.log(error);
        return next(new ErrorHandler("Verification code failed to send."),500);
    }
    

}


function generateEmailTemplate(verificationCode){
    return  `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #ddd; border-radius: 8px; background-color: #f9f9f9;">
      <h2 style="color: #4CAF50; text-align: center;">Verification Code</h2>
      <p style="font-size: 16px; color: #333;">Dear User,</p>
      <p style="font-size: 16px; color: #333;">Your verification code is:</p>
      <div style="text-align: center; margin: 20px 0;">
        <span style="display: inline-block; font-size: 24px; font-weight: bold; color: #4CAF50; padding: 10px 20px; border: 1px solid #4CAF50; border-radius: 5px; background-color: #e8f5e9;">
          ${verificationCode}
        </span>
      </div>
      <p style="font-size: 16px; color: #333;">Please use this code to verify your email address. The code will expire in 10 minutes.</p>
      <p style="font-size: 16px; color: #333;">If you did not request this, please ignore this email.</p>
      <footer style="margin-top: 20px; text-align: center; font-size: 14px; color: #999;">
        <p>Thank you,<br>Your Company Team</p>
        <p style="font-size: 12px; color: #aaa;">This is an automated message. Please do not reply to this email.</p>
      </footer>
    </div>
  `
    
}
//-------------------------------------------------here is the verification thing using (phone or email) and otp sent previously-------------------
/* now we are tyring to verify the otp that we have sent  */
export const verifyOTP= catchAsyncError(async(req,res,next)=>{
    const {email,otp,phone}= req.body;
    function validatePhoneNumber(phone){
        const phoneRegex= /^\+91[6-9]\d{9}$/;        
        return phoneRegex.test(phone);
    }
    if(!validatePhoneNumber(phone)){
        return next(new ErrorHandler("Invalid PhoneNumber",400));
    } 

    try{
        const userAllEntries=await User.find({
            $or:[
                {email,accountVerified:false},
                {phone, accountVerified: false,}
            ]
        }).sort({createdAt: -1});/*this is use to sort the array in the descending order */

        if(userAllEntries.lenght==0){
            return next(new ErrorHandler("User not Found",404));
        }

        let user;

        /*deleting all the old entries */
        if(userAllEntries.length>1  ){
            user=userAllEntries[0];/*we need to delete the entries of the user which are other than the latest one */

            await User.deleteMany({
                _id: {$ne:user._id},
                $or:[
                    {phone , accountVerified: false},
                    {email, accountVerified: false}
                ]
            });
        }else{/*if there is only one entry of the user then what to do */
            user=userAllEntries[0];
        }

        if(Number(user.verificationCode)!==Number(otp)){
            return next(new ErrorHandler("Invalid OTP",400));
        }

        const currentTime=Date.now();
        const verificationCodeExpire= new Date(user.verificationCodeExpire).getTime();
        //console.log(`Current time:${currentTime} ExpireTime: ${verificationCodeExpire}`);
        if(currentTime>verificationCodeExpire){
            return next(new ErrorHandler("OTP Expired.",400));
        }
        user.accountVerified= true;
        user.verificationCode=null;
        user.verificationCodeExpire=null;
        await user.save({validateModifiedOnly: true});/*to check all the constraints before saving the values that we have modified here */

        sendToken(user,200, "Acccout verified",res);
    }catch(error){
        console.log(error.message);
        return next( new ErrorHandler("Internal Server Error",500));
    }

});

//-----------------------here are logging in using email and password and seding the token for authentication------------------
export const login=catchAsyncError(async (req,res,next)=>{
    const {email,password}=req.body;
    if(!email || !password ){
        return next(new ErrorHandler("Email and password are required",400));
        
    }
    const user= await User.findOne({email, accountVerified: true}).select("+password");
    if(!user){
        return next(new ErrorHandler("Invalid email or  password",400));
    }
     
    const isPasswordMatched = await user.comparePassword(password);
    console.log(isPasswordMatched);
    if(!isPasswordMatched){
        return next(new ErrorHandler("Invalid email and or password.",400));

    }
    sendToken(user,200,"User logged in successfully",res);
});

//---------------------------------------------how to get the user
export const getUser=catchAsyncError(async(req,res,next)=>{
    const user=req.user;
    res.status(200).json({
        success:true,
        user,
    }) ;
});

//-------------------to be able to logout this function is being created and have the isauth middleware to be able to check if the user
//is authenticated(using json web token) -------------------------------------------
export const logout= catchAsyncError(async(req,res,next)=>{
    res.status(200).cookie("token","",{
        expires:new Date(Date.now()),
        httpOnly: true
    }).json({
        success: true,
        message: "Logged out successfully."
    })
});


/*---------------from here on i am trying to implement the forgot password --------------------------------*/
export const forgotPassword=catchAsyncError(async(req,res,next)=>{
    //we modified the req body by the isAuthenticated fun in the auth middlewares
    const user=await User.findOne({
        email:  req.body.email,
        accountVerified:true
    });
    if(!user){
        return next(new ErrorHandler("User not Found",404));
    }
    const resetToken=await user.generateResetPasswordToken();
    await user.save({validateBeforeSave: false});/*as we do not need to validate the thing that i have not mo   dified */
    const resetPasswordUrl= `${process.env.FRONTEND_URL}/password/reset/${resetToken}`;

    const message=  `Your reset password token is: \n\n ${resetPasswordUrl } \n\n.
    If you did not requested for it then ignore this`;
    console.log("my email is equal to: "+user.email);
    try{
        await sendEmail({
            email: user.email,
            subject: "MERN_Authentication_reset Password",
            message,
        });
        res.status(200).json({
            success: true,
            message: `Resent password email sent to ${user.email} successfully. `
        });

        }catch(error){
            user.resetPasswordToken=undefined;
            user.resetPasswordTokenExpired=undefined;
            await user.save({validateBeforeSave:false});
            return next(new ErrorHandler(error.message? "hello bruh": "Cannot setResetTokenPassoword",500));
        }
    });

/*------------------to reset the password we will need to send the token also along with url------------------------------------------------ */
export const resetPassword= catchAsyncError(async(req,res,next)=>{

    const {token}=req.params//???? but we only saved the hashed password not the original token
    //how are we able to send the token that we have never ever saved-------------------------------------------?????
    console.log(token);
    const resetPasswordToken=crypto
        .createHash("sha256")
        .update(token)
        .digest("hex");
    console.log(resetPasswordToken);
    const user= await User.findOne({
        resetPasswordToken,
        resetPasswordTokenExpired: {$gt: Date.now()},
    });
    if(!user){
        return next(new ErrorHandler("either the token no correct or has expired",400));
    }
    if(req.body.password!==req.body.confirmPassword){
        return next(new ErrorHandler("the Password and Confirm Password do not match",400));
    }
    user.password=  req.body.password;
    user.resetPasswordToken=undefined;
    user.resetPasswordTokenExpired=undefined;
    await user.save();
    sendToken(user,200,"Reset password successfully",res);

});




