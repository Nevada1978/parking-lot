import { WebSocketServer } from 'ws'
import { createServer } from 'http'
import { prisma } from './prisma'

export interface WSMessage {
  type: 'spot_update' | 'stats_update' | 'vehicle_log'
  data: any
  timestamp: string
}

class ParkingWebSocketServer {
  private wss: WebSocketServer
  private server: any
  
  constructor() {
    this.server = createServer()
    this.wss = new WebSocketServer({ 
      server: this.server,
      path: '/ws'
    })
    
    this.setupEventHandlers()
  }

  private setupEventHandlers() {
    this.wss.on('connection', (ws) => {
      console.log('客户端已连接')
      
      ws.on('message', (message) => {
        try {
          const data = JSON.parse(message.toString())
          this.handleMessage(ws, data)
        } catch (error) {
          console.error('解析消息失败:', error)
        }
      })
      
      ws.on('close', () => {
        console.log('客户端断开连接')
      })
      
      // 发送欢迎消息
      this.sendMessage(ws, {
        type: 'stats_update',
        data: { message: '已连接到停车场实时数据' },
        timestamp: new Date().toISOString()
      })
    })
  }

  private handleMessage(ws: any, message: any) {
    console.log('收到消息:', message)
    
    switch (message.type) {
      case 'get_initial_data':
        this.sendInitialData(ws)
        break
      case 'ping':
        this.sendMessage(ws, {
          type: 'pong',
          data: {},
          timestamp: new Date().toISOString()
        })
        break
      default:
        console.log('未知消息类型:', message.type)
    }
  }

  private async sendInitialData(ws: any) {
    try {
      const [spots, stats] = await Promise.all([
        prisma.parkingSpot.findMany({
          orderBy: [{ row: 'asc' }, { col: 'asc' }]
        }),
        this.getStats()
      ])

      this.sendMessage(ws, {
        type: 'spot_update',
        data: { spots },
        timestamp: new Date().toISOString()
      })

      this.sendMessage(ws, {
        type: 'stats_update',
        data: stats,
        timestamp: new Date().toISOString()
      })
    } catch (error) {
      console.error('发送初始数据失败:', error)
    }
  }

  private sendMessage(ws: any, message: WSMessage) {
    if (ws.readyState === ws.OPEN) {
      ws.send(JSON.stringify(message))
    }
  }

  // 广播消息给所有连接的客户端
  public broadcast(message: WSMessage) {
    this.wss.clients.forEach((client) => {
      if (client.readyState === client.OPEN) {
        client.send(JSON.stringify(message))
      }
    })
  }

  // 广播车位状态更新
  public async broadcastSpotUpdate(spotId: string) {
    try {
      const spot = await prisma.parkingSpot.findUnique({
        where: { spotId }
      })
      
      if (spot) {
        this.broadcast({
          type: 'spot_update',
          data: { spot },
          timestamp: new Date().toISOString()
        })
      }
    } catch (error) {
      console.error('广播车位更新失败:', error)
    }
  }

  // 广播统计数据更新
  public async broadcastStatsUpdate() {
    try {
      const stats = await this.getStats()
      
      this.broadcast({
        type: 'stats_update',
        data: stats,
        timestamp: new Date().toISOString()
      })
    } catch (error) {
      console.error('广播统计更新失败:', error)
    }
  }

  private async getStats() {
    const spots = await prisma.parkingSpot.findMany()
    const totalSpots = spots.length
    const occupiedCount = spots.filter(spot => spot.isOccupied).length
    const freeSpots = totalSpots - occupiedCount
    const occupancyRate = totalSpots > 0 ? (occupiedCount / totalSpots) * 100 : 0

    return {
      totalSpots,
      occupiedCount,
      freeSpots,
      occupancyRate: Math.round(occupancyRate * 10) / 10
    }
  }

  public start(port: number = 3001) {
    this.server.listen(port, () => {
      console.log(`WebSocket 服务器启动在端口 ${port}`)
    })
  }

  public stop() {
    this.wss.close()
    this.server.close()
  }
}

// 导出单例实例
export const wsServer = new ParkingWebSocketServer()