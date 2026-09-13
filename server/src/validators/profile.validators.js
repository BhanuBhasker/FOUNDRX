import { z } from 'zod';

export const upsertProfileSchema = z.object({
  headline: z.string().trim().max(160).optional().nullable(),
  bio: z.string().trim().max(2000).optional().nullable(),
  primaryRole: z.enum(['developer', 'designer', 'business', 'marketing', 'product', 'other']).default('other'),
  experienceLevel: z.enum(['beginner', 'intermediate', 'advanced', 'expert']).default('beginner'),
  availabilityHours: z.enum(['full_time', 'part_time', 'weekends', 'not_available']).default('not_available'),
  startupGoal: z.enum(['find_cofounder', 'join_startup', 'build_projects', 'explore_ideas']).default('explore_ideas'),
  profileVisibility: z.enum(['public', 'private']).default('public'),
  location: z.string().trim().max(120).optional().nullable(),
  linkedinUrl: z.string().trim().url().optional().nullable().or(z.literal('')),
  githubUrl: z.string().trim().url().optional().nullable().or(z.literal('')),
  skillIds: z.array(z.coerce.number().int().positive()).default([]),
  interestIds: z.array(z.coerce.number().int().positive()).default([]),
});
