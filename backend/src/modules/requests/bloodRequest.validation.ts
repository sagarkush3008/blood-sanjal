import { z } from 'zod';

export const createBloodRequestSchema = z.object({
  patientName: z.string().min(2).optional(),
  bloodGroup: z.enum(['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-']),
  unitsRequired: z.coerce.number().int().min(1).max(50),
  hospitalName: z.string().min(2),
  hospitalLocation: z.object({
    address: z.string().min(2),
    provinceId: z.string().optional(),
    districtId: z.string().optional(),
    cityId: z.string().optional(),
    coordinates: z.tuple([z.number(), z.number()]).optional(),
  }).optional(),
  requiredDate: z.string().refine((date) => new Date(date) > new Date(), { message: 'Date must be in the future' }).optional(),
  urgency: z.enum(['NORMAL', 'URGENT', 'EMERGENCY']).default('NORMAL'),
  contactPerson: z.object({
    name: z.string().min(2),
    phone: z.string().min(7),
  }).optional(),
  contactPhone: z.string().min(7).optional(),
  additionalInfo: z.string().optional(),
  evidenceAssetId: z.string().optional(),
});

export const updateBloodRequestSchema = createBloodRequestSchema.partial();
