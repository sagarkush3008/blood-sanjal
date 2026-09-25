import request from 'supertest';
import mongoose from 'mongoose';
import app from '../src/app';

describe('App Core functionality', () => {
  it('should return 200 OK for /health', async () => {
    const res = await request(app).get('/health');
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.status).toBe('UP');
  });

  it('should return 200 OK for /ready when DB is connected', async () => {
    const originalReadyState = mongoose.connection.readyState;
    // Mock readyState to 1 (connected)
    Object.defineProperty(mongoose.connection, 'readyState', { get: () => 1, configurable: true });
    
    const res = await request(app).get('/ready');
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.status).toBe('READY');

    // Restore
    Object.defineProperty(mongoose.connection, 'readyState', { get: () => originalReadyState, configurable: true });
  });

  it('should return 503 for /ready when DB is disconnected', async () => {
    const originalReadyState = mongoose.connection.readyState;
    // Mock readyState to 0 (disconnected)
    Object.defineProperty(mongoose.connection, 'readyState', { get: () => 0, configurable: true });
    
    const res = await request(app).get('/ready');
    expect(res.status).toBe(503);
    expect(res.body.success).toBe(false);

    // Restore
    Object.defineProperty(mongoose.connection, 'readyState', { get: () => originalReadyState, configurable: true });
  });

  it('should return 404 structured error for unknown routes', async () => {
    const res = await request(app).get('/unknown-route-123');
    expect(res.status).toBe(404);
    expect(res.body.success).toBe(false);
    expect(res.body.error.code).toBe('NOT_FOUND');
  });
  
  it('should have x-request-id header', async () => {
    const res = await request(app).get('/health');
    expect(res.headers['x-request-id']).toBeDefined();
    expect(res.body.meta.requestId).toBeDefined();
  });
});
