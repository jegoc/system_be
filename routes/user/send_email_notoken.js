var express = require('express');
var router = express.Router();
var db = require('../../db');
const nodemailer = require('nodemailer');
require('dotenv').config();


// Nodemailer setup
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

  
  router.post('/', (req, res) => {
    const { to, subject, html } = req.body;
  
    // Insert email data into MySQL database
    const insertQuery = 'INSERT INTO emails (to_email, subject, text) VALUES (?, ?, ?)';
    db.query(insertQuery, [to, subject, html], (err, result) => {
      if (err) {
        console.error(err);
        res.status(500).send('Internal Server Error');
      } else {
        // Send email using nodemailer
        const mailOptions = {
          from: 'Pears Portal <billing@pearsportal.com>',
          to,
          subject,
          html,
        };
  
        transporter.sendMail(mailOptions, (error, info) => {
          if (error) {
            console.error(error);
            res.status(500).send('Failed to send email');
          } else {
            console.log('Email sent: ' + info.response);
            res.status(200).send('Email sent successfully');
          }
        });
      }
    });
  });

module.exports = router;
