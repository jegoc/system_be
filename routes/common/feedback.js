const express = require('express');
const router = express.Router();
const db = require('../../db');

const validateForm = async (req, res, next) => {
  const { rating, comment } = req.body;

  if (!rating || !comment ) {
    return res.status(400).send({ error: 'All fields are required' });
  }
};


router.post('/', function(request, response){
    var sql = "INSERT INTO feedback (rating, email, comment, status ) VALUES ?";
    var values = [
        [request.body.rating, request.body.email, request.body.comment, 1]
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
