import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const month = searchParams.get('month')

  if (!month) {
    return NextResponse.json({ message: 'Month parameter is required' }, { status: 400 })
  }

  try {
    const startDate = new Date(`${month}-01`)
    const endDate = new Date(new Date(startDate).setMonth(startDate.getMonth() + 1))

    const [
      totalExpenses,
      totalCategories,
      totalVouchers,
      expenseData,
      monthlyTrendData,
      recentExpenses,
      expenseTypeCounts
    ] = await Promise.all([
      prisma.expense.aggregate({
        where: { date: { gte: startDate, lt: endDate } },
        _sum: { amount: true },
      }),
      prisma.category.count(),
      prisma.expense.count({ where: { date: { gte: startDate, lt: endDate } } }),
      prisma.expense.groupBy({
        by: ['categoryId'],
        where: { date: { gte: startDate, lt: endDate } },
        _sum: { amount: true },
      }),
      prisma.expense.groupBy({
        by: ['date'],
        where: { date: { gte: startDate, lt: endDate } },
        _sum: { amount: true },
      }),
      prisma.expense.findMany({
        where: { date: { gte: startDate, lt: endDate } },
        orderBy: { date: 'desc' },
        take: 5,
      }),
      prisma.expense.groupBy({
        by: ['typeId'],
        where: { date: { gte: startDate, lt: endDate } },
        _count: true,
      }),
    ])

    // Fetch all categories
    const categories = await prisma.category.findMany()

    // Fetch expense types
    const expenseTypes = await prisma.expenseType.findMany()

    // Create a map of categoryId to category name
    const categoryMap = new Map(categories.map(c => [c.id, c.name]))

    // Create a map of typeId to expense type name
    const expenseTypeMap = new Map(expenseTypes.map(t => [t.id, t.name]))

    // Create a map of typeId to count
    const expenseTypeCountMap = new Map(expenseTypeCounts.map(e => [e.typeId, e._count]))

    return NextResponse.json({
      totalExpenses: totalExpenses._sum.amount || 0,
      totalCategories,
      totalVouchers,
      expenseData: expenseData.map(e => ({
        name: categoryMap.get(e.categoryId) || 'Unknown',
        value: e._sum.amount || 0
      })),
      monthlyTrendData: monthlyTrendData.map(e => ({
        name: e.date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        value: e._sum.amount || 0
      })),
      expenseTypeData: expenseTypes.map(type => ({
        name: type.name,
        value: expenseTypeCountMap.get(type.id) || 0
      })),
      recentExpenses: recentExpenses.map(e => ({
        id: e.id,
        category: categoryMap.get(e.categoryId) || 'Unknown',
        amount: e.amount,
        date: e.date.toISOString().slice(0, 10),
        type: expenseTypeMap.get(e.typeId) || 'Unknown',
      })),
    })
  } catch (error) {
    console.error('Failed to fetch dashboard data:', error)
    return NextResponse.json({ message: 'Failed to fetch dashboard data' }, { status: 500 })
  }
}