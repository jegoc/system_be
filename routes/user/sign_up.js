const express = require('express');
const router = express.Router();
const db = require('../../db');
const validator = require('validator');
const crypto = require('crypto');
const dns = require('dns');
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

function isEmailValid(email) {
  const domain = email.split('@')[1];

  return new Promise((resolve, reject) => {
    dns.resolveMx(domain, (err, addresses) => {
      if (err || !addresses || addresses.length === 0) {
        // No MX records found, indicating the domain is not capable of receiving emails
        resolve(false);
      } else {
        resolve(true);
      }
    });
  });
}

// Validation middleware
const validateFormDataUpdate = async (request, response, next) => {
  const { account, pin, cellphone, email, password } = request.body;

  const isValid = await isEmailValid(email);

  if (!validator.isEmail(email)) {
    return response.status(400).send({ error: 'Invalid email format' });
  }

  if (!isValid) {
    console.error('Invalid or non-existent email address');
    return response.status(400).json({ error: 'Invalid or non-existent email address' });
  }

  if (!account || !pin || !cellphone || !email || !password) {
    return response.status(400).send({ error: 'Inputs are required' });
  }

  if (!/^[0-9]{6}$/.test(pin)) {
    return response.status(400).send({ error: 'Invalid Input' });
  }

  if (!/^[0-9]{11}$/.test(cellphone)) {
    return response.status(400).send({ error: 'Invalid Input' });
  }

  db.query('SELECT * FROM user WHERE email = ?', [email], (err, results) => {
    if (err || results.length >= 1) {
      console.error('MySQL Error:', err);
      return response.status(500).send({ error: 'Internal Server Error' });
    }
  });

  next();
};

router.post('/', validateFormDataUpdate, async (request, response) => {
  try {
    const { account, pin, cellphone, email, password, verify_code } = request.body;

    const hashedPassword = hashPassword(password);

    const encryptionKey = process.env.DE_EN; // 32-character key for AES-256
    const encryptedEmail = encrypt(email, encryptionKey);
    const encryptedCellphone = encrypt(cellphone, encryptionKey);
    // console.log("Encrypted email:", encryptedEmail);

    const query = `
      UPDATE user
      SET pin = ?, cellphone = ?, email = ?, password = ?, verify_code = ?, verify_status = 0, status = 1
      WHERE account = ?
    `;

    const values = [pin, encryptedCellphone, encryptedEmail, hashedPassword, verify_code, account];

    db.query(query, values, (error, results) => {
      if (error) {
        console.error(error);
        response.status(500).json({ success: false, message: 'Internal server error' });
      } else if (results.affectedRows > 0) {
        response.json({ success: true, message: 'User updated successfully' });
      } else {
        response.status(400).send('Error in database operation. User not found or not updated');
      }
    });
  } catch (error) {
    console.error(error);
    response.status(500).json({ success: false, message: 'Internal server error' });
  }
});


//** For verification account */
// For verification account
router.get('/verify', async (request, response) => {
  try {
    const { account, verify_code } = request.query;

    const query = `
      UPDATE user
      SET verify_status = 1
      WHERE account = ? AND verify_code = ? AND verify_status = 0
    `;

    const values = [account, verify_code];

    db.query(query, values, (error, results) => {
      if (error) {
        console.error(error);
        response.status(500).json({ success: false, message: 'Internal server error' });
      } else if (results.affectedRows > 0) {
        response.json({ success: true, message: 'User updated successfully' });
      } else {
        response.status(400).json({ success: false, message: 'User not found or not updated' });
      }
    });
  } catch (error) {
    console.error(error);
    response.status(500).json({ success: false, message: 'Internal server error' });
  }
});


function hashPassword(password) {
  const salt = crypto.randomBytes(16).toString('hex');
  const hashedPassword = crypto.pbkdf2Sync(password, salt, 10000, 64, 'sha512').toString('hex');
  return `${salt}:${hashedPassword}`;
}

module.exports = router;
