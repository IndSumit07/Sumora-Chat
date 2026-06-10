import { z } from 'zod';
import { MESSAGE_TYPES } from '../utils/constants.js';

export const sendMessageSchema = z.object({
  content: z.string().max(10000, 'Message too long').optional(),
  type: z.enum(Object.values(MESSAGE_TYPES)).default(MESSAGE_TYPES.TEXT),
  replyTo: z.string().regex(/^[a-f\d]{24}$/i, 'Invalid message ID').optional(),
  // fileUrl, fileName, etc. come from the upload middleware, not body validation
});

export const editMessageSchema = z.object({
  content: z
    .string()
    .min(1, 'Message content cannot be empty')
    .max(10000, 'Message too long'),
});

export const deleteMessageSchema = z.object({
  deleteFor: z.enum(['me', 'everyone']),
});

export const reactToMessageSchema = z.object({
  emoji: z.string().min(1, 'Emoji is required').max(10, 'Invalid emoji'),
});

export const messageIdParamSchema = z.object({
  messageId: z.string().regex(/^[a-f\d]{24}$/i, 'Invalid message ID'),
});

export const conversationIdParamSchema = z.object({
  conversationId: z.string().regex(/^[a-f\d]{24}$/i, 'Invalid conversation ID'),
});

export const messagesQuerySchema = z.object({
  cursor: z.string().optional(),
  limit: z.coerce.number().int().min(1).max(50).default(30),
});
