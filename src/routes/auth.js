const express = require('express');
const User = require('../models/User');
const router = express.Router();

// Register 
router.post('/register', async (req, res) => {
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
        res.status(400).json({
            success: false,
            message: error.message
        });
    }
})

// Login
router.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;
        const user = await User.findOne({ email }).select('+password');

        if (!user || !(await user.matchPassword(password))) {
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
        res.status(500).json({
            success: false,
            message: 'Server error'
        });
    }
});

module.exports = router;