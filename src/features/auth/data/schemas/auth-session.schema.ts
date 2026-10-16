import { z } from 'zod';

export const collectorSchema = z.object({
  id: z.uuid(),
  username: z.string().min(2),
  email: z.email(),
});

export const authSessionSchema = z.object({
  user: collectorSchema,
  expiresAt: z.iso.datetime(),
});
