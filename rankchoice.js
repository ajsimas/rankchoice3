/**
 * Represents a poll
 */
class Poll {
  /**
   * Creates a poll
   * @param {object} req from express
   */
  constructor(req) {
    this.name = req.body.name;
    this.candidates = {};
    for (const [key, value] of Object.entries(req.body)) {
      if (key.match(/^option(?:\d|10)$/)) this.candidates[key] = value;
    }
  }
}

module.exports = {Poll};
