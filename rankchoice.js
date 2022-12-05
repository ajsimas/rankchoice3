// import moduels
const sql = require('./sql.js');

class Poll {
  async create(body) {
    this.name = body.name;
    this.candidates = {};
    this.webId = this.generatePollWebId();
    for (const [key, value] of Object.entries(body)) {
      if (key.match(/^option(?:\d|10)$/)) this.candidates[key] = value;
    }
    await sql.createPoll(this);
    return this;
  }

  async load(webId = this.webId, sessionId) {
    this.webId = webId;
    await sql.loadPoll(webId).then((results) => {
      this.pollId = results[0];
      this.name = results[1];
    });
    await sql.loadCandidates(this.pollId).then((results) => {
      this.candidates = results;
    });
    await sql.loadVotes(this.pollId).then((results) => {
      this.votes = results;
    });
    await sql.lookupVoter(sessionId, this.pollId).then((results) => {
      this.currentVoter = results;
    });
    if (this.currentVoter !== undefined) {
      await sql.loadVotes(this.pollId, this.currentVoter.voterId).then((results) => {
        this.currentVoter.votes = results;
      });
    }
    console.log(JSON.stringify(this));
    return this;
  }

  generatePollWebId() {
    const characters = 'abcdefghjklmnpqrstuvwxyz';
    let id = '';
    for (let i = 0; i < 32; i++) {
      id += characters.charAt(Math.floor(Math.random() * characters.length));
    }
    return id;
  }

  async recordVote(body, sessionId) {
    await sql.recordVote(this, body, sessionId);
    return this;
  }
}

module.exports = {Poll};
