// server.ts
const express = require('express');
const router = express.Router();
const db = require('../../db');

router.post('/', (req, res) => {
  const { code } = req.body;

  if (!code) return res.status(400).json({ error: 'No code provided' });

  const sql = 'INSERT INTO scanned_codes (code) VALUES (?)';
  db.query(sql, [code], (err, result) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ success: true, id: result.insertId });
  });
});

module.exports = router;
