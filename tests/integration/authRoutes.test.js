const request = require('supertest');
const app = require('../../src/app');

describe('Auth Routes', () => {
    it('POST /api/auth/register should register a user and return token', async() => {
        const res = await request(app)
            .post('/api/auth/register')
            .send({ name: 'Test', email: 'test@t.com', password: 'Password1!'});
        expect(res.statusCode).toBe(201);
        expect(res.body).toHaveProperty('token');
    });

    it('POST /api/auth/login should login and return token', async () => {
        await request(app).post('/api/auth/register').send({ name: 'Test', email: 'test@t.com', password: 'Password1!'});
        const res = await request(app)
            .post('/api/auth/login')
            .send({ email: 'test@t.com', password: 'Password1!'});
        expect(res.statusCode).toBe(200);
        expect(res.body).toHaveProperty('token');
    });
});