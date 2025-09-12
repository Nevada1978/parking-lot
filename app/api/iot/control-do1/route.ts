import { NextRequest, NextResponse } from 'next/server';
import { controlDO1 } from '@/lib/iot-control';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { state } = body;

    // 验证参数
    if (typeof state !== 'boolean') {
      return NextResponse.json(
        { 
          success: false, 
          error: 'state参数必须是boolean类型 (true/false)' 
        }, 
        { status: 400 }
      );
    }

    console.log(`🎛️ API调用: 控制DO1 = ${state ? '高电平' : '低电平'}`);

    // 调用控制函数
    const result = await controlDO1(state);

    if (result) {
      return NextResponse.json({
        success: true,
        message: `DO1已设置为${state ? '高电平(1)' : '低电平(0)'}`,
        data: {
          device: 'PRD_SSPU_II_25_G004',
          output: 'DO1',
          state: state,
          value: state ? 1 : 0
        }
      });
    } else {
      return NextResponse.json(
        { 
          success: false, 
          error: '控制指令发送失败，请检查设备连接和配置' 
        }, 
        { status: 500 }
      );
    }

  } catch (error) {
    console.error('❌ DO1控制API错误:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : '未知错误' 
      }, 
      { status: 500 }
    );
  }
}

// 支持GET请求查看接口说明
export async function GET() {
  return NextResponse.json({
    api: '/api/iot/control-do1',
    method: 'POST',
    description: '控制USR设备的DO1输出端口',
    parameters: {
      state: {
        type: 'boolean',
        required: true,
        description: 'true=高电平(1), false=低电平(0)'
      }
    },
    example: {
      request: {
        method: 'POST',
        body: { state: true }
      },
      response: {
        success: true,
        message: 'DO1已设置为高电平(1)',
        data: {
          device: 'PRD_SSPU_II_25_G004',
          output: 'DO1',
          state: true,
          value: 1
        }
      }
    }
  });
}