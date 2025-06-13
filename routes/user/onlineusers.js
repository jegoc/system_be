var express = require('express');
var router = express.Router();
var db = require('../../db');

/* GET users listing. */
router.get('/', function(request, response){
    db.query('select * from user WHERE user_login=1 AND user_status=1 ORDER BY user_fname ASC', function(error, results){
        if ( error ){
            response.status(400).send('Error in database operation');
        } else {
            response.json(results);
        }
    });
});

module.exports = router;
