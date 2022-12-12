// import modules
const express = require('express');
const engine = require('ejs-mate');
const {mySession} = require('./express-session');

// initialize express
const app = express();
const router = require("./routes/index");
app.use(express.static('public'));
app.use(express.urlencoded({extended: true}));
app.use(mySession);
app.engine('ejs', engine);
app.set('view engine', 'ejs');
app.use('/', router);
app.listen(8080);
