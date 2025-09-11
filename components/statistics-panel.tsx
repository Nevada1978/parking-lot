'use client'

import { Card } from '@/components/ui/card'
import { cn } from '@/lib/utils'

interface StatisticsPanelProps {
  totalSpots: number
  occupiedCount: number
  className?: string
}

export function StatisticsPanel({ totalSpots, occupiedCount, className }: StatisticsPanelProps) {
  const freeSpots = totalSpots - occupiedCount
  const occupancyRate = totalSpots > 0 ? (occupiedCount / totalSpots) * 100 : 0

  const stats = [
    {
      title: '总车位',
      value: totalSpots,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
      borderColor: 'border-blue-200'
    },
    {
      title: '已占用',
      value: occupiedCount,
      color: 'text-red-600',
      bgColor: 'bg-red-50',
      borderColor: 'border-red-200'
    },
    {
      title: '空闲',
      value: freeSpots,
      color: 'text-green-600',
      bgColor: 'bg-green-50',
      borderColor: 'border-green-200'
    },
    {
      title: '占用率(%)',
      value: occupancyRate.toFixed(1),
      color: occupancyRate > 80 ? 'text-red-600' : occupancyRate > 60 ? 'text-orange-600' : 'text-green-600',
      bgColor: occupancyRate > 80 ? 'bg-red-50' : occupancyRate > 60 ? 'bg-orange-50' : 'bg-green-50',
      borderColor: occupancyRate > 80 ? 'border-red-200' : occupancyRate > 60 ? 'border-orange-200' : 'border-green-200'
    }
  ]

  return (
    <div className={cn('grid grid-cols-1 md:grid-cols-4 gap-4', className)}>
      {stats.map((stat, index) => (
        <Card key={index} className={cn('p-4 border-2', stat.bgColor, stat.borderColor)}>
          <div className="text-center">
            <h3 className="text-sm font-medium text-gray-600 mb-2">{stat.title}</h3>
            <p className={cn('text-3xl font-bold', stat.color)}>
              {stat.value}
              {stat.title === '占用率(%)' && '%'}
            </p>
          </div>
        </Card>
      ))}
    </div>
  )
}