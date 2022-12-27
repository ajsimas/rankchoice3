const Connection = require('tedious').Connection;
const Request = require('tedious').Request;
const TYPES = require('tedious').TYPES;

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
  const promise = new Promise(async (resolve, reject) => {
    const query = `INSERT INTO poll (poll_web_id,name,date_created,\
date_modified)
OUTPUT Inserted.poll_id
VALUES (@poll_web_id,@name,CURRENT_TIMESTAMP,CURRENT_TIMESTAMP)`;
    const request = new Request(query, async (err, rowCount, rows) => {
      if (err) {
        console.log(err);
        resolve(false);
      }
      if (rows.length == 0) resolve(false);
      const pollId = rows[0][0].value;
      optionNum = 1;
      for (const key of Object.getOwnPropertyNames(poll.candidates)) {
        await createCandidates(pollId, optionNum, poll.candidates[key]);
        optionNum++;
      }
      resolve(true);
    });
    request.addParameter('poll_web_id', TYPES.VarChar, poll.webId);
    request.addParameter('name', TYPES.VarChar, poll.name);
    connection.execSql(request);
  });
  return promise;
}

function createCandidates(pollId, optionNum, name) {
  const promise = new Promise((resolve, reject) => {
    const query = `INSERT INTO candidate (poll_id,option_num,name,
date_created,date_modified) VALUES (@pollId,@optionNum,@name,CURRENT_TIMESTAMP,\
CURRENT_TIMESTAMP)`;
    const request = new Request(query, (err, rowCount, rows) => {
      resolve(true);
    });
    request.addParameter('pollId', TYPES.Int, pollId);
    request.addParameter('optionNum', TYPES.Int, optionNum);
    request.addParameter('name', TYPES.VarChar, name);
    connection.execSql(request);
  });
  return promise;
}

function loadPoll(webId) {
  const promise = new Promise((resolve, reject) => {
    const query = `SELECT poll_id,name
FROM poll
WHERE poll_web_id=@webId`;
    const request = new Request(query, (err, rowCount, rows) => {
      if (err) {
        console.log(err);
        resolve();
      }
      if (rows.length != 0) {
        const results = [];
        results.push(rows[0][0].value);
        results.push(rows[0][1].value);
        resolve(results);
      } else resolve();
    });
    request.addParameter('webId', TYPES.VarChar, webId);
    connection.execSql(request);
  });
  return promise;
}

function loadCandidates(pollId) {
  const promise = new Promise((resolve, reject) => {
    const query = `SELECT candidate_id,option_num,name FROM candidate
WHERE poll_id = @pollId
ORDER BY option_num ASC`;
    const request = new Request(query, (err, rowCount, rows) => {
      const candidates = [];
      for (const row of rows) {
        const candidate = {};
        candidate.id = row[0].value;
        candidate.optionNum = row[1].value;
        candidate.name = row[2].value;
        candidate.eligible = true;
        candidates.push(candidate);
      }
      resolve(candidates);
    });
    request.addParameter('pollId', TYPES.VarChar, pollId);
    connection.execSql(request);
  });
  return promise;
}

function loadVotes(pollId, voterId) {
  const promise = new Promise((resolve, reject) => {
    let query = `SELECT candidate.name, vote.candidate_id, vote.voter_id,\
vote.rankchoice FROM vote
INNER JOIN candidate ON candidate.candidate_id=vote.candidate_id
WHERE candidate.poll_id = @pollId`;
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
    request.addParameter('pollId', TYPES.VarChar, pollId);
    connection.execSql(request);
  });
  return promise;
}

async function recordVote(poll, body, sessionId) {
  const voter = await lookupVoter(sessionId, poll.pollId) ||
    await saveVoter(sessionId, poll.pollId, body.name);
  for (const vote of Object.getOwnPropertyNames(body)) {
    if (isNumeric(vote)) {
      if (body[vote] == 0) body[vote] = `''`;
      const candidateId = poll.candidates.filter((candidate) => {
        return candidate.optionNum == vote;
      })[0].id;
      if (await recordVoteSql([body[vote], candidateId, voter.voterId]) ==
        false) return false;
    }
  }
  return true;
}

