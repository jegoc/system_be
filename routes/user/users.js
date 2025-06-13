var express = require('express');
var router = express.Router();
var db = require('../../db');

/* GET users listing. */
router.get('/', function(request, response){
    db.query('select * from user', function(error, results){
        if ( error ){
            response.status(400).send('Error in database operation');
        } else {
            response.json(results);
        }
    });
});

module.exports = router;
