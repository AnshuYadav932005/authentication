import nodeMailer from "nodemailer";

export const sendEmail=async({email,subject, message})=>{
    const transporter=nodeMailer.createTransport({
        host:process.env.HOST, 
        service: process.env.SMTP_SERVICE,
        port: process.env.SMTP_PORT,
        auth:{
            user:process.env.SMTP_MAIL,
            pass:process.env.SMTP_PASSWORD,
        }
    });

    const options={
        from:process.env.SMTP_MAIL,
        to: email,
        subject:subject,
        html:message/*here the message is html file and hence we want need to specify that explicity, string if that is was string */
    };

    await transporter.sendMail(options);
}