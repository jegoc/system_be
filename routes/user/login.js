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


// Validation middleware
const validateFormData = async (request, response, next) => {
  const { email, password } = request.body;

  if (!email || !password) {
    return response.status(400).send({ error: 'Inputs are required' });
  }

  const isValid = await isEmailValid(email);

  if (!isValid) {
    console.error('Invalid or non-existent email address');
    return response.status(400).json({ error: 'Invalid or non-existent email address' });
  }

  if (!validator.isEmail(email)) {
    return response.status(400).send({ error: 'Invalid email format' });
  }

  next();
};

router.post('/', validateFormData, async (req, response) => {
  try {
    const { email, password, otp } = req.body;
    const expirationTime = new Date(Date.now() + 6 * 60 * 1000); // 5 minutes from now

    const encryptionKey = process.env.DE_EN; // 32-character key for AES-256
    const encryptedEmail = encrypt(email, encryptionKey);
    
    // Retrieve hashed password and salt from the database based on the email
    const query = 'SELECT * FROM user_login WHERE email = ? AND status = 1';
    db.query(query, [encryptedEmail], async (error, results) => {
      if (error) throw error;

      if (results.length === 0) {
        return response.status(401).json({ success: false, message: 'Invalid email or password' });
      }

      const storedHashedPasswordWithSalt = results[0].password;
      const [storedSalt, storedHashedPassword] = storedHashedPasswordWithSalt.split(':');

      // Compare the entered password with the stored hashed password using the stored salt
      const isPasswordMatch = comparePasswords(password, storedHashedPassword, storedSalt);

        if (isPasswordMatch) {
          const user = results[0];
          // const token = jwt.sign({ id: user.id, auth: user.auth }, 'secret-key-billing', { expiresIn: '24h' });
          const token = 'secretKeyBilling';

          // Send the token in the response
          // response.json({ id: user.id, auth: user.auth, avatar: user.avatar, token });
          response.json({ id: user.account_id, token });

            const query = 'UPDATE user_login SET otp = ?, otp_expiration = ? WHERE email = ?';
            db.query(query, [otp, expirationTime, encryptedEmail], (err, results) => {
              if (err || results.affectedRows === 0) {
                return res.status(500).json({ success: false, message: 'Error storing OTP' });
              }
            });

        } else {
          response.status(401).json({ success: false, message: 'Invalid email or password' });
        }
      });
  } catch (error) {
    console.error(error);
    response.status(500).json({ success: false, message: 'Internal server error' });
  }
});


// ************* Forgot User **********************
  
  // Validation middleware
  const validateFormDataUpdate = async (request, response, next) => {
    const { email, pin } = request.body;
  
    // Usage
    const isValid = await isEmailValid(email);
  
    if (!isValid) {
        console.error('Invalid or non-existent email address');
        return response.status(400).json({ error: 'Invalid or non-existent email address' });
    }
  
    if (!pin || !email ) {
      return response.status(400).send({ error: 'Inputs are required' });
    }
  
    if (!validator.isEmail(email)) {
        return response.status(400).send({ error: 'Invalid email format' });
    }
  
    next();
  };
  
    
router.post('/forgot/', validateFormDataUpdate, async (request, response) => {
  try {
    const { email, pin, password } = request.body;

    const encryptionKey = process.env.DE_EN; // 32-character key for AES-256
    const encryptedEmail = encrypt(email, encryptionKey);

    // Hash the new password with the generated salt
    const hashedPassword = hashPasswordUpdate(password);

    const query = `
      UPDATE user_login
      SET password = ?
      WHERE email = ? AND pin = ?
    `;

    const values = [hashedPassword, encryptedEmail, pin,];

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

