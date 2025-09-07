"use client"
import { useEffect, useMemo, useState } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import dayjs from 'dayjs'
import { scheduleFromResult } from '@/lib/sr'

type Props = {
  open: boolean
  onClose: () => void
  folderId?: string | null
  noteId?: string | null
  mode?: 'all' | 'pending'
}

export default function ReviewModal({ open, onClose, folderId, noteId, mode = 'pending' }: Props) {
  const qc = useQueryClient()
  const { data: cards, refetch, isLoading } = useQuery({
    queryKey: ['review-cards', folderId ?? null, noteId ?? null, mode],
    queryFn: async () => {
      if (!open) return []
      const qs = noteId ? `noteId=${noteId}` : folderId ? `folderId=${folderId}` : ''
      const res = await fetch(`/api/cards?${qs}`)
      const all = await res.json()
      const now = new Date()
      const list = (all || []).filter((c: any) => {
        if (mode === 'pending') return !c.nextDue || new Date(c.nextDue) <= now
        return true
      })
      // sort by nextDue asc, nulls first
      list.sort((a: any, b: any) => {
        const ad = a.nextDue ? new Date(a.nextDue).getTime() : 0
        const bd = b.nextDue ? new Date(b.nextDue).getTime() : 0
        return ad - bd
      })
      return list
    },
    enabled: open,
  })

  const [index, setIndex] = useState(0)
  const [showAnswer, setShowAnswer] = useState(false)

  useEffect(() => {
    if (open) {
      setIndex(0)
      setShowAnswer(false)
      // refetch list each time opened
      refetch()
    }
  }, [open, refetch])

  const card = cards?.[index]

  async function handleReview(result: 'good' | 'again') {
    if (!card) return
    await fetch(`/api/cards/${card.id}/review`, { method: 'POST', body: JSON.stringify({ result }) })
    // Invalidate caches
    qc.invalidateQueries({ queryKey: ['cards', folderId ?? undefined] })
    qc.invalidateQueries({ queryKey: ['review-cards', folderId ?? null, noteId ?? null] })
    // Advance to next
    if (index + 1 < (cards?.length || 0)) {
      setIndex(index + 1)
      setShowAnswer(false)
    } else {
      onClose()
    }
  }

  const nextTimes = useMemo(() => {
    if (!card) return null
    const good = scheduleFromResult(card.intervalIndex ?? 0, 'good')
    const again = scheduleFromResult(card.intervalIndex ?? 0, 'again')
    return {
      good: dayjs(good.nextDue).format('MMM D, YYYY'),
      again: dayjs(again.nextDue).format('MMM D, YYYY'),
    }
  }, [card])

  if (!open) return null

  return (
    <div className="fixed inset-0 z-30 flex items-center justify-center bg-black/40">
      <div className="w-full max-w-xl rounded bg-white p-6 shadow">
        <div className="mb-4 flex items-center justify-between">
          <div className="text-sm font-semibold">Revise</div>
          <button className="text-sm text-gray-500" onClick={onClose}>✕</button>
        </div>
        {isLoading ? (
          <div className="p-6 text-center text-sm text-gray-500">Loading…</div>
        ) : !card ? (
          <div className="p-6 text-center text-sm text-gray-500">No due cards to review.</div>
        ) : (
          <div className="space-y-4">
            <div className="rounded border bg-gray-50 p-4">
              <div className="text-sm text-gray-600">Question</div>
              <div className="mt-1 whitespace-pre-wrap text-base">{card.front}</div>
            </div>
            {showAnswer ? (
              <div className="rounded border bg-green-50 p-4">
                <div className="text-sm text-gray-600">Answer</div>
                <div className="mt-1 whitespace-pre-wrap text-base">{card.back}</div>
              </div>
            ) : null}
            <div className="flex items-center justify-between">
              {!showAnswer ? (
                <button className="rounded bg-indigo-600 px-4 py-2 text-white" onClick={() => setShowAnswer(true)}>Show answer</button>
              ) : (
                <div className="flex items-center gap-2">
                  <button className="rounded bg-orange-500 px-3 py-1 text-white" onClick={() => handleReview('again')}>
                    Again {nextTimes ? `(${nextTimes.again})` : ''}
                  </button>
                  <button className="rounded bg-emerald-600 px-3 py-1 text-white" onClick={() => handleReview('good')}>
                    Good {nextTimes ? `(${nextTimes.good})` : ''}
                  </button>
                </div>
              )}
              <div className="text-xs text-gray-500">{cards ? `${index + 1} / ${cards.length}` : ''}</div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
