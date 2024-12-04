const express = require('express');
const router = express.Router();
const userCtrl =require('../Controllers/User');
const auth = require('../Middleware/Auth');

router.post('/signup', userCtrl.signup);
router.post('/login', userCtrl.login);

module.exports = router;