import { Express } from 'express';
import request from 'supertest';
import jwt from 'jsonwebtoken';
import { JwtPayload } from '../../src/auth/types';

// Generate a valid JWT token for testing
export function generateTestToken(payload: Partial<JwtPayload> = {}): string {
  const defaultPayload: JwtPayload = {
    sub: '12345',
    email: 'test@example.com',
    role: 'user',
    sessionId: 'test-session-id',
    ...payload
  };
  
  return jwt.sign(defaultPayload, process.env.JWT_SECRET || 'test-secret', {
    expiresIn: '1h',
    issuer: 'test-issuer',
    audience: 'test-audience'
  });
}

// Helper to make authenticated requests
export function authRequest(app: Express) {
  const token = generateTestToken();
  
  return {
    get: (url: string) => request(app).get(url).set('Authorization', `Bearer ${token}`),
    post: (url: string, body?: any) => request(app).post(url).set('Authorization', `Bearer ${token}`).send(body),
    put: (url: string, body?: any) => request(app).put(url).set('Authorization', `Bearer ${token}`).send(body),
    delete: (url: string) => request(app).delete(url).set('Authorization', `Bearer ${token}`),
    patch: (url: string, body?: any) => request(app).patch(url).set('Authorization', `Bearer ${token}`).send(body)
  };
}

// Mock Redis client for testing
export class MockRedisClient {
  private store: Map<string, any> = new Map();
  
  async set(key: string, value: any, options?: any): Promise<void> {
    this.store.set(key, value);
  }
  
  async get(key: string): Promise<any> {
    return this.store.get(key) || null;
  }
  
  async del(key: string | string[]): Promise<void> {
    if (Array.isArray(key)) {
      key.forEach(k => this.store.delete(k));
    } else {
      this.store.delete(key);
    }
  }
  
  async flushAll(): Promise<void> {
    this.store.clear();
  }
  
  async hSet(key: string, field: string, value: any): Promise<void> {
    const hashMap = this.store.get(key) || new Map();
    hashMap.set(field, value);
    this.store.set(key, hashMap);
  }
  
  async hGet(key: string, field: string): Promise<any> {
    const hashMap = this.store.get(key);
    return hashMap ? hashMap.get(field) : null;
  }
  
  async hGetAll(key: string): Promise<Record<string, any>> {
    const hashMap = this.store.get(key);
    if (!hashMap) return {};
    
    const result: Record<string, any> = {};
    hashMap.forEach((value: any, field: string) => {
      result[field] = value;
    });
    
    return result;
  }
  
  async keys(pattern: string): Promise<string[]> {
    // Simple pattern matching for testing
    const regex = new RegExp(pattern.replace('*', '.*'));
    return Array.from(this.store.keys()).filter(key => regex.test(key));
  }
  
  async ping(): Promise<string> {
    return 'PONG';
  }
}