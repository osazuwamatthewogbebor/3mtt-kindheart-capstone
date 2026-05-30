import { z } from 'zod';

export const contactSchema = z.object({
  name: z.string().trim().min(2, 'Name must be at least 2 characters'),
  email: z.string().trim().email('A valid email is required'),
  subject: z.string().trim().min(5, 'Subject must be at least 5 characters'),
  message: z.string().trim().min(10, 'Message must be at least 10 characters'),
});
