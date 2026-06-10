import { z } from 'zod';
import { MEMBER_ROLES } from '../utils/constants.js';

export const createGroupSchema = z.object({
  name: z
    .string()
    .min(2, 'Group name must be at least 2 characters')
    .max(100, 'Group name cannot exceed 100 characters')
    .trim(),
  description: z.string().max(500, 'Description cannot exceed 500 characters').optional().default(''),
  memberIds: z
    .array(z.string().regex(/^[a-f\d]{24}$/i, 'Invalid user ID'))
    .min(1, 'At least one member is required')
    .max(256, 'Cannot add more than 256 members at once'),
});

export const updateGroupSchema = z.object({
  name: z
    .string()
    .min(2)
    .max(100)
    .trim()
    .optional(),
  description: z.string().max(500).optional(),
});

export const addMemberSchema = z.object({
  userId: z.string().regex(/^[a-f\d]{24}$/i, 'Invalid user ID'),
});

export const updateMemberRoleSchema = z.object({
  role: z.enum([MEMBER_ROLES.CO_ADMIN, MEMBER_ROLES.MEMBER]),
});

export const sendGroupMessageSchema = z.object({
  content: z.string().max(10000).optional(),
  type: z.string().optional(),
  replyTo: z.string().regex(/^[a-f\d]{24}$/i).optional(),
});

export const updateGroupSettingsSchema = z.object({
  isPublic: z.boolean().optional(),
  allowMembersToAddOthers: z.boolean().optional(),
  allowMembersToEditInfo: z.boolean().optional(),
  onlyAdminsCanMessage: z.boolean().optional(),
});
