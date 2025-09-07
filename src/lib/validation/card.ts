import { z } from 'zod'

export const CardCreateSchema = z.object({
  noteId: z.string(),
  front: z.string().min(1),
  back: z.string().min(1),
})

export const CardUpdateSchema = z.object({
  front: z.string().min(1).optional(),
  back: z.string().min(1).optional(),
  noteId: z.string().optional(),
})

export const CardReviewSchema = z.object({
  result: z.enum(['good', 'again'])
})

export type CardCreateInput = z.infer<typeof CardCreateSchema>
export type CardUpdateInput = z.infer<typeof CardUpdateSchema>
export type CardReviewInput = z.infer<typeof CardReviewSchema>
