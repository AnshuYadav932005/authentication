import express from "express";
import {verifyOTP,register,login, logout, getUser, forgotPassword, resetPassword} from "../controllers/userController.js"
import { isAuthenticated } from "../middlewares/auth.js";
 
const router= express();

router.post("/register",register);
router.post("/otp-verification",verifyOTP);
router.post("/login",login);
router.get("/me",isAuthenticated,getUser);
router.get("/logout",isAuthenticated,logout);
router.post("/password/forgot",forgotPassword);
router.put("/password/reset/:token",resetPassword);

export default router;