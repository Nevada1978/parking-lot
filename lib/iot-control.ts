import Iot, * as $Iot from '@alicloud/iot20180120';
import OpenApi, * as $OpenApi from '@alicloud/openapi-client';

export class IoTDeviceController {
  private client: Iot;
  private productKey: string;
  private deviceName: string;
  private iotInstanceId: string;

  constructor() {
    // 初始化阿里云IoT客户端
    const config = new $OpenApi.Config({
      accessKeyId: process.env.ALIBABA_CLOUD_ACCESS_KEY_ID,
      accessKeySecret: process.env.ALIBABA_CLOUD_ACCESS_KEY_SECRET,
      regionId: process.env.IOT_REGION_ID || 'cn-shanghai',
    });

    this.client = new Iot(config);
    this.productKey = process.env.IOT_PRODUCT_KEY || 'a1dbSes7eAi';
    this.deviceName = process.env.IOT_DEVICE_NAME || '';
    this.iotInstanceId = process.env.IOT_INSTANCE_ID || '';

    if (!this.deviceName) {
      console.warn('警告: IOT_DEVICE_NAME 未配置，请在.env文件中设置设备名称');
    }
  }

  /**
   * 控制DO1输出状态
   * @param state - true为高电平(1)，false为低电平(0)
   */
  async controlDO1(state: boolean): Promise<boolean> {
    return this.controlOutput('DO1', state ? 1 : 0);
  }

  /**
   * 控制DO2输出状态  
   * @param state - true为高电平(1)，false为低电平(0)
   */
  async controlDO2(state: boolean): Promise<boolean> {
    return this.controlOutput('DO2', state ? 1 : 0);
  }

  /**
   * 同时控制DO1和DO2
   * @param do1State - DO1状态
   * @param do2State - DO2状态
   */
  async controlBothOutputs(do1State: boolean, do2State: boolean): Promise<boolean> {
    const controlData = {
      DO1: do1State ? 1 : 0,
      DO2: do2State ? 1 : 0
    };

    return this.sendControlMessage(controlData);
  }

  /**
   * 控制单个输出端口
   * @private
   */
  private async controlOutput(port: 'DO1' | 'DO2', value: number): Promise<boolean> {
    const controlData = {
      [port]: value
    };

    return this.sendControlMessage(controlData);
  }

  /**
   * 发送控制消息到设备
   * @private
   */
  private async sendControlMessage(controlData: Record<string, any>): Promise<boolean> {
    try {
      if (!this.deviceName) {
        throw new Error('设备名称未配置，请设置 IOT_DEVICE_NAME 环境变量');
      }

      // 调试信息
      console.log('🔧 IoT控制配置信息:');
      console.log('  - ProductKey:', this.productKey);
      console.log('  - DeviceName:', this.deviceName);
      console.log('  - InstanceId:', this.iotInstanceId);
      console.log('  - Region:', process.env.IOT_REGION_ID);

      // 构建消息内容
      const messageContent = JSON.stringify(controlData);
      const base64Content = Buffer.from(messageContent).toString('base64');

      // 构建Topic - 使用属性设置Topic
      const topicFullName = `/sys/${this.productKey}/${this.deviceName}/thing/service/property/set`;

      // 创建发布请求
      const requestParams: any = {
        productKey: this.productKey,
        messageContent: base64Content,
        topicFullName: topicFullName,
        qos: 0, // QoS0，至多一次传输
      };

      // 只有当实例ID不为空时才添加
      if (this.iotInstanceId && this.iotInstanceId.trim() !== '') {
        requestParams.iotInstanceId = this.iotInstanceId;
      }

      const request = new $Iot.PubRequest(requestParams);

      console.log(`📤 发送控制指令到设备 ${this.deviceName}:`, controlData);
      console.log(`📍 Topic: ${topicFullName}`);
      console.log(`📋 Request:`, {
        iotInstanceId: requestParams.iotInstanceId || '(不使用实例ID)',
        productKey: request.productKey,
        topicFullName: request.topicFullName,
        messageContent: messageContent, // 显示原始消息内容
      });

      // 发送消息
      const response = await this.client.pub(request);
      
      console.log('📨 API响应:', response.body);
      
      if (response.body?.success) {
        console.log('✅ 设备控制指令发送成功:', response.body.requestId);
        return true;
      } else {
        console.error('❌ 设备控制指令发送失败:', response.body?.errorMessage || response.body?.code);
        return false;
      }

    } catch (error) {
      console.error('❌ 发送控制指令时出错:', error);
      if (error instanceof Error) {
        console.error('错误详情:', error.message);
        console.error('错误栈:', error.stack);
      }
      return false;
    }
  }

  /**
   * 获取当前配置信息（用于调试）
   */
  getConfig() {
    return {
      productKey: this.productKey,
      deviceName: this.deviceName,
      iotInstanceId: this.iotInstanceId,
      hasDeviceName: !!this.deviceName,
      hasInstanceId: !!this.iotInstanceId
    };
  }
}

// 创建全局实例
export const iotController = new IoTDeviceController();

// 导出便捷方法
export const controlDO1 = (state: boolean) => iotController.controlDO1(state);
export const controlDO2 = (state: boolean) => iotController.controlDO2(state);
export const controlBothOutputs = (do1: boolean, do2: boolean) => iotController.controlBothOutputs(do1, do2);