import { useEffect, useRef, useState } from 'react'
import { ParkingSpot } from '@prisma/client'

interface WSMessage {
  type: 'spot_update' | 'stats_update' | 'vehicle_log' | 'pong'
  data: any
  timestamp: string
}

interface ParkingStats {
  totalSpots: number
  occupiedCount: number
  freeSpots: number
  occupancyRate: number
}

export function useWebSocket() {
  const [spots, setSpots] = useState<ParkingSpot[]>([])
  const [stats, setStats] = useState<ParkingStats>({
    totalSpots: 48,
    occupiedCount: 0,
    freeSpots: 48,
    occupancyRate: 0
  })
  const [connected, setConnected] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  const wsRef = useRef<WebSocket | null>(null)
  const reconnectTimeoutRef = useRef<NodeJS.Timeout>()
  const reconnectAttempts = useRef(0)
  const maxReconnectAttempts = 5

  const connect = () => {
    try {
      const wsUrl = process.env.NEXT_PUBLIC_WS_URL || 'ws://localhost:3001'
      const ws = new WebSocket(`${wsUrl}/ws`)
      
      ws.onopen = () => {
        console.log('WebSocket 连接成功')
        setConnected(true)
        setError(null)
        reconnectAttempts.current = 0
        
        // 请求初始数据
        ws.send(JSON.stringify({
          type: 'get_initial_data',
          timestamp: new Date().toISOString()
        }))
      }

      ws.onmessage = (event) => {
        try {
          const message: WSMessage = JSON.parse(event.data)
          handleMessage(message)
        } catch (err) {
          console.error('解析 WebSocket 消息失败:', err)
        }
      }

      ws.onclose = (event) => {
        console.log('WebSocket 连接关闭:', event.code, event.reason)
        setConnected(false)
        
        // 自动重连
        if (reconnectAttempts.current < maxReconnectAttempts) {
          const delay = Math.min(1000 * Math.pow(2, reconnectAttempts.current), 30000)
          console.log(`将在 ${delay}ms 后重连... (尝试 ${reconnectAttempts.current + 1}/${maxReconnectAttempts})`)
          
          reconnectTimeoutRef.current = setTimeout(() => {
            reconnectAttempts.current++
            connect()
          }, delay)
        } else {
          setError('连接失败，已达到最大重连次数')
        }
      }

      ws.onerror = (error) => {
        console.error('WebSocket 错误:', error)
        setError('WebSocket 连接错误')
      }

      wsRef.current = ws
    } catch (err) {
      console.error('创建 WebSocket 连接失败:', err)
      setError('无法创建 WebSocket 连接')
    }
  }

  const disconnect = () => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current)
    }
    
    if (wsRef.current) {
      wsRef.current.close()
      wsRef.current = null
    }
    
    setConnected(false)
  }

  const handleMessage = (message: WSMessage) => {
    switch (message.type) {
      case 'spot_update':
        if (message.data.spot) {
          // 单个车位更新
          setSpots(prev => 
            prev.map(spot => 
              spot.spotId === message.data.spot.spotId 
                ? message.data.spot 
                : spot
            )
          )
        } else if (message.data.spots) {
          // 批量车位数据
          setSpots(message.data.spots)
        }
        break
        
      case 'stats_update':
        if (message.data.totalSpots !== undefined) {
          setStats(message.data)
        }
        break
        
      case 'vehicle_log':
        console.log('车辆进出日志:', message.data)
        break
        
      case 'pong':
        console.log('收到心跳响应')
        break
        
      default:
        console.log('未知消息类型:', message.type, message.data)
    }
  }

  const sendMessage = (message: any) => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify(message))
    } else {
      console.warn('WebSocket 未连接，无法发送消息')
    }
  }

  const ping = () => {
    sendMessage({
      type: 'ping',
      timestamp: new Date().toISOString()
    })
  }

  useEffect(() => {
    connect()
    
    // 定期心跳检测
    const heartbeatInterval = setInterval(() => {
      if (connected) {
        ping()
      }
    }, 30000) // 30秒心跳

    return () => {
      clearInterval(heartbeatInterval)
      disconnect()
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  return {
    spots,
    stats,
    connected,
    error,
    sendMessage,
    reconnect: connect
  }
}