import { z } from 'zod';

export const userSchema = z.object({
  email: z.string().email(),
  name: z.string().min(2),
  password: z.string().min(8),
  role: z.enum(['admin', 'user', 'viewer']).default('user'),
});

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string(),
});

export const proposalSchema = z.object({
  title: z.string().min(1),
  clientName: z.string().min(1),
  dueDate: z.coerce.date(),
  value: z.number().optional(),
});