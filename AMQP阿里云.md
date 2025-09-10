---


---
[官方文档](https://help.aliyun.com/)

本文介绍使用Node.js语言的AMQP SDK接入阿里云物联网平台，接收服务端订阅消息的示例。

## 前提条件

已获取消费组ID，并订阅Topic消息。

- [管理AMQP消费组](https://help.aliyun.com/zh/iot/user-guide/manage-consumer-groups#task-2384141) ：您可使用物联网平台默认消费组（DEFAULT\_GROUP）或创建消费组。
- [配置AMQP服务端订阅](https://help.aliyun.com/zh/iot/user-guide/configure-an-amqp-server-side-subscription#task-2331705) ：您可通过消费组订阅需要的Topic消息。

## 准备开发环境

支持使用的开发环境为Node.js 8.0.0及以上版本。

## 下载安装SDK

Node.js版本AMQP SDK，推荐使用rhea。请访问 [rhea](https://github.com/amqp/rhea) 下载库和查看使用说明。

本文示例使用命令 `npm install rhea` ，下载rhea库。

## 代码示例

1. 在Windows系统或Linux系统 [下载并安装Node.js](https://nodejs.org/en/download/) 。本文以Windows 10（64位）系统为例，下载安装包node-v14.15.1-x64.msi。
2. 安装成功后，打开CMD窗口，通过以下命令查看node版本。
   `node --version`
   显示如下版本号，表示安装成功。

   ```shell
   v14.15.1
   ```
3. 在本地计算机创建一个JavaScript文件（例如 amqp.js ），用来存放Node.js示例代码。
   示例代码如下，按照以下表格中的参数说明，修改代码中的参数值。
   **重要**
   请确保参数值输入正确，否则AMQP客户端接入会失败。

   ```javascript
   const container = require('rhea');
   const crypto = require('crypto');
   //工程代码泄露可能会导致AccessKey泄露，并威胁账号下所有资源的安全性。以下代码示例使用环境变量获取 AccessKey 的方式进行调用，仅供参考
   var accessKey = process.env['ALIBABA_CLOUD_ACCESS_KEY_ID'];
   var accessSecret = process.env['ALIBABA_CLOUD_ACCESS_KEY_SECRET'];
   //创建Connection。
   var connection = container.connect({
       //接入域名，请参见AMQP客户端接入说明文档。
       'host': '${YourHost}',
       'port': 5671,
       'transport':'tls',
       'reconnect':true,
       'idle_time_out':60000,
       //userName组装方法，请参见AMQP客户端接入说明文档。
       'username':'${YourClientId}|authMode=aksign,signMethod=hmacsha1,timestamp=1573489088171,authId=' + accessKey + ',iotInstanceId=${YourIotInstanceId},consumerGroupId=${YourConsumerGroupId}|', 
       //计算签名，password组装方法，请参见AMQP客户端接入说明文档。
       'password': hmacSha1(accessSecret, 'authId='+ accessKey +'&timestamp=1573489088171'),
   });
   //创建Receiver Link。
   var receiver = connection.open_receiver();
   //接收云端推送消息的回调函数。
   container.on('message', function (context) {
       var msg = context.message;
       var messageId = msg.message_id;
       var topic = msg.application_properties.topic;
       var content = Buffer.from(msg.body.content).toString();
       // 输出内容。
       console.log(content);
       //发送ACK，注意不要在回调函数有耗时逻辑。
       context.delivery.accept();
   });
   //计算password签名。
   function hmacSha1(key, context) {
       return Buffer.from(crypto.createHmac('sha1', key).update(context).digest())
           .toString('base64');
   }
   ```

   <table><tbody><tr><td rowspan="1" colspan="1"><p><b>参数</b></p></td><td rowspan="1" colspan="1"><p><b>示例</b></p></td><td rowspan="1" colspan="1"><p><b>说明</b></p></td></tr><tr><td rowspan="1" colspan="1"><p>host</p></td><td rowspan="1" colspan="1"><p>iot-cn-***.amqp.iothub.aliyuncs.com</p></td><td rowspan="1" colspan="1"><p>AMQP接入域名。</p><p><code>${YourHost}</code> 对应的AMQP接入域名信息，请参见 <a href="https://help.aliyun.com/zh/iot/user-guide/manage-the-endpoint-of-an-instance#task-1545804">查看和配置实例终端节点信息（Endpoint）</a> 。</p></td></tr><tr><td rowspan="1" colspan="1"><p>username</p></td><td rowspan="1" colspan="1"><p><span>'test |authMode=aksign,signMethod=hmacsha1,timestamp=1573489088171,authId=LTAI****************,iotInstanceId=iot-060a02ne,consumerGroupId=DEFAULT_GROUP|'</span></p></td><td rowspan="2" colspan="1"><p>接入物联网平台的身份认证信息。其中：</p><ul><li><p><span><code>${YourClientId}</code></span> ：替换为客户端ID，可自定义，长度不可超过64个字符。建议使用您的AMQP客户端所在服务器UUID、MAC地址、IP等唯一标识。</p><p>AMQP客户端接入并启动成功后，登录物联网平台控制台，在 <span>对应实例的</span> <span><b>消息转发</b> > <b>服务端订阅</b> > <b>消费组列表</b></span> 页签，单击消费组对应的 <b>查看</b> ， <span><b>消费组详情</b></span> 页面将显示该参数，方便您识别区分不同的客户端。</p></li><li><p><span><code>${YourAccessKeyId}</code></span> 、 <span><code>${YourAccessKeySecret}</code></span> ：替换为您物联网平台的AccessKey ID和AccessKey Secret。</p><p>登录物联网平台控制台，将鼠标移至账号头像上，然后单击 <b>AccessKey管理</b> ，获取AccessKey ID和AccessKey Secret。</p><p><strong>说明</strong></p><p>如果使用RAM用户，您需授予该RAM用户管理物联网平台的权限（AliyunIOTFullAccess），否则将连接失败。授权方法请参见 <a href="https://help.aliyun.com/zh/iot/user-guide/access-iot-platform-as-a-ram-user#section-vb3-y4m-51r">RAM用户访问</a> 。</p></li><li><p><span><code>${YourIotInstanceId}</code></span> ：替换为实例ID。</p><p>您可登录 <span><a href="https://iot.console.aliyun.com/">物联网平台控制台</a></span> ，在 <b>实例概览</b> 找到对应的实例，查看实例ID。</p><p><strong>重要</strong></p><p>若没有 <span><b>实例概览</b> 或</span> ID，直接删除${YourIotInstanceId}即可。</p></li><li><p><span><code>${YourConsumerGroupId}</code></span> ：替换为消费组ID。</p><p>登录物联网平台控制台，在 <span>对应实例的</span> <span><b>消息转发</b> > <b>服务端订阅</b> > <b>消费组列表</b></span> 查看您的消费组ID。</p></li></ul></td></tr><tr><td rowspan="1" colspan="1"><p>password</p></td><td rowspan="1" colspan="1"><p>hmacSha1('yourAccessKeySecret','authId=LTAI****************&timestamp=1573489088171')</p></td></tr></tbody></table>
4. 打开CMD窗口，使用cd命令找到 amqp.js 文件所在路径，在该路径下使用npm命令下载rhea库。下载后，项目文件如下图所示。

   ```
   npm install rhea
   ```

   ![文件目录](https://help-static-aliyun-doc.aliyuncs.com/assets/img/zh-CN/9171706261/p293340.png)
5. 在CMD窗口输入如下命令，运行 amqp.js 代码，启动AMQP客户端服务器。

   ```
   node amqp.js
   ```

## 运行结果示例

- 成功： 返回类似如下日志信息，表示AMQP客户端已接入物联网平台并成功接收消息。 ![成功](https://help-static-aliyun-doc.aliyuncs.com/assets/img/zh-CN/0180547261/p241998.png)
- 失败： 返回类似如下日志信息，表示AMQP客户端连接物联网平台失败。
  您可根据日志提示，检查代码或网络环境，然后修正问题，重新运行代码。
  ![失败](https://help-static-aliyun-doc.aliyuncs.com/assets/img/zh-CN/1725793161/p241999.png)
