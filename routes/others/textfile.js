const express = require('express');
const fs = require('fs').promises;
const path = require('path');

var router = express.Router();

const textFilesDir = path.join(__dirname, './../uploads'); // Change this to your directory path

// Get a list of text files
router.get('/file-list', async (req, res) => {
  try {
    const files = await fs.readdir(textFilesDir);
    const textFiles = files.filter(file => file.endsWith('.txt'));
    res.status(200).json(textFiles);
  } catch (error) {
    console.error('Error fetching file list:', error);
    res.status(500).send('Internal Server Error');
  }
});

// Get the content of a specific text file
router.get('/file-content/:fileName', async (req, res) => {
  const { fileName } = req.params;
  const filePath = path.join(textFilesDir, fileName);

  try {
    const fileContent = await fs.readFile(filePath, 'utf-8');
    res.status(200).send(fileContent);
  } catch (error) {
    console.error('Error fetching file content:', error);
    res.status(500).send('Internal Server Error');
  }
});

// Delete a specific file
router.delete('/delete-file/:fileName', async (req, res) => {
    const { fileName } = req.params;
    const filePath = path.join(textFilesDir, fileName);
  
    try {
      await fs.unlink(filePath); // Delete the file
      res.status(200).json({ message: 'File deleted successfully' });
    } catch (error) {
      console.error('Error deleting file:', error);
      res.status(500).send('Internal Server Error');
    }
  });

module.exports = router;
