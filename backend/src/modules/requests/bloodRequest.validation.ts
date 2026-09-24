import { z } from 'zod';

export const createBloodRequestSchema = z.object({
  bloodGroup: z.enum(['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-']),
  unitsRequired: z.number().int().min(1).max(50),
  hospitalName: z.string().min(2),
  hospitalLocation: z.object({
    address: z.string().min(2),
    provinceId: z.string().optional(),
    districtId: z.string().optional(),
    cityId: z.string().optional(),
    coordinates: z.tuple([z.number(), z.number()]).optional(),
  }),
  requiredDate: z.string().refine((date) => new Date(date) > new Date(), { message: 'Date must be in the future' }),
  urgency: z.enum(['NORMAL', 'URGENT', 'EMERGENCY']),
  contactPerson: z.object({
    name: z.string().min(2),
    phone: z.string().min(7),
  }),
  additionalInfo: z.string().optional(),
  evidenceAssetId: z.string().optional(),
});

export const updateBloodRequestSchema = createBloodRequestSchema.partial();
