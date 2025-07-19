const User = require('../models/User');
const AppError = require('../utils/AppError');

class AuthService {
    /**
     * Register a new user
     * @param {Object} userData - User registration data
     * @param {string} userData.name - User's name
     * @param {string} userData.email - User's email
     * @param {string} userData.password - User's password
     * @param {string} userData.role - User's role (optional)
     * @returns {Object} Created user object
     */
    static async register(userData) {
        const { name, email, password, role = 'user' } = userData;
        
        // Check if user already exists
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            throw new AppError('User already exists with this email', 409);
        }
        
        // Create new user (password will be automatically hashed by the User model)
        const user = await User.create({
            name,
            email,
            password,
            role
        });
        
        return user;
    }
    
    /**
     * Authenticate user with email and password
     * @param {Object} credentials - Login credentials
     * @param {string} credentials.email - User's email
     * @param {string} credentials.password - User's password
     * @returns {Object} User object and token
     */
    static async authenticate(credentials) {
        const { email, password } = credentials;
        
        // Find user by email and include password field
        // (password has select: false in the model, so we need to explicitly include it)
        const user = await User.findOne({ email }).select('+password');
        
        if (!user) {
            throw new AppError('Invalid credentials', 401);
        }
        
        // Check if password matches using the model's matchPassword method
        const isPasswordMatch = await user.matchPassword(password);
        if (!isPasswordMatch) {
            throw new AppError('Invalid credentials', 401);
        }
        
        // Generate JWT token using the model's getSignedJwtToken method
        const token = user.getSignedJwtToken();
        
        // Remove password from response
        user.password = undefined;
        
        return {
            user,
            token
        };
    }
}

module.exports = AuthService;
