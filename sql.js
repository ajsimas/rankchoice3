const Connection = require('tedious').Connection;
const Request = require('tedious').Request;

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

module.exports = {connection};
