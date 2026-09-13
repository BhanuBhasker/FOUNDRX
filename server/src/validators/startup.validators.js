import { z } from 'zod';

const requiredSkillSchema = z.object({
  skillId: z.coerce.number().int().positive(),
  priority: z.enum(['required', 'nice_to_have']).default('required'),
});

export const createStartupSchema = z.object({
  name: z.string().trim().min(2).max(140),
  tagline: z.string().trim().max(200).optional().nullable(),
  description: z.string().trim().max(4000).optional().nullable(),
  category: z.string().trim().max(80).default('general'),
  stage: z.enum(['idea', 'validating', 'building', 'active', 'paused']).default('idea'),
  maxTeamSize: z.coerce.number().int().min(1).max(50).default(5),
  requiredSkills: z.array(requiredSkillSchema).default([]),
});

export const updateStartupSchema = createStartupSchema.extend({
  status: z.enum(['active', 'paused', 'closed']).default('active'),
});

export const projectSchema = z.object({
  startupId: z.coerce.number().int().positive().optional(),
  title: z.string().trim().min(2).max(140),
  description: z.string().trim().max(2000).optional().nullable(),
  status: z.enum(['planning', 'in_progress', 'on_hold', 'completed']).default('planning'),
});

export const milestoneSchema = z.object({
  projectId: z.coerce.number().int().positive().optional(),
  title: z.string().trim().min(2).max(160),
  description: z.string().trim().max(2000).optional().nullable(),
  dueDate: z.string().trim().optional().nullable(),
  status: z.enum(['not_started', 'in_progress', 'completed']).default('not_started'),
});

export const addMemberSchema = z.object({
  userId: z.coerce.number().int().positive(),
  teamRole: z.string().trim().max(80).default('Member'),
});

export const updateMemberRoleSchema = z.object({
  teamRole: z.string().trim().min(1).max(80),
});
