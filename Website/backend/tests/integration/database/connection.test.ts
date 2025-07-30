import { connectDatabase, closeConnections, healthCheck, AppDataSource, __setHealthFlags } from '../../../src/database/connection';

// Mock TypeORM's DataSource
jest.mock('typeorm', () => {
  const originalModule = jest.requireActual('typeorm');
  return {
    ...originalModule,
    DataSource: jest.fn().mockImplementation(() => ({
      initialize: jest.fn().mockResolvedValue(true),
      destroy: jest.fn().mockResolvedValue(true),
      isInitialized: true,
      query: jest.fn().mockResolvedValue([{ '1': 1 }])
    }))
  };
});

// Mock Redis client
jest.mock('redis', () => {
  return {
    createClient: jest.fn().mockImplementation(() => ({
      connect: jest.fn().mockResolvedValue(true),
      quit: jest.fn().mockResolvedValue(true),
      on: jest.fn(),
      isOpen: true,
      ping: jest.fn().mockResolvedValue('PONG')
    }))
  };
});

describe('Database Connection', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });
  
  test('should connect to database successfully', async () => {
    await connectDatabase();
    
    // Expect DataSource to be initialized
    expect(AppDataSource.initialize).toHaveBeenCalled();
  });
  
  test('should close connections successfully', async () => {
    await closeConnections();
    
    // Expect DataSource to be destroyed
    expect(AppDataSource.destroy).toHaveBeenCalled();
  });
  
  test('should perform health check successfully', async () => {
    __setHealthFlags(true, true);
    const result = await healthCheck();
    
    // Expect health check to pass
    expect(result).toBe(true);
    expect(AppDataSource.query).toHaveBeenCalledWith('SELECT 1');
  });
});