import request from 'supertest';
import mongoose from 'mongoose';
import app from '../../../src/app';
import { Food } from '../../../src/database/models/Food';
import { foodFixtures } from '../../fixtures/food.fixtures';
import { authRequest } from '../../utils/test-utils';
import { redisClient } from '../../../src/database/connection';

// Mock Redis client
jest.mock('../../../src/database/connection', () => ({
  redisClient: {
    set: jest.fn().mockResolvedValue(true),
    get: jest.fn().mockResolvedValue(null),
    del: jest.fn().mockResolvedValue(true),
    keys: jest.fn().mockResolvedValue([]),
    isOpen: true
  }
}));

describe('Food Search API', () => {
  beforeAll(async () => {
    // Connect to test database
    await mongoose.connect(process.env.MONGODB_URI as string);
  });
  
  afterAll(async () => {
    // Disconnect from test database
    await mongoose.disconnect();
  });
  
  beforeEach(async () => {
    // Clear database before each test
    await Food.deleteMany({});
    
    // Reset mock implementations
    jest.clearAllMocks();
    (redisClient.get as jest.Mock).mockResolvedValue(null);
  });
  
  describe('GET /api/food/search', () => {
    test('should return 400 if search query is missing', async () => {
      const response = await request(app).get('/api/food/search');
      
      expect(response.status).toBe(400);
      expect(response.body.error).toBeDefined();
    });
    
    test('should return empty results if no foods match query', async () => {
      const response = await request(app).get('/api/food/search?q=nonexistent');
      
      expect(response.status).toBe(200);
      expect(response.body.results.foods).toHaveLength(0);
      expect(response.body.pagination.total).toBe(0);
    });
    
    test('should return matching foods when query matches', async () => {
      // Insert test foods
      await Food.insertMany(foodFixtures.validFoods);
      
      const response = await request(app).get('/api/food/search?q=apple');
      
      expect(response.status).toBe(200);
      expect(response.body.results.foods).toHaveLength(1);
      expect(response.body.results.foods[0].name).toBe('Apple');
      expect(response.body.pagination.total).toBe(1);
    });
    
    test('should filter foods by category', async () => {
      // Insert test foods
      await Food.insertMany(foodFixtures.validFoods);
      
      const response = await request(app).get('/api/food/search?q=fruit&category=fresh');
      
      expect(response.status).toBe(200);
      expect(response.body.results.foods).toHaveLength(2);
      expect(response.body.pagination.total).toBe(2);
    });
    
    test('should respect pagination parameters', async () => {
      // Insert test foods
      await Food.insertMany(foodFixtures.validFoods);
      
      const response = await request(app).get('/api/food/search?q=fruit&limit=1&page=1');
      
      expect(response.status).toBe(200);
      expect(response.body.results.foods).toHaveLength(1);
      expect(response.body.pagination.total).toBe(2);
      expect(response.body.pagination.pages).toBe(2);
    });
    
    test('should use cache when available', async () => {
      // Mock cache hit
      const cachedResponse = {
        results: { foods: [foodFixtures.validFoods[0]] },
        pagination: { total: 1, page: 1, limit: 20, pages: 1 }
      };
      (redisClient.get as jest.Mock).mockResolvedValue(JSON.stringify(cachedResponse));
      
      const response = await request(app).get('/api/food/search?q=apple');
      
      expect(response.status).toBe(200);
      expect(response.body).toEqual(cachedResponse);
      expect(redisClient.get).toHaveBeenCalled();
      expect(redisClient.set).not.toHaveBeenCalled();
    });
  });
  
  describe('GET /api/food/:id', () => {
    test('should return 404 if food not found', async () => {
      const response = await request(app).get('/api/food/123456789012345678901234');
      
      expect(response.status).toBe(404);
      expect(response.body.error).toBe('Food not found');
    });
    
    test('should return food details when found', async () => {
      // Insert test food
      const food = await Food.create(foodFixtures.validFood);
      
      const response = await request(app).get(`/api/food/${food._id}`);
      
      expect(response.status).toBe(200);
      expect(response.body.name).toBe(foodFixtures.validFood.name);
      expect(response.body.brand).toBe(foodFixtures.validFood.brand);
    });
    
    test('should use cache when available', async () => {
      // Mock cache hit
      const cachedFood = { ...foodFixtures.validFood, _id: '123456789012345678901234' };
      (redisClient.get as jest.Mock).mockResolvedValue(JSON.stringify(cachedFood));
      
      const response = await request(app).get('/api/food/123456789012345678901234');
      
      expect(response.status).toBe(200);
      expect(response.body).toEqual(cachedFood);
      expect(redisClient.get).toHaveBeenCalled();
      expect(redisClient.set).not.toHaveBeenCalled();
    });
  });
});