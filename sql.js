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
 * @return {promise}
 */
function createPoll(poll) {
  const query = `INSERT INTO poll (poll_web_id,name,date_created,date_modified) OUTPUT Inserted.poll_id VALUES
    ('${poll.webId}','${poll.name}',CURRENT_TIMESTAMP,CURRENT_TIMESTAMP)`;
  const promise = new Promise((resolve, reject) => {
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
      const request = new Request(query, (err, rowCount, rows) => {
        resolve();
      });
      connection.execSql(request);
    });
    connection.execSql(request);
  });
  return promise;
}

/**
 * loads poll from SQL
 * @param {string} webId
 * @return {Promise}
 */
function loadPoll(webId) {
  const query = `SELECT poll_id,name
  FROM poll
  WHERE poll_web_id = '${webId}'`;
  const promise = new Promise((resolve, reject) => {
    const request = new Request(query, (err, rowCount, rows) => {
      const results = [];
      results.push(rows[0][0].value);
      results.push(rows[0][1].value);
      resolve(results);
    });
    connection.execSql(request);
  });
  return promise;
}

/**
 * @param {int} pollId
 * @return {promise}
 */
function loadCandidates(pollId) {
  const query = `SELECT candidate_id,option_num,name
  FROM candidate
  WHERE poll_id = ${pollId}
  ORDER BY option_num ASC`;
  const promise = new Promise((resolve, reject) => {
    const request = new Request(query, (err, rowCount, rows) => {
      const candidates = [];
      for (const row of rows) {
        /* console.log('new row ' + JSON.stringify(row)); */
        const candidate = {};
        candidate.id = row[0].value;
        candidate.optionNum = row[1].value;
        candidate.name = row[2].value;
        candidates.push(candidate);
      }
      resolve(candidates);
    });
    connection.execSql(request);
  });
  return promise;
}

const connection = new Connection(config);
connection.on('connect', function(err) {
  if (err) console.log(err);
  else console.log('Connected');
});

connection.connect();

module.exports = {connection, createPoll, loadPoll, loadCandidates};
