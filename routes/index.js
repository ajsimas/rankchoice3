/* eslint-disable new-cap */
const express = require('express');
const router = express.Router();
const {Poll} = require('../rankchoice.js');
const {Post} = require('../blog.js');

// Express routes
router.get('/', (req, res) => res.render('homepage'));
router.get('/poll/create', (req, res) => res.render('create', {messages: req.flash('error')}));
router.post('/poll/create', (req, res) => {
  const poll = (new Poll).create(req.body);
  poll.then((poll) => {
    if (poll.pollCreatedSuccessfully) {
      const pollWebId = poll.webId;
      req.flash('info', 'Poll created successfully');
      res.redirect(`/poll/${pollWebId}`);
    } else {
      req.flash('error', 'Poll was not created');
      res.redirect(`/poll/create`);
    }
  });
});
router.get('/poll/:id', (req, res) => {
  const poll = (new Poll).load(req.params.id, req.session.id);
  poll.then((poll) => {
    res.render('poll', {poll, messages: req.flash('info')});
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
  const post = (new Post).load(req.params.slug);
  post.then((post) => {
    res.render('post', {post});
  });
});

module.exports = router;
