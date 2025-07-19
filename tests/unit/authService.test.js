const AuthService = require('../../src/services/authService');
const User = require('../../src/models/User');

describe('AuthService', () => {
    beforeEach(async () => {
        await User.deleteMany({});
    });

    it('register() should create a new user', async () => {
        const user = await AuthService.register({
            name: 'Alice',
            email: 'alice@example.com',
            password: 'Password1!',
            role: 'user'
        });
        expect(user).toHaveProperty('_id');
        expect(user.email).toBe('alice@example.com');
        expect(user.name).toBe('Alice');
    });

    it('authenticate() should throw on invalid credentials', async() => {
        await AuthService.register({
            name: 'Bob', 
            email: 'bob@example.com',
            password: 'Secret1', 
            role: 'user'
        });
        
        await expect(
            AuthService.authenticate({
                email: 'bob@example.com',
                password: 'WrongPass'
            })
        ).rejects.toThrow('Invalid credentials');
    });

    it('authenticate() should return user and token on valid credentials', async() => {
        await AuthService.register({
            name: 'Charlie', 
            email: 'charlie@example.com',
            password: 'ValidPass123', 
            role: 'user'
        });
        
        const result = await AuthService.authenticate({
            email: 'charlie@example.com',
            password: 'ValidPass123'
        });
        
        expect(result).toHaveProperty('user');
        expect(result).toHaveProperty('token');
        expect(result.user.email).toBe('charlie@example.com');
        expect(result.user.name).toBe('Charlie');
        expect(typeof result.token).toBe('string');
    });
})