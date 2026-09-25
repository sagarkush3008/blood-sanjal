import { SystemConfig } from './systemConfig.model';
import { AppError } from '../../core/errors/appError';
import { z } from 'zod';
import { AuditService } from '../audit/audit.service';

export const SettingsSchema = z.object({
  reminderPolicy: z.object({
    donationIntervalDays: z.number().min(30).max(180),
    maxRemindersPerMonth: z.number().min(1).max(10)
  }).optional(),
  platformFee: z.object({
    amountMinor: z.number().min(0),
    currency: z.string().default('NPR')
  }).optional(),
  notificationDefaults: z.object({
    emailEnabled: z.boolean(),
    smsEnabled: z.boolean(),
    pushEnabled: z.boolean()
  }).optional(),
  supportedBloodGroups: z.array(z.string()).min(1).optional(),
  requestExpiryHours: z.number().min(1).max(720).optional(),
  contactRequestExpiryHours: z.number().min(1).max(168).optional(),
  systemToggles: z.object({
    maintenanceMode: z.boolean(),
    allowNewRegistrations: z.boolean()
  }).optional()
});

export type ISettings = z.infer<typeof SettingsSchema>;

export class SettingsService {
  static async getSettings() {
    const configs = await SystemConfig.find();
    const settings: any = {};
    for (const conf of configs) {
      settings[conf.key] = conf.value;
    }
    return settings;
  }

  static async updateSettings(updates: Partial<ISettings>, adminId: string, req?: any) {
    const currentSettings = await this.getSettings();
    const merged = { ...currentSettings, ...updates };

    const parsed = SettingsSchema.safeParse(merged);
    if (!parsed.success) {
      throw new AppError(400, 'BAD_REQUEST', `Invalid settings configuration: ${parsed.error.message}`);
    }

    for (const [key, value] of Object.entries(parsed.data)) {
      if (value !== undefined) {
        await SystemConfig.findOneAndUpdate(
          { key },
          { value },
          { upsert: true }
        );
      }
    }

    await AuditService.logAction(adminId, 'UPDATE_SYSTEM_SETTINGS', 'SYSTEM_CONFIG', 'GLOBAL', req);
    return parsed.data;
  }
}
