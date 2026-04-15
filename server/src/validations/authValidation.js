import { z } from 'zod';

export const registerSchema = z.object({
  name: z.string().trim().min(2, 'name must be at least 2 characters').max(120),
  email: z.string().trim().email('A valid email is required'),
  password: z
    .string()
    .min(6, 'password must be at least 6 characters')
    .max(72, 'password must be less than or equal to 72 characters'),
});

export const loginSchema = z.object({
  email: z.string().trim().email('A valid email is required'),
  password: z.string().min(1, 'password is required'),
});

export const forgotPasswordSchema = z.object({
  email: z.string().trim().email('A valid email is required'),
});

export const refreshTokenSchema = z.object({
  refreshToken: z.string().min(1, 'refreshToken is required'),
});

export const resetPasswordSchema = z.object({
  password: z
    .string()
    .min(6, 'password must be at least 6 characters')
    .max(72, 'password must be less than or equal to 72 characters'),
});
