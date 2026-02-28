import mongoose from "mongoose";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken"
import crypto from "crypto"
const userSchema = new mongoose.Schema({
    name: String,
    email: String,
    password:{
        type: String,
        minLength: [8,"The password should be at least 8 charccters long"],
        maxLength: [32, "The password should be at least 32 characters long"],
        select : false,
    },
    phone: String,
    accountVerified: {type: Boolean,default: false},
    verificationCode: Number,
    verificationCodeExpire: Date,
    resetPasswordToken: String,
    resetPasswordTokenExpired:Date,
    createdAt:{
        type: Date,
        default: Date.now   ,
    },

});

userSchema.pre("save",async function(next){
    if(!this.isModified("password")){
        return next;/*beofre the  */
        /*there are two types of flow the mongoose flow which is terminated by the next(), by calling the next function and then the javascript
        flow which is to be terminated by the explicity saying that either this is the end fo the function/error of some kind so the return is 
        use  */
    }
    /*the next was created to manually call the next middleware in the row if this middleware had a success but in this case the promise can
    take care of whether there was a success or failure and hence accordingly it will allow to progress to the next middleware and if the promise 
    results in an failure then it will lead to an it will stop the request-response cycle */
    /*there sare two types of the middleware--callback normal ones and the async ones-- former do not need next() to move forward and the later
    one is the async based/promise based and it will there is no need of the next here */
    this.password=await bcrypt.hash(this.password,10);
    /*the last line is equal to this ----return Promise.resolve();*/
});


userSchema.methods.comparePassword = async function(enteredPassword) {
    return await bcrypt.compare(enteredPassword,this.password); 
};

/*this was done when we needed to make the register endpoint to be able to make register the user after the verification has been done   */
userSchema.methods.generateVerificationCode=function (){
    function generateRandomFiveDigitNumber(){
        const firstDigit=Math.floor(Math.random()*9)+1;
        const remainingDigit=Math.floor(Math.random()*10000).toString().padStart(4,0);;
    
        return parseInt(firstDigit+remainingDigit);
    }
    const verificationCode=generateRandomFiveDigitNumber();
    this.verificationCode=verificationCode;
    this.verificationCodeExpire=Date.now()+(5*60*1000);
    
    return verificationCode;
};

userSchema.methods.generateToken= async function(){
    return await jwt.sign({id: this.id},process.env.JWT_SUPER_KEY,{
        expiresIn:process.env.JWT_EXPIRE
    }); 
};

userSchema.methods.generateResetPasswordToken= async function(){
    const resetToken= crypto.randomBytes(20).toString("hex");//generating the resetpassword link
    console.log(resetToken);

    this.resetPasswordToken= crypto //storing the hashed password link for security
    .createHash("sha256")
    .update(resetToken)
    .digest("hex");

    this.resetPasswordTokenExpired=Date.now()+1000*15*60;
    return resetToken;
}
export const User = mongoose.model('User', userSchema);



