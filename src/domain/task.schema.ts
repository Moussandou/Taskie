import { z } from 'zod';

export const TaskSchema = z.object({
  id: z.string().optional(),
  titre: z.string().describe('Titre court et clair de la tâche'),
  duree_estimee: z
    .number()
    .int()
    .positive()
    .describe('Durée estimée en minutes'),
  importance: z
    .number()
    .int()
    .min(1)
    .max(5)
    .describe('Importance de 1 (faible) à 5 (critique)'),
  deadline: z
    .string()
    .nullable()
    .describe('Heure limite au format HH:mm, ou null si non spécifié'),
  contexte: z
    .enum(['phone', 'pc', 'home', 'outside', 'any'])
    .describe('Contexte requis pour effectuer la tâche'),
  energie: z
    .enum(['low', 'medium', 'high'])
    .describe("Niveau d'énergie mentale ou physique requis"),
  flexibilite: z
    .enum(['fixed', 'flexible'])
    .describe(
      'fixed si la tâche doit se faire à une heure précise (ex: RDV), sinon flexible'
    ),
});

export const ParseResultSchema = z.object({
  tasks: z.array(TaskSchema),
  questions: z
    .array(z.string())
    .optional()
    .describe(
      "Questions pour clarifier les ambiguïtés s'il y en a, sinon tableau vide"
    ),
});

export type Task = z.infer<typeof TaskSchema>;
export type ParseResult = z.infer<typeof ParseResultSchema>;
