const express = require('express');
const path = require('path');
const router = express.Router();
const { requireAuth } = require('../middlewares/authMiddleware');

router.get('/', (req, res) => {
  if (req.session && req.session.userId) {
    return res.redirect('/dashboard');
  }
  res.redirect('/login');
});

router.get('/login', (req, res) => {
  if (req.session && req.session.userId) {
    return res.redirect('/dashboard');
  }
  res.sendFile(path.join(__dirname, '../../views/login.html'));
});

router.get('/dashboard', requireAuth, (req, res) => {
  res.sendFile(path.join(__dirname, '../../views/dashboard.html'));
});

module.exports = router;
