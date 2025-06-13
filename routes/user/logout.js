var express = require('express');
var router = express.Router();
var db = require('../../db');

router.get('/:cookie', function(request, response){
    db.query('select * from user where user_id=? and user_status=1',[request.params.cookie], function(error, results){
        if ( error ){
            response.status(400).send('Error in database operation');
        } else {
            db.query('UPDATE user SET user_login = 0 WHERE user_id=? and user_status=1',[request.params.cookie], function(error, res){
                if ( error ){
                    res.status(400).send('Error in database operation');
                } else {
                    response.json(results);
                }
            });
        }
    });
});

module.exports = router;
