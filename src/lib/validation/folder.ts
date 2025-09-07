import { z } from 'zod'

export const FolderCreateSchema = z.object({
  name: z.string().min(1),
  parentId: z.string().optional(),
  color: z.string().optional(),
})

export const FolderUpdateSchema = z.object({
  name: z.string().min(1).optional(),
  color: z.string().optional(),
  parentId: z.string().nullable().optional(),
})

export type FolderCreateInput = z.infer<typeof FolderCreateSchema>
export type FolderUpdateInput = z.infer<typeof FolderUpdateSchema>

