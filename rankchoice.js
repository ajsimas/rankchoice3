/**
 * Function takes req object from express and uses values off 'body' to create
 * a new poll.
 * @param {*} req
 */
function createPoll(req) {
  console.log(req.body);
}

module.exports = {createPoll};
