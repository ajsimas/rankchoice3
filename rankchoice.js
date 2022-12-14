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
    await sql.createPoll(this).then((result) => {
      this.pollCreatedSuccessfully = result;
    });
    return this;
  }

  async load(webId = this.webId, sessionId) {
    this.rounds = [];
    this.webId = webId;
    await sql.loadPoll(webId).then((results) => {
      if (results == undefined) return;
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
      results.forEach((result) => {
        const currentVoter = this.voters.find((voter) => voter.id == result.voterId);
        currentVoter.votes.push(new Vote(result));
      });
      this.voters.forEach((voter) => voter.sortVotes());
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
      this.calculateResults();
    }
    if (this.voters.length > 0) this.winnerName = this.returnWinnerName();
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
      await sql.recordVote(this, body, sessionId);
      this.voteRecorded = true;
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

    // Check name
    if (body.name == '') return false;

    // Check rank choices
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

  eliminateCandidates() {
    let ineligibleCandidate = '';
    const latestRound = this.latestRound();
    const minVoteCount = Math.min(...Object.values(latestRound));
    for (const [candidateId, voteCount] of Object.entries(latestRound)) {
      if (voteCount === minVoteCount) ineligibleCandidate = candidateId;
    }
    for (const voter of this.voters) {
      const voterNextEligibleVote = voter.findNextEligibleVote();
      if (voterNextEligibleVote.candidateId == ineligibleCandidate) {
        voterNextEligibleVote.eligible = false;
      }
    }
  }

  roundsComplete() {
    if (this.rounds.length === 0) return false;
    const latestRound = this.latestRound();
    let totalVotes = 0;
    let highestVoteCount = 0;
    for (const candidate in latestRound) {
      const voteCount = latestRound[candidate];
      if (highestVoteCount < voteCount) highestVoteCount = voteCount;
      totalVotes += voteCount;
    }
    if (highestVoteCount / totalVotes < 0.5) {
      this.eliminateCandidates();
      return false;
    }
    return true;
  }

  latestRound() {
    return this.rounds[this.rounds.length - 1];
  }

  calculateRound() {
    const results = {};
    for (const voter of this.voters) {
      const vote = voter.findNextEligibleVote();
      if (vote == undefined) continue;
      if (!results[vote.candidateId]) results[vote.candidateId] = 1;
      else results[vote.candidateId]++;
    }
    this.rounds.push(results);
  }

  calculateResults() {
    while (!this.roundsComplete()) {
      this.calculateRound();
    }
  }

  returnWinnerId() {
    if (this.rounds.length > 0) {
      const finalRound = this.rounds[this.rounds.length - 1];
      return Object.keys(finalRound).reduce((a, b) => finalRound[a] > finalRound[b] ? a : b);
    } else {
      return undefined;
    }
  }

  candidateIdToName(id) {
    return this.candidates.find((candidate) => candidate.id == id).name;
  }

  returnWinnerName() {
    this.winnerId = this.returnWinnerId();
    this.winnerName = this.candidateIdToName(this.winnerId);
    return this.winnerName;
  }
}

class Voter {
  constructor(id) {
    this.id = id;
    this.votes = [];
  }
  sortVotes() {
    this.votes.sort((a, b) => {
      return a.rankChoice < b.rankChoice ? -1 : 1;
    });
  }
  findNextEligibleVote() {
    for (const vote of this.votes) if (vote.eligible === true) return vote;
  }
}

class Vote {
  constructor(vote) {
    this.candidateName = vote.candidateName;
    this.candidateId = vote.candidateId;
    this.voterId = vote.voterId;
    this.rankChoice = vote.rankChoice;
    if (this.rankChoice != 0) {
      this.eligible = true;
    }
  }
}

function isNumeric(str) {
  if (typeof str != 'string') return false;
  return !isNaN(str) && !isNaN(parseFloat(str));
}

module.exports = {Poll};
