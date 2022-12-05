const session = require('express-session');
const Sequelize = require('sequelize');

// initialize sequelize with session store
const SequelizeStore = require('connect-session-sequelize')(session.Store);
const sequelize = new Sequelize('rankchoice', 'node', 'Changeme12345', {
  dialect: 'mssql',
  storage: './session.sqlite',
  logging: false,
});

const mySession = session({
  secret: process.env.expressSessionSecret,
  store: new SequelizeStore({
    db: sequelize,
  }),
  resave: false,
  proxy: true,
  saveUninitialized: true,
});

module.exports = {mySession};
