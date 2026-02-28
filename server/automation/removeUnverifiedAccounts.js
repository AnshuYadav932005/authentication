import cron from "node-cron";
import {User} from "../models/userModels.js";

export const removeUnverifiedAccounts=()=>{
    cron.schedule('*/4 * * * * *', async() => {
    console.log('running a task every minute');
    const registrationAttemptsByUser=await User.deleteMany({
        accountVerified:false
    });

});



}
