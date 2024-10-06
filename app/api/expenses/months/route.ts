// app/api/expenses/months/route.ts
import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

export async function GET() {
  try {
    const months = await prisma.expense.findMany({
      distinct: ['date'],
      select: {
        date: true,
      },
      orderBy: {
        date: 'desc',
      },
    })

    const formattedMonths = Array.from(new Set(
      months.map(m => m.date.toISOString().slice(0, 7))
    )).sort((a, b) => b.localeCompare(a))

    return NextResponse.json({ months: formattedMonths })
  } catch (error) {
    console.error('Failed to fetch months:', error)
    return NextResponse.json({ message: 'Failed to fetch months' }, { status: 500 })
  }
}