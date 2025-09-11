import { prisma } from '@/lib/prisma'
import { NextResponse } from 'next/server'

export async function POST() {
  try {
    // 获取所有停车位
    const spots = await prisma.parkingSpot.findMany()
    
    if (spots.length === 0) {
      return NextResponse.json(
        { success: false, error: '没有找到停车位数据，请先运行数据库种子' },
        { status: 400 }
      )
    }

    // 随机选择1-3个车位改变状态
    const spotsToChange = Math.floor(Math.random() * 3) + 1
    const randomSpots = spots.sort(() => 0.5 - Math.random()).slice(0, spotsToChange)

    const updates = []
    
    for (const spot of randomSpots) {
      const newStatus = !spot.isOccupied
      
      updates.push(
        prisma.parkingSpot.update({
          where: { id: spot.id },
          data: { isOccupied: newStatus }
        })
      )

      // 记录车辆进出日志
      updates.push(
        prisma.vehicleLog.create({
          data: {
            action: newStatus ? 'enter' : 'exit'
          }
        })
      )
    }

    await Promise.all(updates)

    // 更新车辆计数统计
    const updatedSpots = await prisma.parkingSpot.findMany()
    const occupiedCount = updatedSpots.filter(s => s.isOccupied).length
    
    await prisma.vehicleCount.create({
      data: {
        totalSpots: updatedSpots.length,
        occupiedCount
      }
    })

    return NextResponse.json({
      success: true,
      message: `已更新 ${spotsToChange} 个车位状态`,
      data: {
        changedSpots: randomSpots.map(s => s.spotId),
        currentOccupancy: `${occupiedCount}/${updatedSpots.length}`
      }
    })
  } catch (error) {
    console.error('模拟停车场状态变化失败:', error)
    return NextResponse.json(
      { success: false, error: '模拟失败' },
      { status: 500 }
    )
  }
}

export async function GET() {
  return NextResponse.json({
    message: '使用 POST 请求来模拟停车场状态变化',
    endpoints: {
      simulate: 'POST /api/mock/simulate - 随机改变1-3个车位状态'
    }
  })
}