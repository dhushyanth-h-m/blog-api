const express = require('express');
const AuthService = require('../services/authService');
const validate = require('../middleware/validation');
const { registerSchema, loginSchema } = require('../validators/authValidator');
const router = express.Router();

// Register 
router.post('/register', validate(registerSchema), async (req, res) => {
    try {
        const { name, email, password } = req.body;
        
        const user = await AuthService.register({
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
        // Handle known application errors
        if (error.isOperational) {
            return res.status(error.statusCode).json({
                success: false,
                message: error.message
            });
        }
        
        // Handle unexpected errors
        console.error('Registration error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error'
        });
    }
});

// Login
router.post('/login', validate(loginSchema), async (req, res) => {
    try {
        const { email, password } = req.body;

        // Use AuthService instead of direct User model operations
        const { user, token } = await AuthService.authenticate({
            email,
            password
        });

        res.json({
            success: true,
            token
        });
    } catch (error) {
        // Handle known application errors  
        if (error.isOperational) {
            return res.status(error.statusCode).json({
                success: false,
                message: error.message
            });
        }
        
        // Handle unexpected errors
        console.error('Login error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error'
        });
    }
});

module.exports = router;