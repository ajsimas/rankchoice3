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

/**
 * poll object is used to create database entries
 * @param {object} poll poll object
 */
function createPoll(poll) {
  const query = `INSERT INTO poll (name,date_created,date_modified) OUTPUT Inserted.poll_id VALUES
    ('${poll.name}',CURRENT_TIMESTAMP,CURRENT_TIMESTAMP)`;
  const request = new Request(query, (err, rowCount, rows) => {
    const pollId = rows[0][0].value;
    let query = 'INSERT INTO candidate (poll_id,option_num,name,date_created,date_modified) VALUES ';
    candidateQuery = [];
    optionNum = 1;
    for (const key of Object.getOwnPropertyNames(poll.candidates)) {
      candidateQuery.push(`(${pollId},${optionNum},'${poll.candidates[key]}',
        CURRENT_TIMESTAMP,CURRENT_TIMESTAMP)`);
      optionNum++;
    }
    query += candidateQuery.join(',');
    const request = new Request(query, (err, rowCount, rows) => {});

    console.log(request);
    connection.execSql(request);
  });
  connection.execSql(request);
}

const connection = new Connection(config);
connection.on('connect', function(err) {
  if (err) console.log(err);
  else console.log('Connected');
});

module.exports = {connection, createPoll};
