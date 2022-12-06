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

function loadPoll(webId) {
  const query = `SELECT poll_id,name
  FROM poll
  WHERE poll_web_id = '${webId}'`;
  const promise = new Promise((resolve, reject) => {
    const request = new Request(query, (err, rowCount, rows) => {
      if (err) console.log(err);
      const results = [];
      results.push(rows[0][0].value);
      results.push(rows[0][1].value);
      resolve(results);
    });
    connection.execSql(request);
  });
  return promise;
}

function loadCandidates(pollId) {
  const query = `SELECT candidate_id,option_num,name
  FROM candidate
  WHERE poll_id = ${pollId}
  ORDER BY option_num ASC`;
  const promise = new Promise((resolve, reject) => {
    const request = new Request(query, (err, rowCount, rows) => {
      const candidates = [];
      for (const row of rows) {
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

function loadVotes(pollId, voterId) {
  const promise = new Promise((resolve, reject) => {
    let query = `SELECT candidate.name, vote.candidate_id, vote.voter_id, vote.rankchoice
    FROM vote
    INNER JOIN candidate ON candidate.candidate_id=vote.candidate_id
    WHERE candidate.poll_id = '${pollId}'`;
    if (voterId !== undefined) query += ` AND vote.voter_id = '${voterId}'`;
    const request = new Request(query, (err, rowCount, rows) => {
      const votes = [];
      for (const row of rows) {
        const vote = {};
        vote.candidateName = row[0].value;
        vote.candidateId = row[1].value;
        vote.voterId = row[2].value;
        vote.rankChoice = row[3].value;
        votes.push(vote);
      }
      resolve(votes);
    });
    connection.execSql(request);
  });
  return promise;
}

async function recordVote(poll, body, sessionId) {
  const voter = await lookupVoter(sessionId, poll.pollId) ||
    await saveVoter(sessionId, poll.pollId, body.name);
  for (const vote of Object.getOwnPropertyNames(body)) {
    if (isNumeric(vote)) {
      const query = `INSERT INTO vote (candidate_id,voter_id,rankchoice,date_created, date_modified)
        VALUES ('${vote}',${voter.voterId},${body[vote]},CURRENT_TIMESTAMP,CURRENT_TIMESTAMP)`;
      await recordVoteSql(query);
    }
  }
  return;
}

function recordVoteSql(query) {
  const promise = new Promise((resolve, reject) => {
    const request = new Request(query, (err, rowCount, rows) => {
      if (err) console.log(err);
      resolve();
    });
    connection.execSql(request);
  });
  return promise;
};

function isNumeric(str) {
  if (typeof str != 'string') return false;
  return !isNaN(str) && !isNaN(parseFloat(str));
}

function lookupVoter(sessionId, pollId) {
  const promise = new Promise((resolve, reject) => {
    const query = `SELECT TOP (1) voter_id,session_id,name
      FROM voter
      WHERE session_id='${sessionId}' AND poll_id='${pollId}'`;
    const request = new Request(query, (err, rowCount, rows) => {
      if (err) console.log(err);
      if (rows.length !== 0) {
        const voter = {};
        voter.voterId = rows[0][0].value;
        voter.sessionId = rows[0][1].value;
        voter.name = rows[0][2].value;
        resolve(voter);
      }
      resolve();
    });
    connection.execSql(request);
  });
  return promise;
}

function saveVoter(sessionId, pollId, name) {
  const promise = new Promise((resolve, reject) => {
    const query = `INSERT INTO voter (session_id,poll_id,name,date_created,date_modified)
      OUTPUT INSERTED.voter_id,INSERTED.session_id,INSERTED.name
      VALUES ('${sessionId}',${pollId},'${name}',CURRENT_TIMESTAMP,CURRENT_TIMESTAMP)`;
    const request = new Request(query, (err, rowCount, rows) => {
      if (err) console.log(err);
      const voter = {};
      voter.voterId = rows[0][0].value;
      voter.sessionId = rows[0][1].value;
      voter.name = rows[0][2].value;
      resolve(voter);
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

module.exports = {connection, createPoll, loadPoll, loadCandidates, recordVote, loadVotes, lookupVoter};
