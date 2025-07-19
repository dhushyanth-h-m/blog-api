const express = require('express');
const User = require('../models/User');
const validate = require('../middleware/validation');
const { registerSchema, loginSchema } = require('../validators/authValidator');
const router = express.Router();

// Register 
router.post('/register', validate(registerSchema), async (req, res) => {
    try {
        const { name, email, password } = req.body;
        const user = await User.create({
            name, 
            email,
            password
        });
        const token = user.getSignedJwtToken();
        res.status(201).json({
            success: true,
            token
        });
    } catch (error) {
        // Check for duplicate email error
        if (error.code === 11000) {
            return res.status(400).json({
                success: false,
                message: 'Email already exists'
            });
        }
        res.status(400).json({
            success: false,
            message: error.message
        });
    }
});

// Login
router.post('/login', validate(loginSchema), async (req, res) => {
    try {
        const { email, password } = req.body;

        // Find user and explicitly select password
        const user = await User.findOne({ email }).select('+password');

        if (!user) {
            return res.status(401).json({
                success: false,
                message: 'Invalid credentials'
            });
        }

        // Check password match
        const isMatch = await user.matchPassword(password);

        if (!isMatch) {
            return res.status(401).json({
                success: false,
                message: 'Invalid credentials'
            });
        }

        const token = user.getSignedJwtToken();
        res.json({
            success: true,
            token
        });
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error'
        });
    }
});

module.exports = router;