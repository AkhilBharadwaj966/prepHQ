import { z } from 'zod'

export const NoteCreateSchema = z.object({
  folderId: z.string(),
  title: z.string().min(1),
  content: z.string().default(''),
})

export const NoteUpdateSchema = z.object({
  title: z.string().min(1).optional(),
  content: z.string().optional(),
})

export const NoteReviewSchema = z.object({
  result: z.enum(['good', 'again'])
})

export type NoteCreateInput = z.infer<typeof NoteCreateSchema>
export type NoteUpdateInput = z.infer<typeof NoteUpdateSchema>
export type NoteReviewInput = z.infer<typeof NoteReviewSchema>
