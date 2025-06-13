const express = require('express');
const multer = require('multer');
const fs = require('fs');
const path = require('path');

var router = express.Router();


// Set up multer storage and file filter
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, './routes/uploads/');
  },
  filename: function (req, file, cb) {
    cb(null, `${Date.now()}-${file.originalname}`);
  },
});

const fileFilter = (req, file, cb) => {
  if (file.mimetype === 'text/plain') {
    cb(null, true);
  } else {
    cb(new Error('Invalid file type. Only text files are allowed.'));
  }
};

const upload = multer({ storage: storage, fileFilter: fileFilter });

// Handle file upload
router.post('/', upload.single('file'), (req, res) => {
  res.status(200).json({ message: 'File uploaded successfully' });
});




module.exports = router;