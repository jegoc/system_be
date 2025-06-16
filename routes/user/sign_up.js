const express = require('express');
const router = express.Router();
const db = require('../../db');
const validator = require('validator');
const crypto = require('crypto');
const dns = require('dns');
require('dotenv').config();

const IV = Buffer.alloc(16, 0);

function encrypt(text, encryptionKey) {
  const cipher = crypto.createCipheriv('aes-256-cbc', Buffer.from(encryptionKey), IV);
  let encrypted = cipher.update(text, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  return encrypted;
}

function isEmailValid(email) {
  // First, check if email format is valid
  if (!validator.isEmail(email)) {
    return Promise.resolve(false);
  }

  const domain = email.split('@')[1];

  return new Promise((resolve) => {
    dns.resolveMx(domain, (err, addresses) => {
      resolve(!err && addresses && addresses.length > 0);
    });
  });
}

// function isEmailValid(email) {
//   const domain = email.split('@')[1];
//   return new Promise((resolve) => {
//     dns.resolveMx(domain, (err, addresses) => {
//       resolve(!err && addresses && addresses.length > 0);
//     });
//   });
// }

function hashPassword(password) {
  const salt = crypto.randomBytes(16).toString('hex');
  const hashed = crypto.pbkdf2Sync(password, salt, 10000, 64, 'sha512').toString('hex');
  return `${salt}:${hashed}`;
}

const validateFormSignUp = async (req, res, next) => {
  const { fname, mi, lname, address, city, province, zip, cellphone, email, password } = req.body;

  if (!fname || !mi || !lname || !address || !city || !province || !zip || !cellphone || !email || !password) {
    return res.status(400).send({ error: 'All fields are required' });
  }

  if (!validator.isEmail(email)) {
    return res.status(400).send({ error: 'Invalid email format' });
  }

  const isValidEmail = await isEmailValid(email);

  if (!isValidEmail) {
    return res.status(400).json({ error: 'Invalid or non-existent email domain' });
  }

  if (!/^[0-9]{11}$/.test(cellphone)) {
    return res.status(400).send({ error: 'Invalid cellphone format' });
  }

  try {
    const checkEmailQuery = 'SELECT * FROM account WHERE email = ?';
    const result = await db.query(checkEmailQuery, [email]);
    if (result.length > 0) {
      return res.status(400).json({ error: 'Email already exists' });
    }
    next();
  } catch (err) {
    console.error('Email Check Error:', err);
    return res.status(500).json({ error: 'Database error' });
  }
};

router.post('/', validateFormSignUp, async (req, res) => {
  try {
    const {
      fname, mi, lname, address, city, province, zip,
      cellphone, email, password
    } = req.body;

    const hashedPassword = hashPassword(password);
    const encryptionKey = process.env.DE_EN;
    const encryptedEmail = encrypt(email, encryptionKey);
    const encryptedCellphone = encrypt(cellphone, encryptionKey);

    const accountData = [
      'Shop', 'user', fname, mi, lname, address, city,
      province, zip, encryptedCellphone, encryptedEmail,
      '', 0, 0, '', '', 0, 0
    ];

    const insertAccountQuery = `
      INSERT INTO account (
        system_type, auth, fname, mi, lname, address, city, province, zip,
        cellphone, email, contact_person, total_charge, total_payment,
        avatar, verify_code, verify_status, status
      ) VALUES (?)`;

    const accountResult = await db.query(insertAccountQuery, [accountData]);

    if (accountResult.affectedRows === 0) {
      return res.status(400).json({ success: false, message: 'Account creation failed' });
    }

    const userLoginData = [
      accountResult.insertId, encryptedEmail, hashedPassword,
      '', 0, '', '', 0
    ];

    const insertLoginQuery = `
      INSERT INTO user_login (
        account_id, email, password, pin, count, otp, otp_expiration, status
      ) VALUES (?)`;

    const loginResult = await db.query(insertLoginQuery, [userLoginData]);

    if (loginResult.affectedRows === 0) {
      return res.status(400).json({ success: false, message: 'User login creation failed' });
    }

    return res.json({ success: true, message: 'User registered successfully' });

  } catch (error) {
    console.error('Signup Error:', error);
    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
});


// Express route (Node.js backend)
// Express route
router.post('/check-email', async (req, res) => {
  const { email } = req.body;

  // Optional: short-circuit if missing input
  if (!email || typeof email !== 'string') {
    return res.status(400).json({ isValid: false, error: 'Email is required' });
  }

  try {
    const isValid = await isEmailValid(email);
    res.json({ isValid });
  } catch (error) {
    // Catch any unexpected issues
    res.status(500).json({ isValid: false, error: 'Internal server error' });
  }
});


// //** For verification account */
// // For verification account
// // router.get('/verify', async (request, response) => {
// //   try {
// //     const { account, verify_code } = request.query;

// //     const query = `
// //       UPDATE user
// //       SET verify_status = 1
// //       WHERE account = ? AND verify_code = ? AND verify_status = 0
// //     `;

// //     const values = [account, verify_code];

// //     db.query(query, values, (error, results) => {
// //       if (error) {
// //         console.error(error);
// //         response.status(500).json({ success: false, message: 'Internal server error' });
// //       } else if (results.affectedRows > 0) {
// //         response.json({ success: true, message: 'User updated successfully' });
// //       } else {
// //         response.status(400).json({ success: false, message: 'User not found or not updated' });
// //       }
// //     });
// //   } catch (error) {
// //     console.error(error);
// //     response.status(500).json({ success: false, message: 'Internal server error' });
// //   }
// // });

module.exports = router;
