import { z } from 'zod';

export const positionSchema = z.enum(['POR', 'DEF', 'MED', 'DEL']);

export const playerSchema = z.object({
  id: z.string(),
  name: z.string().min(2, "El nombre debe tener al menos 2 caracteres").max(50, "El nombre es demasiado largo"),
  number: z.coerce.number().int().min(1, "Mínimo 1").max(999, "Máximo 999"),
  skill: z.coerce.number().int().min(1, "Mínimo 1").max(10, "Máximo 10"),
  speed: z.coerce.number().int().min(1, "Mínimo 1").max(10, "Máximo 10"),
  primaryPos: positionSchema,
  secondaryPos: positionSchema,
});

export const matchSchema = z.object({
  id: z.string(),
  date: z.string().datetime(),
  location: z.string().min(1, "Ubicación requerida"),
  season: z.string().optional(),
  matchday: z.number().int().optional(),
  status: z.enum(['scheduled', 'completed']),
  result: z.object({
    teamAGoals: z.number().int().min(0, "Mínimo 0"),
    teamBGoals: z.number().int().min(0, "Mínimo 0"),
  }).optional(),
});
