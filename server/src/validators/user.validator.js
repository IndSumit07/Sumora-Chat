import { z } from 'zod';

export const updateProfileSchema = z.object({
  fullName: z
    .string()
    .min(2, 'Full name must be at least 2 characters')
    .max(50, 'Full name cannot exceed 50 characters')
    .trim()
    .optional(),
  bio: z.string().max(200, 'Bio cannot exceed 200 characters').optional(),
  phoneNumber: z
    .string()
    .regex(/^\+?[1-9]\d{7,14}$/, 'Invalid phone number')
    .optional()
    .nullable(),
  notificationPreferences: z
    .object({
      messages: z.boolean().optional(),
      friendRequests: z.boolean().optional(),
      groups: z.boolean().optional(),
    })
    .optional(),
});

export const searchUsersSchema = z.object({
  query: z.string().min(1, 'Search query is required').max(50),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(50).default(20),
});

export const userIdParamSchema = z.object({
  userId: z.string().regex(/^[a-f\d]{24}$/i, 'Invalid user ID'),
});

export const onlineStatusQuerySchema = z.object({
  userIds: z
    .string()
    .transform((val) => val.split(',').filter(Boolean))
    .refine((arr) => arr.length <= 100, 'Too many userIds (max 100)'),
});

export const pushSubscriptionSchema = z.object({
  subscription: z.object({
    endpoint: z.string().url(),
    keys: z.object({
      p256dh: z.string(),
      auth: z.string(),
    }),
  }),
});
