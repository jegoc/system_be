const nodemailer = require('nodemailer');
// const { generateOTP } = require('./utils/otp');
const crypto = require('crypto');
var express = require('express');
var router = express.Router();
var db = require('../../db');
require('dotenv').config();

const IV = Buffer.alloc(16, 0); // Fixed IV for deterministic encryption

// Encrypt function using AES-256-CBC encryption
function encrypt(text, encryptionKey) {
  const cipher = crypto.createCipheriv('aes-256-cbc', Buffer.from(encryptionKey), IV);
  let encrypted = cipher.update(text, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  return encrypted;
}

// Decrypt function (optional, for retrieving the email in decrypted form)
function decrypt(encryptedText, encryptionKey) {
  const decipher = crypto.createDecipheriv('aes-256-cbc', Buffer.from(encryptionKey), IV);
  let decrypted = decipher.update(encryptedText, 'hex', 'utf8');
  decrypted += decipher.final('utf8');
  return decrypted;
}

// Create a transporter for your email service
const transporter = nodemailer.createTransport({
    host: 'mail.pearsportal.com', // Replace with your email provider's SMTP host
    port: 465,// Replace with your email provider's SMTP port (e.g., 587 for TLS)
    secure: true, // Set to true if your email provider requires a secure connection (e.g., for Gmail)
    auth: {
      user: process.env.EMAIL_ACCOUNT, // Your email address
      pass: process.env.EMAIL_PASSWORD, // Your email password or an app-specific password
    },
  });

// Route to request OTP
// router.post('/request-otp', async (req, res) => {
//   const { email, otp } = req.body;
// //   const otp = crypto.randomInt(100000, 999999).toString();
//   const expirationTime = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes from now

//   // Save OTP and expiration to the database
//   const query = 'UPDATE user SET otp = ?, otp_expiration = ? WHERE email = ?';
//   db.query(query, [otp, expirationTime, email], (err, results) => {
//     if (err || results.affectedRows === 0) {
//       return res.status(500).json({ success: false, message: 'Error storing OTP' });
//     }

//     // Send OTP via email
//     const mailOptions = {
//       from: 'billing@pearsportal.com',
//       to: email,
//       subject: 'Your OTP Code',
//       text: `Your OTP code is ${otp}. It is valid for 5 minutes.`
//     };

//     transporter.sendMail(mailOptions, (error, info) => {
//       if (error) {
//         return res.status(500).json({ success: false, message: 'Error sending email' });
//       }
//       res.json({ success: true, message: 'OTP sent to your email' });
//     });
//   });
// });

// Route to verify OTP
router.post('/verify-otp', (req, res) => {
    const { email, otp } = req.body;

    const encryptionKey = process.env.DE_EN; // 32-character key for AES-256
    const encryptedEmail = encrypt(email, encryptionKey);
  
    const query = `SELECT * FROM user_login WHERE email = ? AND otp = ? AND otp_expiration > NOW()`;
    db.query(query, [encryptedEmail, otp], (err, results) => {  // Pass both `email` and `otp` as parameters
      if (err) {
        return res.status(500).json({ success: false, message: 'Internal server error' });
      }
      if (results.length === 0) {
        return res.status(400).json({ success: false, message: 'Invalid or expired OTP' });
      }
  
      // OTP is verified
      res.json({ success: true, message: 'OTP verified successfully' });
    });
  });
  

module.exports = router;
