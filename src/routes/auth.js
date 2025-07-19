const express = require('express');
const validate = require('../middleware/validation');
const { registerSchema, loginSchema } = require('../validators/authValidator');
const { register, login, getProfile } = require('../controllers/authController');
const { protect } = require('../middleware/auth');

const router = express.Router();

// Register 
router.post('/register', validate(registerSchema), register);

// Login
router.post('/login', validate(loginSchema), login);

// Get profile
router.get('/profile', protect, getProfile);

module.exports = router;