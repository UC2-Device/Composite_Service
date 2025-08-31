const nodemailer = require('nodemailer');


const transporter = nodemailer.createTransport({
  service: 'senders address', 
  auth: {
    user: 'senders address', 
    pass: 'App password', 
  },
});


export default function sendMail({to , subject , text})
{
    const mailOptions = {
    from: 'senders address', // Sender's email address
    to: to, // Recipient's email address
    subject: subject, // Email subject
    text: text, // Email body (plain text)
  };
  

    transporter.sendMail(mailOptions, (error, info) => {
        if (error) {
          console.error('Error sending email:', error);
        } else {
          console.log('Email sent:', info.response);
        }
      });
}      