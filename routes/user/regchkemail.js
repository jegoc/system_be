var express = require('express');
var router = express.Router();
var db = require('../../db');

/* GET users listing. */
router.post('/', function(request, response){
    db.query('select * from user where user_email=?',[request.body.email], function(error, results){
        if ( results == "" ){
            response.json(results);
        } else {
            response.json({ msg:"Username already been taken" });
        }
     });
});

module.exports = router;
