import { z } from 'zod';

export const createBloodRequestSchema = z.object({
  patientName: z.string().min(2).optional(),
  bloodGroup: z.enum(['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-']),
  unitsRequired: z.coerce.number().int().min(1).max(50).default(1),
  hospitalName: z.string().min(2),
  hospitalLocation: z.object({
    address: z.string().optional(),
    wardRoom: z.string().optional(),
    provinceId: z.string().optional(),
    districtId: z.string().optional(),
    cityId: z.string().optional(),
    cityName: z.string().optional(),
    coordinates: z.tuple([z.number(), z.number()]).optional(),
  }).optional(),
  requiredDate: z.string().optional(),
  urgency: z.enum(['NORMAL', 'URGENT', 'EMERGENCY']).default('NORMAL'),
  urgencyWindow: z.string().optional(),
  contactPerson: z.object({
    name: z.string().optional(),
    phone: z.string().optional(),
  }).optional(),
  contactPhone: z.string().optional(),
  additionalInfo: z.string().optional(),
  reason: z.string().optional(),
  evidenceAssetId: z.string().optional(),
  paymentReference: z.string().optional(),
  paymentProvider: z.string().optional(),
  platformFeeNpr: z.coerce.number().optional(),
});

export const updateBloodRequestSchema = createBloodRequestSchema.partial();
