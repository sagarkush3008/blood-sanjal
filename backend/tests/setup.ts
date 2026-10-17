import dotenv from 'dotenv';
dotenv.config();
import mongoose from 'mongoose';
mongoose.set('bufferCommands', false);

jest.mock('ioredis', () => {
  return {
    Redis: jest.fn().mockImplementation(() => {
      return {
        on: jest.fn(),
        set: jest.fn(),
        get: jest.fn(),
        quit: jest.fn(),
      };
    }),
  };
});

jest.mock('bullmq', () => ({
  Queue: jest.fn().mockImplementation(() => ({
    add: jest.fn().mockResolvedValue({ id: 'mock-job-id' }),
    on: jest.fn(),
    close: jest.fn(),
  })),
  Worker: jest.fn().mockImplementation(() => ({
    on: jest.fn(),
    close: jest.fn(),
  })),
}));
