// import modules
const express = require('express');
const engine = require('ejs-mate');
const {Poll} = require('./rankchoice.js');
const {mySession} = require('./express-session');

// initialize express
const app = express();
app.use(express.static('public'));
app.use(express.urlencoded({extended: true}));
app.use(mySession);
app.engine('ejs', engine);
app.set('view engine', 'ejs');

// Express routes
app.get('/', (req, res) => res.render('homepage'));
app.get('/poll/create', (req, res) => res.render('create'));
app.post('/poll/create', (req, res) => {
  const poll = (new Poll).create(req.body);
  poll.then((poll) => {
    const pollWebId = poll.webId;
    res.redirect(`/poll/${pollWebId}`);
  });
});
app.get('/poll/:id', (req, res) => {
  const poll = (new Poll).load(req.params.id, req.session.id);
  poll.then((poll) => {
    res.render('poll', {poll});
  });
});
app.post('/poll/:id/vote', async (req, res) => {
  const poll = await (new Poll).load(req.params.id, req.session.id);
  poll.recordVote(req.body, req.session.id).then(() => {
    if (poll.voteRecorded) {
      res.redirect(`/poll/${poll.webId}`);
    } else {
      // TODO respond 'your vote was not recorded'
    }
  });
});

app.listen(8080);
