// import modules
const express = require('express');
const engine = require('ejs-mate');
const {mySession} = require('./express-session');
const flash = require('connect-flash');
const passport = require('passport');
const reload = require('reload');

// initialize express
const app = express();
const router = require('./routes/index');
const authRouter = require('./routes/auth');
app.use(express.static('public'));
app.use(express.urlencoded({extended: true}));
app.use(mySession);
app.use(passport.authenticate('session'));
app.use(flash());
app.engine('ejs', engine);
app.set('view engine', 'ejs');
app.use('/', router);
app.use('/', authRouter);
reload(app);
app.listen(8080);
