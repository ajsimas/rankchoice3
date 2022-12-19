const express = require('express');
const passport = require('passport');
const LocalStrategy = require('passport-local');
const crypto = require('crypto');
const sql = require('../sql.js');
// eslint-disable-next-line new-cap
const router = express.Router();

passport.use(new LocalStrategy(function verify(username, password, cb) {
  sql.loginLocal(username).then((results) => {
    console.log(results);
    if (results == undefined) {
      return cb(null, false, {message: 'Incorrect usernameor password.'});
    }
    crypto.pbkdf2(password, results.salt, 310000, 32, 'sha256',
        (err, hashedPassword) => {
          console.log(JSON.stringify(results.hashedPassword));
          console.log(JSON.stringify(hashedPassword));
          if (!crypto.timingSafeEqual(results.hashedPassword, hashedPassword)) {
            return cb(null, false,
                {message: 'Incorrect username or password.'});
          }
          return cb(null, results);
        });
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

router.post('/signup', (req, res) => {
  const salt = crypto.randomBytes(16);
  crypto.pbkdf2(req.body.password, salt, 310000, 32, 'sha256',
      async (err, hashedPassword) => {
        console.log(typeof hashedPassword);
        console.log(JSON.stringify(hashedPassword));
        console.log(hashedPassword);
        if (err) return;
        console.log(salt);
        const user = await sql.signupLocal(req.body.username, hashedPassword,
            salt);
        req.login(user, () => {
          res.redirect('/');
        });
      });
});

module.exports = router;
