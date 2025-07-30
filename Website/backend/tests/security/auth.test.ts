import request from 'supertest';
import app from '../../src/app';
import { userFixtures } from '../fixtures/user.fixtures';

describe('Authentication Security Tests', () => {
  test('should prevent brute force attacks with rate limiting', async () => {
    // Make multiple failed login attempts
    const attempts = 20;
    const responses = [];
    
    for (let i = 0; i < attempts; i++) {
      const response = await request(app)
        .post('/api/auth/login')
        .send(userFixtures.invalidLoginCredentials);
      
      responses.push(response);
    }
    
    // Expect some of the later requests to be rate limited (429 Too Many Requests)
    const rateLimitedResponses = responses.filter(r => r.status === 429);
    expect(rateLimitedResponses.length).toBeGreaterThan(0);
  });
  
  test('should reject invalid JWT tokens', async () => {
    const response = await request(app)
      .get('/api/protected')
      .set('Authorization', 'Bearer invalid-token');
    
    expect(response.status).toBe(401);
  });
  
  test('should reject requests without authentication', async () => {
    const response = await request(app).get('/api/protected');
    
    expect(response.status).toBe(401);
  });
  
  test('should validate password strength during registration', async () => {
    const weakPasswordUser = {
      ...userFixtures.validUser,
      password: 'weak'
    };
    
    const response = await request(app)
      .post('/api/auth/register')
      .send(weakPasswordUser);
    
    expect(response.status).toBe(400);
    expect(response.body.error).toBeDefined();
  });
  
  test('should prevent SQL injection in query parameters', async () => {
    const response = await request(app)
      .get('/api/food/search?q=apple\'%20OR%201=1--');
    
    // Should not return all foods (which would happen with SQL injection)
    expect(response.status).toBe(200);
    expect(response.body.results.foods.length).toBe(0);
  });
});