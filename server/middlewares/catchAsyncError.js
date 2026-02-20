export const catchAsyncError=(theFunction)=>{//this function is an async function and we know about it already that i why we are writing 
    //this code to catch the async functions
        return (req,res,next)=>{
            Promise.resolve(theFunction(req,res,next)).catch(next);//----->the error middleware will be excuted if there is any error found here
            /*Step 3: .catch(next)
If the Promise rejects:
next(error) is called
Express moves to error-handling middleware
If it resolves:
nothing happens
response was already sent by your route*/ 
        }
}

/*the Promise.resolve is used to be able to just make sure that the thing that is retrured by the 
theFunction(req,res,next)---->[as it is a aysnc function it will return a promise only ] is an promise 
if by mistake there is an sync function then it will be converted into an promise only */


/*Express was built in the callback era
It does not automatically catch rejected Promises */