function recordVoteSql(vote) {
  const promise = new Promise((resolve, reject) => {
    const query = `UPDATE vote
SET rankchoice=@rankChoice,date_modified=CURRENT_TIMESTAMP
WHERE candidate_id=@candidateId AND voter_id=@voterId
IF @@ROWCOUNT=0
INSERT INTO vote
(candidate_id,voter_id,rankchoice,date_created, date_modified)
VALUES (@candidateId,@voterId,@rankChoice,CURRENT_TIMESTAMP,\
CURRENT_TIMESTAMP)`;
    const request = new Request(query, (err, rowCount, rows) => {
      if (err) console.log(err);
      resolve(true);
    });
    request.addParameter('rankChoice', TYPES.Int, vote[0]);
    request.addParameter('candidateId', TYPES.Int, vote[1]);
    request.addParameter('voterId', TYPES.Int, vote[2]);
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
WHERE session_id=@sessionId AND poll_id=@pollId`;
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
    request.addParameter('sessionId', TYPES.VarChar, sessionId);
    request.addParameter('pollId', TYPES.NChar, pollId);
    connection.execSql(request);
  });
  return promise;
}

function saveVoter(sessionId, pollId, name) {
  const promise = new Promise((resolve, reject) => {
    const query = `INSERT INTO voter (session_id,poll_id,name,date_created,\
date_modified)
OUTPUT INSERTED.voter_id,INSERTED.session_id,INSERTED.name
VALUES (@sessionId,@pollId,@name,\
CURRENT_TIMESTAMP,CURRENT_TIMESTAMP)`;
    const request = new Request(query, (err, rowCount, rows) => {
      if (err) console.log(err);
      const voter = {};
      voter.voterId = rows[0][0].value;
      voter.sessionId = rows[0][1].value;
      voter.name = rows[0][2].value;
      resolve(voter);
    });
    request.addParameter('sessionId', TYPES.VarChar, sessionId);
    request.addParameter('pollId', TYPES.VarChar, pollId);
    request.addParameter('name', TYPES.VarChar, name);
    connection.execSql(request);
  });
  return promise;
}

function loadPost(slug) {
  const promise = new Promise((resolve, reject) => {
    const query = `SELECT * FROM post WHERE slug=@slug`;
    const request = new Request(query, (err, rowCount, rows) => {
      const result = {
        title: rows[0][1].value,
        body: rows[0][3].value,
      };
      resolve(result);
    });
    request.addParameter('slug', TYPES.VarChar, slug);
    connection.execSql(request);
  });
  return promise;
}

function hex2bin(hex) {
  return Buffer.from(hex, 'hex');
}

function loginLocal(username) {
  const promise = new Promise((resolve, reject) => {
    const query = `SELECT * FROM [rankchoice].[dbo].[user] \
WHERE username=@username`;
    const request = new Request(query, (err, rowCount, rows) => {
      if (rows.length == 0) {
        resolve(false);
      } else {
        const result = {
          username: rows[0][1].value,
          hashedPassword: hex2bin(rows[0][2].value),
          salt: hex2bin(rows[0][3].value),
        };
        resolve(result);
      }
    });
    request.addParameter('username', TYPES.VarChar, username);
    connection.execSql(request);
  });
  return promise;
}

function signupLocal(username, password, salt, accountId, verificationToken) {
  const promise = new Promise((resolve, reject) => {
    const query = `INSERT INTO [rankchoice].[dbo].[user] (username,\
hashed_password, salt, account_id, verification_token, email_verified)
OUTPUT Inserted.user_id
VALUES (@username,@password,@salt,@accountId,@verificationToken,0)`;
    const request = new Request(query, (err, rowCount, rows) => {
      resolve({id: rows[0][0].value,
        username: username});
    });
    request.addParameter('username', TYPES.VarChar, username);
    request.addParameter('password', TYPES.VarChar, password.toString('hex'));
    request.addParameter('salt', TYPES.VarChar, salt.toString('hex'));
    request.addParameter('accountId', TYPES.VarChar, accountId);
    request.addParameter('verificationToken', TYPES.VarChar, verificationToken);
    connection.execSql(request);
  });
  return promise;
}

function emailVerification(accountId, verificationToken) {
  const promise = new Promise((resolve, reject) => {
    const query = `UPDATE [rankchoice].[dbo].[user]
SET email_verified=1
WHERE account_id=@accountId AND verification_token=@verificationToken`;
    const request = new Request(query, (err, rowCount, rows) => {
      const query = `SELECT user_id,username
      FROM [rankchoice].[dbo].[user]
      WHERE account_id=@accountId AND
      verification_token=@verificationToken`;
      const request = new Request(query, (err, rowCount, rows) => {
        resolve({id: rows[0][0].value, username: rows[0][1].value});
      });
      request.addParameter('accountId', TYPES.VarChar, accountId);
      request.addParameter('verificationToken', TYPES.VarChar,
          verificationToken);
      connection.execSql(request);
    });
    request.addParameter('accountId', TYPES.VarChar, accountId);
    request.addParameter('verificationToken', TYPES.VarChar, verificationToken);
    connection.execSql(request);
  });
  return promise;
}

function accountExists(emailAddress) {
  const promise = new Promise((resolve, reject) => {
    const query = `SELECT username FROM [rankchoice].[dbo].[user] \
WHERE username=@emailAddress`;
    const request = new Request(query, (err, rowCount, rows) => {
      if (rows.length > 0) resolve(true);
      else resolve(false);
    });
    request.addParameter('emailAddress', TYPES.VarChar, emailAddress);
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

module.exports = {connection, createPoll, loadPoll, loadCandidates,
  recordVote, loadVotes, lookupVoter, loadPost, loginLocal, signupLocal,
  emailVerification, accountExists};
