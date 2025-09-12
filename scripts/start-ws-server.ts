import { wsServer } from '../lib/websocket-server'
import { amqpClient } from '../lib/amqp-client'

const port = parseInt(process.env.WEBSOCKET_PORT || '3001')

console.log('🚀 正在启动停车场管理系统服务器...')
console.log('=====================================')

// 启动 WebSocket 服务器
wsServer.start(port)

// 初始化 AMQP 客户端（已在模块加载时自动启动）
console.log('📡 AMQP 客户端已初始化')

console.log('=====================================')
console.log('✅ 系统启动完成！')
console.log(`📡 WebSocket 服务器: ws://localhost:${port}/ws`)
console.log(`🔗 AMQP 连接状态: ${amqpClient.isConnected() ? '已连接' : '连接中...'}`)
console.log('=====================================')

// 优雅关闭处理
const gracefulShutdown = () => {
  console.log('⏹️  正在关闭服务器...')
  
  try {
    amqpClient.disconnect()
    console.log('✅ AMQP 客户端已关闭')
  } catch (error) {
    console.error('关闭 AMQP 客户端时出错:', error)
  }
  
  try {
    wsServer.stop()
    console.log('✅ WebSocket 服务器已关闭')
  } catch (error) {
    console.error('关闭 WebSocket 服务器时出错:', error)
  }
  
  console.log('👋 再见!')
  process.exit(0)
}

process.on('SIGTERM', gracefulShutdown)
process.on('SIGINT', gracefulShutdown)