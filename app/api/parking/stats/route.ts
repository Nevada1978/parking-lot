import { prisma } from '@/lib/prisma'
import { NextResponse } from 'next/server'

export async function GET() {
  try {
    const [spots, latestCount] = await Promise.all([
      prisma.parkingSpot.findMany(),
      prisma.vehicleCount.findFirst({
        orderBy: { timestamp: 'desc' }
      })
    ])

    const totalSpots = spots.length
    const occupiedCount = spots.filter(spot => spot.isOccupied).length
    const freeSpots = totalSpots - occupiedCount
    const occupancyRate = totalSpots > 0 ? (occupiedCount / totalSpots) * 100 : 0

    const stats = {
      totalSpots,
      occupiedCount,
      freeSpots,
      occupancyRate: Math.round(occupancyRate * 10) / 10 // 保留一位小数
    }

    // 更新数据库中的统计记录
    if (latestCount && latestCount.occupiedCount !== occupiedCount) {
      await prisma.vehicleCount.create({
        data: {
          totalSpots,
          occupiedCount
        }
      })
    }

    return NextResponse.json({
      success: true,
      data: stats
    })
  } catch (error) {
    console.error('获取停车场统计数据失败:', error)
    return NextResponse.json(
      { success: false, error: '获取停车场统计数据失败' },
      { status: 500 }
    )
  }
}