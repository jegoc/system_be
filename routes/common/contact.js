const express = require('express');
const router = express.Router();
const db = require('../../db');

const validateForm = async (req, res, next) => {
  const { name, email, message } = req.body;

  if (!name || !email || !message) {
    return res.status(400).send({ error: 'All fields are required' });
  }
  next();
};


router.post('/', validateForm, function(request, response){
    var sql = "INSERT INTO contact (name, email, message, status ) VALUES ?";
    var values = [
        [request.body.name, request.body.email, request.body.message, 1]
    ];
    db.query(sql, [values], function (error, results) {
        if ( error ){
            response.status(400).send('Error in database operation');
        } else {
            response.json(results);
        }
    });
});

module.exports = router;
