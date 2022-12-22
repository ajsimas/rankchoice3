const express = require('express');
const passport = require('passport');
const LocalStrategy = require('passport-local');
const crypto = require('crypto');
const sql = require('../sql.js');
const sendEmail = require('../send-email.js');
// eslint-disable-next-line new-cap
const router = express.Router();

passport.use(new LocalStrategy(function verify(username, password, cb) {
  sql.loginLocal(username).then((results) => {
    if (results == false) {
      return cb(null, false, {message: 'Incorrect username or password.'});
    }
    crypto.pbkdf2(password, results.salt, 310000, 32, 'sha256',
        (err, hashedPassword) => {
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
  res.render('login', {messages: req.session.messages});
});

router.post('/login/password', passport.authenticate('local', {
  successRedirect: '/',
  failureMessage: true,
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

function generateId() {
  const characters = 'abcdefghjklmnpqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ';
  let id = '';
  for (let i = 0; i < 32; i++) {
    id += characters.charAt(Math.floor(Math.random() * characters.length));
  }
  return id;
}

router.post('/signup', (req, res) => {
  const salt = crypto.randomBytes(16);
  crypto.pbkdf2(req.body.password, salt, 310000, 32, 'sha256',
      async (err, hashedPassword) => {
        if (err) return;
        const accountId = generateId();
        const verificationToken = generateId();
        const user = await sql.signupLocal(req.body.username, hashedPassword,
            salt, accountId, verificationToken);
        sendEmail.emailVerification(user.username, accountId,
            verificationToken);
        req.login(user, () => {
          res.redirect('/');
        });
      });
});

router.get('/user/:accountId/verify/:verificationToken', async (req, res) => {
  const accountId = req.params.accountId;
  const verificationToken = req.params.verificationToken;
  const user = await sql.emailVerification(accountId, verificationToken);
  req.login(user, () => res.redirect('/'));
});

module.exports = router;
