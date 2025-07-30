import 'dotenv/config';
import { AppDataSource } from '../src/database/connection';

// Setup before all tests
beforeAll(async () => {
  console.log('🚀 Starting test setup...');
  
  // Set test environment
  process.env.NODE_ENV = 'test';
  console.log('✅ Test environment set');
  
  // Mock JWT secret for tests
  process.env.JWT_SECRET = 'test-jwt-secret';
  console.log('✅ JWT secret mocked');
  
  // Mock database URLs for tests
  process.env.MONGODB_URI = 'mongodb://localhost:27017/test';
  process.env.REDIS_URL = 'redis://localhost:6379';
  console.log('✅ Database URLs mocked');
  
  await AppDataSource.initialize();
  console.log('✅ AppDataSource initialized');
  
  console.log('🎉 Test setup completed successfully!');
}, 10000); // 10 second timeout for the entire beforeAll

// Cleanup after all tests
afterAll(async () => {
  console.log('🧹 Starting test cleanup...');
  await AppDataSource.destroy();
  console.log('✅ AppDataSource destroyed');
  console.log('🎉 Test cleanup completed!');
}, 5000); // 5 second timeout for cleanup

// Clear mocks between tests
afterEach(async () => {
  jest.clearAllMocks();
});