import dotenv from "dotenv";
import nodemailer from 'nodemailer';
dotenv.config();

const transporter = nodemailer.createTransport({
  service: 'uc2.devices@gmail.com', 
  auth: {
    user: 'uc2.devices@gmail.com', 
    pass: process.env.EMAIL_APP_PASSWORD, 
  },
});


export default function sendMail({to , subject , text})
{
    const mailOptions = {
    from: 'uc2.devices@gmail.com', // Sender's email address
    to: to, // Recipient's email address
    subject: subject, // Email subject
    text: text, // Email body (plain text)
  };
  

    transporter.sendMail(mailOptions, (error, info) => {
        if (error) {
          console.error('Error sending email:', error);
        } 
      });
}      