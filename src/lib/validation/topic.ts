import { z } from 'zod'

export const TopicCreateSchema = z.object({
  folderId: z.string(),
  title: z.string().min(1),
})

export const TopicUpdateSchema = z.object({
  title: z.string().min(1).optional(),
  done: z.boolean().optional(),
})

export type TopicCreateInput = z.infer<typeof TopicCreateSchema>
export type TopicUpdateInput = z.infer<typeof TopicUpdateSchema>

