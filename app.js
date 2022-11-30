// import modules
const express = require('express');
const engine = require('ejs-mate');
const {Poll} = require('./rankchoice.js');
const {connection, createPoll} = require('./sql.js');

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
  createPoll(new Poll(req));
});

app.listen(8080, () => { });
connection.connect();
