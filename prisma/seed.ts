import { PrismaClient } from '@prisma/client'
import dayjs from 'dayjs'

const prisma = new PrismaClient()

async function main() {
  // Roots
  const upsc = await prisma.folder.create({
    data: { name: 'UPSC', color: '#0ea5e9' }
  })
  const dsa = await prisma.folder.create({
    data: { name: 'DSA', color: '#22c55e' }
  })

  // Children
  const polity = await prisma.folder.create({ data: { name: 'Polity', parentId: upsc.id } })
  const history = await prisma.folder.create({ data: { name: 'History', parentId: upsc.id } })
  const arrays = await prisma.folder.create({ data: { name: 'Arrays', parentId: dsa.id } })

  // Topics
  await prisma.topic.createMany({
    data: [
      { folderId: polity.id, title: 'Fundamental Rights', done: false },
      { folderId: polity.id, title: 'Directive Principles', done: true },
      { folderId: arrays.id, title: 'Two Sum', done: true },
      { folderId: arrays.id, title: 'Max Subarray', done: false }
    ]
  })

  // Notes
  const note1 = await prisma.note.create({
    data: { folderId: polity.id, title: 'Fundamental Rights Notes', content: '# FRs\n- Art 14\n- Art 19' }
  })
  const note2 = await prisma.note.create({
    data: { folderId: arrays.id, title: 'Kadane Overview', content: '# Kadane\nExplain algorithm' }
  })

  // Cards
  const card1 = await prisma.card.create({
    data: { folderId: arrays.id, noteId: note2.id, front: 'What is Kadane?', back: 'Max subarray algo', intervalIndex: 0, nextDue: dayjs().toDate() }
  })

  // Tasks
  const today = dayjs()
  await prisma.task.createMany({
    data: [
      { folderId: polity.id, title: 'Read FRs', kind: 'custom', due: today.add(0, 'day').toDate() },
      { folderId: arrays.id, title: 'Practice Two Sum', kind: 'custom', due: today.add(1, 'day').toDate() },
      { folderId: arrays.id, title: 'Review Kadane Card', kind: 'sr_card', linkId: card1.id, nextDue: today.toDate(), intervalIndex: 0 }
    ]
  })

  // Schedule notes for SR
  await prisma.note.update({ where: { id: note1.id }, data: { intervalIndex: 0, nextDue: today.toDate() } })
  await prisma.note.update({ where: { id: note2.id }, data: { intervalIndex: 1, nextDue: today.add(1, 'day').toDate() } })

  console.log('Seed completed')
}

main().finally(async () => {
  await prisma.$disconnect()
})
