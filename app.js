// import modules
const express = require('express');
const engine = require('ejs-mate');

// initialize express
const app = express();
app.use(express.static('public'));
app.engine('ejs', engine);
app.set('view engine', 'ejs');

app.get('/', (req, res) => {
  res.render('homepage');
});

app.listen(8080, () => {});
