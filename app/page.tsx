'use client'

import { useEffect, useState } from 'react'
import { ParkingLot3D } from '@/components/parking-lot-3d'
import { StatisticsPanel } from '@/components/statistics-panel'
import { useWebSocket } from '@/hooks/use-websocket'
import { ParkingSpot } from '@prisma/client'

export default function Home() {
  const { spots, stats, connected, error } = useWebSocket()
  const [loading, setLoading] = useState(true)

  // 处理车位点击事件（仅用于演示）
  const handleSpotClick = async (spot: ParkingSpot) => {
    try {
      const response = await fetch('/api/parking/spots', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          spotId: spot.spotId,
          isOccupied: !spot.isOccupied,
        }),
      })

      if (!response.ok) {
        console.error('更新车位状态失败')
      }
      // WebSocket 会自动更新UI，不需要手动刷新
    } catch (error) {
      console.error('更新车位状态失败:', error)
    }
  }

  // 等待WebSocket连接和初始数据
  useEffect(() => {
    if (spots.length > 0) {
      setLoading(false)
    }
  }, [spots])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="text-lg mb-2">加载中...</div>
          <div className="text-sm text-gray-500">
            WebSocket 连接状态: {connected ? '已连接' : '连接中...'}
          </div>
          {error && (
            <div className="text-sm text-red-500 mt-2">
              连接错误: {error}
            </div>
          )}
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-7xl mx-auto">
        <header className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">
            智能停车场管理系统
          </h1>
          <p className="text-gray-600">实时车位监控与车辆计数系统</p>
        </header>

        <div className="space-y-6">
          {/* 统计面板 */}
          <StatisticsPanel
            totalSpots={stats.totalSpots}
            occupiedCount={stats.occupiedCount}
          />

          {/* 3D停车场视图 */}
          <div className="bg-white rounded-lg shadow-lg p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-2xl font-bold text-gray-900">3D 停车场视图</h2>
              <div className="flex items-center space-x-4 text-sm">
                <div className="flex items-center space-x-2">
                  <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                  <span>空闲车位</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                  <span>占用车位</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className={`w-2 h-2 rounded-full ${connected ? 'bg-green-500' : 'bg-red-500'}`}></div>
                  <span className="text-xs">{connected ? '实时连接' : '连接断开'}</span>
                </div>
              </div>
            </div>
            
            <ParkingLot3D spots={spots} onSpotClick={handleSpotClick} />
            
            <div className="mt-4 text-center text-sm text-gray-500">
              点击车位可以切换占用状态（仅用于演示）
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
