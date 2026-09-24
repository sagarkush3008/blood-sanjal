import { z } from 'zod';

export const updateProfileSchema = z.object({
  name: z.string().min(2).optional(),
  avatarAssetId: z.string().optional(),
  bloodGroup: z.string().optional(),
  provinceId: z.string().optional(),
  districtId: z.string().optional(),
  cityId: z.string().optional(),
  areaId: z.string().optional(),
  privacySettings: z.object({
    donorSearchVisibility: z.boolean().optional(),
    contactRevealPolicy: z.enum(['DIRECT', 'CONSENT_REQUIRED', 'HIDDEN']).optional(),
    emergencyNotifications: z.boolean().optional(),
    approximateLocationSharing: z.boolean().optional(),
  }).optional(),
});
