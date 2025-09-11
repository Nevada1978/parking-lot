import { prisma } from '@/lib/prisma'
import { NextResponse } from 'next/server'

export async function GET() {
  try {
    const spots = await prisma.parkingSpot.findMany({
      orderBy: [
        { row: 'asc' },
        { col: 'asc' }
      ]
    })

    return NextResponse.json({
      success: true,
      data: spots
    })
  } catch (error) {
    console.error('获取停车位数据失败:', error)
    return NextResponse.json(
      { success: false, error: '获取停车位数据失败' },
      { status: 500 }
    )
  }
}

export async function PUT(request: Request) {
  try {
    const { spotId, isOccupied } = await request.json()

    if (!spotId || typeof isOccupied !== 'boolean') {
      return NextResponse.json(
        { success: false, error: '参数错误' },
        { status: 400 }
      )
    }

    const updatedSpot = await prisma.parkingSpot.update({
      where: { spotId },
      data: { isOccupied }
    })

    return NextResponse.json({
      success: true,
      data: updatedSpot
    })
  } catch (error) {
    console.error('更新停车位状态失败:', error)
    return NextResponse.json(
      { success: false, error: '更新停车位状态失败' },
      { status: 500 }
    )
  }
}