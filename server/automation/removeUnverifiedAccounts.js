import cron from "node-cron";
import {User} from "../models/userModels.js";

export const removeUnverifiedAccounts=()=>{
    cron.schedule(' */1 * * * *', async() => {
        const thirtyMinutesAgo= Date.now()-1000*30*60;
        const userToBeDeleted=await User.deleteMany({
        createdAt:{$lt:thirtyMinutesAgo},
        accountVerified:false   
    });
    console.log(userToBeDeleted);
    console.log("i minute passed");
});



}
