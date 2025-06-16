const mysql = require('mysql');
const util = require('util');

//local connection
var con = mysql.createConnection({
    host     : 'localhost',
    user     : 'root',
    password : '',
    database : 'sydb001'
});

//live connecttion
// var con = mysql.createConnection({
//     host     : 'localhost',
//     user     : 'pearspor_root',
//     password : '10061987Yanna$',
//     database : 'pearspor_db001'
// });

con.connect(function(err) {
    if (err) throw err;
    console.log("Connected!");
  });

  // Enable promise-based query
con.query = util.promisify(con.query);

module.exports = con;