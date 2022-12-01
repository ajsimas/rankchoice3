// import moduels
const sql = require('./sql.js');

/**
 * Represents a poll
 */
class Poll {
  /**
   * Creates a poll
   * @param {object} body from express
   * @return {object} this
   */
  create(body) {
    this.name = body.name;
    this.candidates = {};
    this.webId = this.generatePollWebId();
    for (const [key, value] of Object.entries(body)) {
      if (key.match(/^option(?:\d|10)$/)) this.candidates[key] = value;
    }
    sql.createPoll(this);
    return this;
  }
  /**
   * Loads poll from db
   * @param {int} webId
   * @return {object}
   */
  async load(webId) {
    this.webId = webId;
    await sql.loadPoll(webId).then((results) => {
      this.pollId = results[0];
      this.name = results[1];
    });
    await sql.loadCandidates(this.pollId).then((results) => {
      this.candidates = results;
    });
    return this;
  }
  /**
 * Returns a unique randomly generate 32 character identifier
 * @return {string} 32 character identifier
 */
  generatePollWebId() {
    const characters = 'abcdefghjklmnpqrstuvwxyz';
    let id = '';
    for (let i = 0; i < 32; i++) {
      id += characters.charAt(Math.floor(Math.random() * characters.length));
    }
    return id;
  }
}

module.exports = {Poll};
