import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('开始初始化停车位数据...')

  // 清空现有数据
  await prisma.vehicleLog.deleteMany()
  await prisma.vehicleCount.deleteMany()
  await prisma.parkingSpot.deleteMany()

  // 创建6行8列的停车位（A1-F8）
  const rows = ['A', 'B', 'C', 'D', 'E', 'F']
  const cols = [1, 2, 3, 4, 5, 6, 7, 8]

  const parkingSpots = []
  for (const row of rows) {
    for (const col of cols) {
      parkingSpots.push({
        spotId: `${row}${col}`,
        row: row,
        col: col,
        isOccupied: Math.random() < 0.5, // 随机初始化50%占用率
      })
    }
  }

  await prisma.parkingSpot.createMany({
    data: parkingSpots,
  })

  // 创建初始车辆计数记录
  const occupiedCount = parkingSpots.filter(spot => spot.isOccupied).length
  await prisma.vehicleCount.create({
    data: {
      totalSpots: 48,
      occupiedCount: occupiedCount,
    },
  })

  console.log(`✅ 创建了 ${parkingSpots.length} 个停车位`)
  console.log(`📊 初始占用率: ${Math.round((occupiedCount / 48) * 100)}%`)
}

main()
  .then(async () => {
    await prisma.$disconnect()
  })
  .catch(async (e) => {
    console.error(e)
    await prisma.$disconnect()
    process.exit(1)
  })