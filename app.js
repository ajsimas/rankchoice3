// import modules
const express = require('express');
const engine = require('ejs-mate');
const {Poll} = require('./rankchoice.js');

// initialize express
const app = express();
app.use(express.static('public'));
app.use(express.urlencoded({extended: true}));
app.engine('ejs', engine);
app.set('view engine', 'ejs');

// Express routes
app.get('/', (req, res) => res.render('homepage'));
app.get('/poll/create', (req, res) => res.render('create'));
app.post('/poll/create', (req, res) => {
  const poll = (new Poll).create(req.body);
  const pollWebId = poll.webId;
  res.redirect(`/poll/id/${pollWebId}`);
});
app.get('/poll/id/:id', (req, res) => {
  const poll = (new Poll).load(req.params.id);
  poll.then((poll) => res.render('poll', {poll}));
});

app.listen(8080, () => {});
