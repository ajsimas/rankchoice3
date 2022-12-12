const express = require('express');
const router = express.Router();
const {Poll} = require('../rankchoice.js');

// Express routes
router.get('/', (req, res) => res.render('homepage'));
router.get('/poll/create', (req, res) => res.render('create'));
router.post('/poll/create', (req, res) => {
  const poll = (new Poll).create(req.body);
  poll.then((poll) => {
    const pollWebId = poll.webId;
    res.redirect(`/poll/${pollWebId}`);
  });
});
router.get('/poll/:id', (req, res) => {
  console.log(req.session)
  const poll = (new Poll).load(req.params.id, req.session.id);
  poll.then((poll) => {
    res.render('poll', {poll});
  });
});
router.post('/poll/:id/vote', async (req, res) => {
  const poll = await (new Poll).load(req.params.id, req.session.id);
  poll.recordVote(req.body, req.session.id).then(() => {
    if (poll.voteRecorded) {
      res.redirect(`/poll/${poll.webId}`);
    } else {
      // TODO respond 'your vote was not recorded'
    }
  });
});
router.get('/poll/:id/results', async (req, res) => {
  const poll = (new Poll).load(req.params.id, req.session.id);
  poll.then((poll) => {
    res.render('poll_results', {poll});
  });
});
router.get('/blog/:slug', (req, res) => {

});

module.exports = router;
