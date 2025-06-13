var express = require('express');
var router = express.Router();
var db = require('../../db');


/* checking email duplication */

router.post('/', function(request, response){
    db.query('select * from user where user_email=?',[request.body.email], function(error, result){
        if ( result == "" ){
            var sql = "INSERT INTO user (user_fname, user_mi, user_lname, user_address, user_email, user_cellphone, user_username, user_password, user_type, user_company, user_book, user_shop, user_bill, user_dtr, user_code, user_login, user_status ) VALUES ?";
            var values = [
            [request.body.fname, request.body.mi, request.body.lname, request.body.address, request.body.email, request.body.cellphone, '', request.body.password,'user', '', 0, 0, 0, 0,'user', 0, 1]
        ];
        db.query(sql, [values], function (error, results) {
                if ( error ){
                    response.status(400).send('Error in database operation');
                } else {
                    response.json(results);
                }
            });
        } else {
            response.status(400).send('Error in database operation');
        }
    });
});

module.exports = router;

