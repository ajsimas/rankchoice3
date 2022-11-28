// import modules
const express = require('express');
const engine = require('ejs-mate');
const rankchoice = require('./rankchoice.js');
const Connection = require('tedious').Connection;
const Request = require('tedious').Request;

// initialize express
const app = express();
app.use(express.static('public'));
app.use(express.urlencoded({extended: true}));
app.engine('ejs', engine);
app.set('view engine', 'ejs');

// initialize tedious
const config = {
  server: 'localhost',
  authentication: {
    type: 'default',
    options: {
      userName: 'node',
      password: 'Changeme12345',
    },
  },
  options: {
    database: 'rankchoice',
    trustServerCertificate: true,
    rowCollectionOnRequestCompletion: true,
  },
};
const connection = new Connection(config);
connection.on('connect', function(err) {
  if (err) console.log(err);
  else console.log('Connected');
});

// Express routes

app.get('/', (req, res) => res.render('homepage'));
app.get('/poll/create', (req, res) => res.render('create'));
app.post('/poll/create', (req, res) => rankchoice.createPoll(req));

app.listen(8080, () => { });
connection.connect();
