import { z } from 'zod';

export const sendApplicationSchema = z.object({
  type: z.enum(['cofounder_request', 'startup_application', 'team_invitation']).default('cofounder_request'),
  receiverId: z.coerce.number().int().positive(),
  startupId: z.coerce.number().int().positive().optional().nullable(),
  message: z.string().trim().max(600).optional().nullable(),
});

export const updateApplicationStatusSchema = z.object({
  status: z.enum(['accepted', 'rejected', 'cancelled']),
});

export const reviewSchema = z.object({
  reviewedId: z.coerce.number().int().positive(),
  startupId: z.coerce.number().int().positive().optional().nullable(),
  rating: z.coerce.number().int().min(1).max(5),
  comment: z.string().trim().max(600).optional().nullable(),
});
