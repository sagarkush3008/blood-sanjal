import { EmailService, createTransport } from '../src/modules/email/email.service';
import { EmailEvent } from '../src/modules/email/emailEvent.model';
import { User } from '../src/modules/users/user.model';
import { templates } from '../src/modules/email/email.templates';
import nodemailer from 'nodemailer';
import { logger } from '../src/config/logger.config';
import { env } from '../src/config/env.config';

jest.mock('../src/modules/email/emailEvent.model');
jest.mock('../src/modules/users/user.model');
jest.mock('../src/config/logger.config', () => ({
  logger: {
    info: jest.fn(),
    error: jest.fn()
  }
}));

import { emailQueue } from '../src/core/jobs';

export const mockSendMail = jest.fn().mockResolvedValue({ messageId: 'mock-message-id' });
jest.mock('nodemailer', () => ({
  createTransport: jest.fn(() => ({
    sendMail: (...args: any[]) => mockSendMail(...args)
  }))
}));

jest.mock('../src/core/jobs', () => ({
  emailQueue: {
    add: jest.fn().mockImplementation(async (name, data) => {
      // Simulate the worker processing the job immediately
      await EmailService.processEmail(data.eventId, data.text, data.html);
      return { id: 'mock-job-id' };
    })
  }
}));

describe('Email API', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockSendMail.mockResolvedValue({ messageId: 'mock-message-id' });
  });

  describe('enqueueEmail', () => {
    it('should enqueue and send email', async () => {
      (User.findOne as jest.Mock).mockResolvedValue(null);
      
      const mockEvent: any = {
        _id: 'event123',
        status: 'PENDING',
        save: jest.fn().mockResolvedValue(true)
      };
      (EmailEvent.create as jest.Mock).mockResolvedValue(mockEvent);
      (EmailEvent.findById as jest.Mock).mockResolvedValue(mockEvent);

      await EmailService.enqueueEmail('test@example.com', 'welcome', { name: 'Test', token: 'token123' }, 'dedupe-1');

      expect(EmailEvent.create).toHaveBeenCalledWith(expect.objectContaining({
        to: 'test@example.com',
        status: 'PENDING',
        dedupeKey: 'dedupe-1'
      }));

      // wait for async process
      await new Promise(process.nextTick);

      expect(mockSendMail).toHaveBeenCalled();
      expect(mockEvent.status).toBe('SENT');
      expect(mockEvent.providerMessageId).toBe('mock-message-id');
      expect(mockEvent.save).toHaveBeenCalled();
    });

    it('should handle disabled user gracefully', async () => {
      (User.findOne as jest.Mock).mockResolvedValue({ status: 'SUSPENDED' });
      const mockEvent: any = { _id: 'event123', status: 'DISABLED', save: jest.fn() };
      (EmailEvent.create as jest.Mock).mockResolvedValue(mockEvent);

      await EmailService.enqueueEmail('test@example.com', 'welcome', { name: 'Test' }, 'dedupe-2');

      expect(EmailEvent.create).toHaveBeenCalledWith(expect.objectContaining({ status: 'DISABLED' }));
      expect(mockSendMail).not.toHaveBeenCalled();
    });

    it('should respect opt-out preference', async () => {
      (User.findOne as jest.Mock).mockResolvedValue({ 
        status: 'ACTIVE', 
        privacySettings: { emergencyNotifications: false } 
      });
      const mockEvent: any = { _id: 'event123', status: 'OPT_OUT', save: jest.fn() };
      (EmailEvent.create as jest.Mock).mockResolvedValue(mockEvent);

      await EmailService.enqueueEmail('test@example.com', 'bloodRequestAlert', { patientName: 'P', bloodGroup: 'A+' }, 'dedupe-3');

      expect(EmailEvent.create).toHaveBeenCalledWith(expect.objectContaining({ status: 'OPT_OUT' }));
      expect(mockSendMail).not.toHaveBeenCalled();
    });

    it('should not resend on duplicate dedupeKey', async () => {
      (User.findOne as jest.Mock).mockResolvedValue(null);
      (EmailEvent.create as jest.Mock).mockRejectedValue({ code: 11000 }); // Mongo duplicate error
      (EmailEvent.findOne as jest.Mock).mockResolvedValue({ _id: 'event123', status: 'SENT' });

      const result = await EmailService.enqueueEmail('test@example.com', 'welcome', { name: 'T' }, 'dedupe-existing');

      expect(result).toBeDefined();
      // Since it rejects in create, it does not call processEmail again
      expect(mockSendMail).not.toHaveBeenCalled();
    });

    it('should handle connection failure and mark as FAILED', async () => {
      (User.findOne as jest.Mock).mockResolvedValue(null);
      const mockEvent: any = { _id: 'event123', status: 'PENDING', retryCount: 0, save: jest.fn() };
      (EmailEvent.create as jest.Mock).mockResolvedValue(mockEvent);
      (EmailEvent.findById as jest.Mock).mockResolvedValue(mockEvent);
      
      mockSendMail.mockRejectedValue(new Error('SMTP Connection timeout'));

      await EmailService.enqueueEmail('test@example.com', 'welcome', { name: 'T' }, 'dedupe-fail');

      await new Promise(process.nextTick); // wait for async

      expect(mockEvent.status).toBe('FAILED');
      expect(mockEvent.error).toBe('SMTP Connection timeout');
      expect(mockEvent.retryCount).toBe(1);
      expect(mockEvent.save).toHaveBeenCalled();
    });

    it('should not leak passwords or tokens in logs', async () => {
      (User.findOne as jest.Mock).mockResolvedValue(null);
      const mockEvent = { _id: 'event123', status: 'PENDING', to: 'test@test.com', save: jest.fn() };
      (EmailEvent.create as jest.Mock).mockResolvedValue(mockEvent);
      (EmailEvent.findById as jest.Mock).mockResolvedValue(mockEvent);

      await EmailService.enqueueEmail('test@test.com', 'otp', { name: 'T', otp: 'SUPER_SECRET_OTP' }, 'dedupe-sec');

      await new Promise(process.nextTick);

      // Check the args to logger to ensure SUPER_SECRET_OTP is not there
      const logArgs = (logger.info as jest.Mock).mock.calls[0][0];
      expect(logArgs).not.toContain('SUPER_SECRET_OTP');
    });

    it('templates should use FRONTEND_BASE_URL', () => {
      const template = templates.passwordReset({ name: 'Test', token: 'ABC' });
      expect(template.html).toContain(env.FRONTEND_BASE_URL);
    });
  });
});
