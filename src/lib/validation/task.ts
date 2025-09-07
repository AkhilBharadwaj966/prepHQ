import { z } from 'zod'

export const TaskCreateSchema = z.object({
  folderId: z.string(),
  title: z.string().min(1),
  kind: z.enum(['custom', 'sr_note', 'sr_card']),
  linkId: z.string().optional(),
  due: z.string().datetime().optional(),
  nextDue: z.string().datetime().optional(),
  intervalIndex: z.number().int().nullable().optional(),
})

export const TaskUpdateSchema = z.object({
  title: z.string().min(1).optional(),
  kind: z.enum(['custom', 'sr_note', 'sr_card']).optional(),
  linkId: z.string().nullable().optional(),
  due: z.string().datetime().nullable().optional(),
  nextDue: z.string().datetime().nullable().optional(),
  intervalIndex: z.number().int().nullable().optional(),
})

export type TaskCreateInput = z.infer<typeof TaskCreateSchema>
export type TaskUpdateInput = z.infer<typeof TaskUpdateSchema>

