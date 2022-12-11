/* eslint-disable guard-for-in */
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
      this.voters = [];
      const voterIds = [...new Set(results.map((vote) => vote.voterId))];
      voterIds.forEach((voterId) => this.voters.push(new Voter(voterId)));
      console.log(this);
    });
    await sql.lookupVoter(sessionId, this.pollId).then((results) => {
      this.currentVoter = results;
    });
    if (this.currentVoter !== undefined) {
      await sql.loadVotes(this.pollId, this.currentVoter.voterId).then((results) => {
        this.currentVoter.votes = results;
      });
    }
    if (this.voters.length > 0) {
      this.calculateWinner();
    }
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
    if (this.validateVote(body)) {
      this.voteRecorded = true;
      await sql.recordVote(this, body, sessionId);
    } else {
      this.voteRecorded = false;
    }
    return;
  }

  validateVote(body) {
    const reqCandidateCount = Object.keys(body).length - 1;
    const ranksSubmitted = [];
    for (const optionNum of Object.keys(body)) {
      if (isNumeric(optionNum) && body[optionNum] != '') ranksSubmitted.push(body[optionNum]);
    }
    ranksSubmitted.sort((a, b) => a - b);
    // Check quantity of submitted votes is accurate
    if (reqCandidateCount !== this.candidates.length) return false;
    // Check ranks start at 1
    if (Math.min(...ranksSubmitted) != 1) return false;
    // Check that all ranks are unique
    if (new Set(ranksSubmitted).size != ranksSubmitted.length) return false;
    // Check that ranks are consecutive
    for (let i = 0; i < ranksSubmitted.length; i++) if (ranksSubmitted[i] != i + 1) return false;
    return true;
  }
class Voter {
  constructor(id) {
    this.id = id;
    this.votes = [];
  }
  sortVotes() {
    this.votes.sort((a, b) => {
      return a.rankchoice < b.rankchoice ? -1 : 1;
    });
  }
  findNextEligibleVote() {
    for (const vote of this.votes) if (vote.eligible === true) return vote;
  }
}

function isNumeric(str) {
  if (typeof str != 'string') return false;
  return !isNaN(str) && !isNaN(parseFloat(str));
}

module.exports = {Poll};
