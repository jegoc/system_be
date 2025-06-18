const express = require('express');
const app = express();
const db = require('./db');
const cors = require('cors')
const bodyParser = require('body-parser');
// var http = require('http');
const port = '8888';

app.use('/routes/images/', express.static('./routes/images'));
app.use(cors());
app.use(express.json())
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

var indexRouter = require('./routes/index');
// Users
var usersRouter = require('./routes/user/users');
var loginRouter = require('./routes/user/login');
var forgotRouter = require('./routes/user/forgot');
var logoutRouter = require('./routes/user/logout');
var regchkemailRouter = require('./routes/user/regchkemail');
var registerRouter = require('./routes/user/register');
var otpRequestRouter = require('./routes/user/otp_request');
var sendEmailNoTokenRouter = require('./routes/user/send_email_notoken');
var signUpRouter = require('./routes/user/sign_up');
var userTrackingRouter = require('./routes/user/user_tracking');

//Others
var fbcRouter = require('./routes/others/upload');
var textFilesRouter = require('./routes/others/textfile');

app.use('/express', indexRouter);
app.use('/express/users', usersRouter);
app.use('/express/login', loginRouter);
app.use('/express/forgot', forgotRouter);
app.use('/express/logout', logoutRouter);
app.use('/express/regchkemail', regchkemailRouter);
app.use('/express/register', registerRouter);
app.use('/express/otp', otpRequestRouter);
app.use('/express/send_email_no_token', sendEmailNoTokenRouter);
app.use('/express/signup', signUpRouter);
app.use('/express/user_tracking', userTrackingRouter);

app.use('/express/upload', fbcRouter);
app.use('/express/textfile', textFilesRouter);



app.listen(0, () => console.log('Application is running'));
var listener = app.listen(port, function(){
    console.log('Listening on port ' + listener.address().port); //Listening on port 8888
});
