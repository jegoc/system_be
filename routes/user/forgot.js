const express = require('express');
const jwt = require('jsonwebtoken');
const router = express.Router();
const db = require('../../db');
const validator = require('validator');
const crypto = require('crypto');
const dns = require('dns');

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

// ************* Forgot User **********************
  
  // Validation middleware
  const validateFormDataUpdate = async (request, response, next) => {
    const { email } = request.body;
  
    // Usage
    const isValid = await isEmailValid(email);
  
    if (!isValid) {
        console.error('Invalid or non-existent email address');
        return response.status(400).json({ error: 'Invalid or non-existent email address' });
    }

    if (!email) {
      return response.status(400).send({ error: 'Inputs are required' });
    }
  
    if (!validator.isEmail(email)) {
        return response.status(400).send({ error: 'Invalid email format' });
    }
  
    next();
  };
  
    
router.post('/', validateFormDataUpdate, async (request, response) => {
  try {
    const { email, password } = request.body;

    const encryptionKey = process.env.DE_EN; // 32-character key for AES-256
    const encryptedEmail = encrypt(email, encryptionKey);

    // Hash the new password with the generated salt
    const hashedPassword = hashPasswordUpdate(password);

    const query = `
      UPDATE user_login
      SET password = ?
      WHERE email = ?
    `;

    const values = [hashedPassword, encryptedEmail];

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



function comparePasswords(enteredPassword, storedHashedPassword, storedSalt) {
  const hashedPassword = hashPassword(enteredPassword, storedSalt);
  return hashedPassword === storedHashedPassword;
}

function hashPassword(password, salt) {
  const hashedPassword = crypto.pbkdf2Sync(password, salt, 10000, 64, 'sha512').toString('hex');
  return hashedPassword;
}

function hashPasswordUpdate(password) {
  const salt = crypto.randomBytes(16).toString('hex');
  const hashedPassword = crypto.pbkdf2Sync(password, salt, 10000, 64, 'sha512').toString('hex');
  return `${salt}:${hashedPassword}`;
}


module.exports = router;

