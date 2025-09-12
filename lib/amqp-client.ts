import * as rhea from 'rhea'
import { createHmac } from 'crypto'
import { prisma } from './prisma'
import { wsServer } from './websocket-server'

interface AMQPMessage {
  type: 'spot_status' | 'vehicle_count'
  spot_id?: string
  status?: 'occupied' | 'free'
  action?: 'enter' | 'exit'
  total_count?: number
  timestamp: string
}

class AMQPClient {
  private connection: any = null
  private receiver: any = null
  private connected: boolean = false

  constructor() {
    this.setupAMQPClient()
  }

  private setupAMQPClient() {
    try {
      // 从环境变量读取配置
      const accessKey = process.env.ALIBABA_CLOUD_ACCESS_KEY_ID
      const accessSecret = process.env.ALIBABA_CLOUD_ACCESS_KEY_SECRET
      const host = process.env.AMQP_HOST
      const clientId = process.env.AMQP_CLIENT_ID || 'parking_system_client'
      const iotInstanceId = process.env.AMQP_IOT_INSTANCE_ID
      const consumerGroupId = process.env.AMQP_CONSUMER_GROUP_ID || 'DEFAULT_GROUP'

      if (!accessKey || !accessSecret || !host) {
        console.error('❌ AMQP配置不完整，无法连接阿里云物联网平台')
        console.error('请检查以下环境变量:')
        console.error('- ALIBABA_CLOUD_ACCESS_KEY_ID')
        console.error('- ALIBABA_CLOUD_ACCESS_KEY_SECRET') 
        console.error('- AMQP_HOST')
        return
      }

      console.log('正在初始化 AMQP 客户端...')

      // 生成时间戳和签名
      const timestamp = Date.now()
      const password = this.generatePassword(accessSecret, accessKey, timestamp)
      
      const username = `${clientId}|authMode=aksign,signMethod=hmacsha1,timestamp=${timestamp},authId=${accessKey}${iotInstanceId ? `,iotInstanceId=${iotInstanceId}` : ''},consumerGroupId=${consumerGroupId}|`

      // 创建连接
      const container = rhea.create_container()
      
      this.connection = container.connect({
        host: host,
        port: 5671,
        transport: 'tls',
        reconnect: true,
        idle_time_out: 60000,
        username: username,
        password: password,
      })

      this.connection.on('connection_open', () => {
        console.log('✅ AMQP 连接成功')
        this.connected = true
        this.createReceiver()
      })

      this.connection.on('connection_close', () => {
        console.log('❌ AMQP 连接关闭')
        this.connected = false
      })

      this.connection.on('connection_error', (error: any) => {
        console.error('❌ AMQP 连接错误:', error)
        this.connected = false
        console.error('请检查网络连接和AMQP配置参数')
      })

      this.connection.on('disconnected', () => {
        console.log('AMQP 连接断开，尝试重连...')
        this.connected = false
      })

    } catch (error) {
      console.error('初始化 AMQP 客户端失败:', error)
      console.error('请检查网络连接和配置参数')
    }
  }

  private createReceiver() {
    try {
      this.receiver = this.connection.open_receiver()
      
      this.receiver.on('message', (context: any) => {
        try {
          const msg = context.message
          const messageId = msg.message_id
          const topic = msg.application_properties?.topic
          const content = Buffer.from(msg.body.content).toString()
          
          console.log('收到 AMQP 消息:', {
            messageId,
            topic,
            content
          })

          // 解析消息内容
          const data: AMQPMessage = JSON.parse(content)
          this.handleAMQPMessage(data)
          
          // 发送 ACK 确认
          context.delivery.accept()
        } catch (error) {
          console.error('处理 AMQP 消息失败:', error)
          context.delivery.reject()
        }
      })
    } catch (error) {
      console.error('创建 AMQP 接收器失败:', error)
    }
  }

  private generatePassword(accessSecret: string, accessKey: string, timestamp: number): string {
    const context = `authId=${accessKey}&timestamp=${timestamp}`
    return createHmac('sha1', accessSecret)
      .update(context)
      .digest('base64')
  }

  private async handleAMQPMessage(data: AMQPMessage) {
    try {
      console.log('处理消息:', data)

      switch (data.type) {
        case 'spot_status':
          await this.handleSpotStatusUpdate(data)
          break
          
        case 'vehicle_count':
          await this.handleVehicleCountUpdate(data)
          break
          
        default:
          console.log('未知消息类型:', data.type)
      }
    } catch (error) {
      console.error('处理 AMQP 消息失败:', error)
    }
  }

  private async handleSpotStatusUpdate(data: AMQPMessage) {
    if (!data.spot_id || !data.status) {
      console.error('车位状态消息格式错误:', data)
      return
    }

    try {
      const isOccupied = data.status === 'occupied'
      
      // 更新数据库
      await prisma.parkingSpot.update({
        where: { spotId: data.spot_id },
        data: { isOccupied }
      })

      console.log(`车位 ${data.spot_id} 状态更新为: ${data.status}`)

      // 通过 WebSocket 广播更新
      await wsServer.broadcastSpotUpdate(data.spot_id)
      await wsServer.broadcastStatsUpdate()
      
    } catch (error) {
      console.error('更新车位状态失败:', error)
    }
  }

  private async handleVehicleCountUpdate(data: AMQPMessage) {
    if (!data.action) {
      console.error('车辆计数消息格式错误:', data)
      return
    }

    try {
      // 记录车辆进出日志
      await prisma.vehicleLog.create({
        data: {
          action: data.action
        }
      })

      console.log(`记录车辆${data.action === 'enter' ? '进入' : '离开'}`)

      // 更新统计数据并广播
      await wsServer.broadcastStatsUpdate()
      
    } catch (error) {
      console.error('处理车辆计数更新失败:', error)
    }
  }

  public isConnected(): boolean {
    return this.connected
  }

  public disconnect() {
    if (this.receiver) {
      this.receiver.close()
    }
    if (this.connection) {
      this.connection.close()
    }
    this.connected = false
  }
}

// 导出单例实例
export const amqpClient = new AMQPClient()