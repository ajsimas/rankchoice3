const express = require('express');
const passport = require('passport');
const LocalStrategy = require('passport-local');
/* const crypto = require('crypto'); */
const sql = require('../sql.js');
// eslint-disable-next-line new-cap
const router = express.Router();

temp = {
  id: 1,
  username: 'austin@simas.io',
};

passport.use(new LocalStrategy(function verify(username, password, cb) {
  sql.loginLocal(username).then((results) => {
    return cb(null, temp);
  });
}));

passport.serializeUser(function(user, cb) {
  process.nextTick(function() {
    cb(null, {id: user.id, username: user.username});
  });
});

passport.deserializeUser(function(user, cb) {
  process.nextTick(function() {
    return cb(null, user);
  });
});

router.get('/login', (req, res) => {
  res.render('login');
});

router.post('/login/password', passport.authenticate('local', {
  successRedirect: '/',
  failureRedirect: '/login',
}));

router.post('/logout', function(req, res, next) {
  req.logout(function(err) {
    if (err) return next(err);
    res.redirect('/');
  });
});

router.get('/signup', function(req, res, next) {
  res.render('signup');
});

module.exports = router;
