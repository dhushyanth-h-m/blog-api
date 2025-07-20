const AuthService = require('../services/authService');
const asyncHandler = require('../utils/asyncHandler');
const AppError = require('../utils/AppError');

const register = asyncHandler(async (req, res) => {
    const { name, email, password } = req.body;
    const user = await AuthService.register({ name, email, password });
    const token = user.getSignedJwtToken();

    // Prevent password from being sent in the response
    user.password = undefined;

    res.status(201).json({
        success: true, 
        token,
        data: user
    });
});

const login = asyncHandler(async (req, res) => {
    const {email, password} = req.body;
    const { user, token } = await AuthService.authenticate({ email, password });

    res.status(200).json({
        success: true,
        token,
        data: user
    });
});

const getProfile = asyncHandler(async (req, res) => {
    res.status(200).json({ sucess: true, data: req.user });
});

module.exports = {
    register, 
    login,
    getProfile
};