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
    var sql = "INSERT INTO feedback (rating, comment, status ) VALUES ?";
    var values = [
        [request.body.rating, request.body.comment, 1]
    ];
    db.query(sql, [values], function (error, results) {
        if ( error ){
            response.status(400).send('Error in database operation');
        } else {
            response.json(results);
        }
    });
});

// router.post('/', validateForm, async (req, res) => {
//   try {
//     const {
//       rating, comment
//     } = req.body;

//     const accountData = [
//       rating, comment, 0
//     ];

//     const insertAccountQuery = `
//       INSERT INTO feedback (
//         rating, comment, status
//       ) VALUES (?)`;

//     const accountResult = await db.query(insertAccountQuery, [accountData]);

//     if (accountResult.affectedRows === 0) {
//       return res.status(400).json({ success: false, message: 'Account creation failed' });
//     }

//     return res.json({ success: true, message: 'User registered successfully' });

//   } catch (error) {
//     console.error('Signup Error:', error);
//     return res.status(500).json({ success: false, message: 'Internal server error' });
//   }
// });

module.exports = router;
