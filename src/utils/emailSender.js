const nodemailer = require('nodemailer');
require('dotenv').config();

// const transporter = nodemailer.createTransport({
//   service: 'gmail', // Change to your email provider
//   auth: {
//     user: process.env.EMAIL_USER,
//     pass: process.env.EMAIL_PASSWORD,
//   },
// });

const transporter = nodemailer.createTransport({
    host: 'smtp.ethereal.email',
    port: 587,
    auth: {
        user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASSWORD,
    }
});

const sendEmail = async ({ to, subject, html }) => {
  await transporter.sendMail({
    from: process.env.EMAIL_USER,
    to,
    subject,
    html,
  });
};

module.exports = sendEmail;
