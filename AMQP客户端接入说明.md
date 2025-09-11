

## 前提条件

[已创建消费组](https://help.aliyun.com/zh/iot/user-guide/manage-consumer-groups) ：使用AMQP SDK 开启 AMQP 客户端以消费消费组内的订阅消息时，必须指定消费组 ID。

## 背景信息

服务端订阅和云产品流转功能就可将设备消息流转至AMQP客户端消费。您可对比流转方案、应用场景及功能优势，根据业务需求选择合适的流转方案。具体内容，请参见：

- [数据流转方案对比](https://help.aliyun.com/zh/iot/user-guide/compare-data-forwarding-features) 。
- [配置AMQP服务端订阅](https://help.aliyun.com/zh/iot/user-guide/configure-an-amqp-server-side-subscription) 。
- [配置数据转发到AMQP服务端订阅消费组](https://help.aliyun.com/zh/iot/user-guide/forward-data-to-an-amqp-consumer-group-1) 。

## 使用限制

- 阿里云物联网平台服务端订阅仅支持AMQP 1.0版的协议标准。
- 一个AMQP客户端的连接数最大为128个。最多可开启64个AMQP客户端同时消费同一个消费组。

## 连接认证过程

1. AMQP客户端与物联网平台经过三次握手建立TCP连接，然后进行TLS握手校验。
   **说明**
   为了保障安全，接收方必须使用TLS加密，不支持非加密的TCP传输。
2. AMQP客户端请求建立 `Connection` 。
   连接认证方式为 `PLAIN-SASL` ，可以理解为用户名（userName）和密码（password）认证。物联网平台的云端认证userName和password通过后，建立 `Connection` 。
   此外，根据AMQP协议，AMQP客户端建连时，还需在Open帧中携带心跳时间，即AMQP协议的 **idle-time-out** 参数。心跳时间单位为毫秒，取值范围为30,000~300,000。如果超过心跳时间， `Connection` 上没有任何帧通信，物联网平台将关闭连接。SDK不同， **idle-time-out** 参数设置方法不同。具体设置方法，请参见各语言SDK示例文档。
3. AMQP客户端向物联网平台的云端发起请求，建立 `Receiver Link` （即云端向客户端推送数据的单向通道）。
   客户端建立 `Connection` 成功后，需在15秒内完成 `Receiver Link` 的建立，否则物联网平台会关闭连接。
   建立 `Receiver Link` 后，客户端成功接入物联网平台。
   **说明**
   - 一个 `Connection` 上只能创建一个Receiver Link，不支持创建 `Sender Link` ，即只能由物联网平台的云端向客户端推送消息，客户端不能向云端发送消息。
   - `Receiver Link` 在不同SDK中名称不同，例如在有的SDK上称为 **MessageConsumer** ，请根据具体SDK设置。

## 连接配置说明

AMQP客户端接入物联网平台的连接地址和连接认证参数说明如下：

### 接入域名和端口

公共实例和企业版实例中，AMQP的接入域名，请参见 [查看和配置实例终端节点信息（Endpoint）](https://help.aliyun.com/zh/iot/user-guide/manage-the-endpoint-of-an-instance#task-1545804) 。

**说明**

接入域名为AMQP SDK示例代码中的 `*${YourHost}*` 。

- 对于Java、.NET、Python 2.7、Node.js、Go客户端：端口号为5671。
- 对于Python3、PHP客户端：端口号为61614。

### 客户端身份认证参数

不同身份账号使用AMQP SDK将AMQP客户端接入物联网平台，配置的认证参数有区别。

- 如果是当前物联网平台所属阿里云主账号或其下直接授权的RAM用户，认证参数如下：
  **说明**
  对于直接授权的RAM用户，需要给该RAM用户授予操作AMQP服务端订阅功能的权限（iot:sub），否则将会连接失败。授权方法，请参见 [物联网平台RAM授权说明](https://help.aliyun.com/zh/iot/user-guide/iot-platform-authentication-rules) 。
  为提升物联网平台数据安全，推荐通过RAM角色授予RAM用户指定的操作权限。具体说明，请参见下文。

  ```javascript
  userName = clientId|iotInstanceId=${iotInstanceId},authMode=aksign,signMethod=hmacsha1,consumerGroupId=${consumerGroupId},authId=${accessKey},timestamp=1573489088171|
  password = signMethod(stringToSign, accessSecret)
  ```
- 如果是通过RAM角色授权的RAM用户，认证参数如下：
  **说明**
  通过RAM角色授权的RAM用户除了当前物联网平台所属阿里云主账号下的RAM用户，还支持跨账号（其他阿里云主账号）下的RAM用户。关于如何通过RAM角色授权RAM用户操作物联网平台服务端订阅功能，请参见和。

  ```javascript
  userName = clientId|iotInstanceId=${iotInstanceId},authMode=ststoken,securityToken=${SecurityToken},signMethod=hmacsha1,consumerGroupId=${consumerGroupId},authId=${accessKey},timestamp=1573489088171|
  password = signMethod(stringToSign, accessSecret)
  ```

  表 1. userName参数说明
  <table><thead><tr><td rowspan="1" colspan="1"><span><p><b>参数</b></p></span></td><td rowspan="1" colspan="1"><span><p><b>是否必传</b></p></span></td><td rowspan="1" colspan="1"><span><p><b>说明</b></p></span></td></tr></thead></table>
    <table><tbody><tr><td rowspan="1" colspan="1"><p><b>参数</b></p></td><td rowspan="1" colspan="1"><p><b>是否必传</b></p></td><td rowspan="1" colspan="1"><p><b>说明</b></p></td></tr><tr><td rowspan="1" colspan="1"><p><span><b>clientId</b></span></p></td><td rowspan="1" colspan="1"><p>是</p></td><td rowspan="1" colspan="1"><p>表示客户端ID，需您自定义，长度不可超过64个字符。建议使用您的AMQP客户端所在服务器UUID、MAC地址、IP等唯一标识。</p><p>AMQP客户端接入并启动成功后，登录物联网平台控制台，在 <span>对应实例的</span> <span><b>消息转发</b> > <b>服务端订阅</b> > <b>消费组列表</b></span> 页签，单击消费组对应的 <b>查看</b> ， <b>消费组详情</b> 页面将显示该参数，方便您识别区分不同的客户端。</p></td></tr><tr><td rowspan="1" colspan="1"><p><span><b>iotInstanceId</b></span></p></td><td rowspan="1" colspan="1"><p>否</p></td><td rowspan="1" colspan="1"><p>当前物联网平台实例的ID。 <span>您可在物联网平台控制台的 <b>实例概览</b> 页签，查看当前实例的 <b>ID</b> 。</span></p><ul><li><p>若有ID值，必须传入该ID值。</p></li><li><p>若无 <b>实例概览</b> 页签或ID值，则无需传入。</p></li></ul></td></tr><tr><td rowspan="1" colspan="1"><p><span><b>authMode</b></span></p></td><td rowspan="1" colspan="1"><p>是</p></td><td rowspan="1" colspan="1"><p>鉴权模式。</p><ul><li><p>当前物联网平台所属阿里云主账号或其下直接授权的RAM用户：使用 <code>aksign</code> 模式。</p></li><li><p>通过RAM角色授权的RAM用户：使用 <code>ststoken</code> 模式。</p></li></ul></td></tr><tr><td rowspan="1" colspan="1"><p><b>securityToken</b></p></td><td rowspan="1" colspan="1"><p>否</p></td><td rowspan="1" colspan="1"><p><strong>重要</strong></p><p>仅通过RAM角色授权的RAM用户接入AMQP客户端时，需配置此参数。</p><p>RAM用户扮演RAM角色的临时身份凭证（（STS Token）），可以通过调用AssumeRole接口获取，具体内容，请参见 <a href="https://help.aliyun.com/zh/ram/developer-reference/api-sts-2015-04-01-assumerole">AssumeRole</a> 。</p></td></tr><tr><td rowspan="1" colspan="1"><p><span><b>signMethod</b></span></p></td><td rowspan="1" colspan="1"><p>是</p></td><td rowspan="1" colspan="1"><p>签名算法。可选： <code>hmacmd5</code> 、 <code>hmacsha1</code> 和 <code>hmacsha256</code> 。</p></td></tr><tr><td rowspan="1" colspan="1"><p><span><b>consumerGroupId</b></span></p></td><td rowspan="1" colspan="1"><p>是</p></td><td rowspan="1" colspan="1"><p>当前物联网平台对应实例中的消费组ID。</p><p>登录物联网平台控制台，在对应实例的 <span><b>消息转发</b> > <b>服务端订阅</b> > <b>消费组列表</b></span> 查看您的消费组ID。</p></td></tr><tr><td rowspan="1" colspan="1"><p><span><b>authId</b></span></p></td><td rowspan="1" colspan="1"><p>是</p></td><td rowspan="1" colspan="1"><p>认证信息。</p><ul><li><p>对于当前物联网平台所属阿里云主账号或其下直接授权的RAM用户</p><p>分别对应取值为阿里云主账号的AccessKey ID，或RAM用户的AccessKey ID。</p><p>登录物联网平台控制台，将鼠标移至账号头像上，然后单击 <b>AccessKey管理</b> ，获取AccessKey。</p></li><li><p>对于通过RAM角色授权的RAM用户</p><p>取值为扮演RAM角色的RAM用户的AccessKey ID。</p></li></ul></td></tr><tr><td rowspan="1" colspan="1"><p><span><b>timestamp</b></span></p></td><td rowspan="1" colspan="1"><p>是</p></td><td rowspan="1" colspan="1"><p>当前时间。Long类型的毫秒值时间戳。</p></td></tr></tbody></table>
    表 2. password参数说明
    <table><tbody><tr><td rowspan="1" colspan="1"><p><b>参数</b></p></td><td rowspan="1" colspan="1"><p><b>是否必传</b></p></td><td rowspan="1" colspan="1"><p><b>说明</b></p></td></tr><tr><td rowspan="1" colspan="1"><p><span><b>signMethod</b></span></p></td><td rowspan="1" colspan="1"><p>是</p></td><td rowspan="1" colspan="1"><p>签名算法。请使用 <span>userName</span> 中指定的签名算法计算签名值，并转为base64字符串。</p></td></tr><tr><td rowspan="1" colspan="1"><p><span><b>stringToSign</b></span></p></td><td rowspan="1" colspan="1"><p>是</p></td><td rowspan="1" colspan="1"><p>待签名的字符串。</p><p>将需要签名的参数的键值对按照首字母字典排序，并在键值间添加等号（=）；参数间添加与号（&），拼接成待签名的字符串。</p><ul><li><p>对于当前物联网平台所属阿里云主账号或其下直接授权的RAM用户</p><p>需要签名的参数为： <code>authId</code> 和 <code>timestamp</code> 。</p><p>待签名的字符串为： <code>stringToSign = authId=${accessKey}&timestamp=1573489088171</code> 。</p></li><li><p>对于通过RAM角色授权的RAM用户</p><p>需要签名的参数为： <code>securityToken</code> 、 <code>authId</code> 和 <code>timestamp</code> 。</p><p>待签名的字符串为： <code>stringToSign = authId=${accessKey}&securityToken=${SecurityToken}&timestamp=1573489088171</code> 。</p></li></ul></td></tr><tr><td rowspan="1" colspan="1"><p><span><b>accessSecret</b></span></p></td><td rowspan="1" colspan="1"><p>是</p></td><td rowspan="1" colspan="1"><ul><li><p>对于当前物联网平台所属阿里云主账号或其下直接授权的RAM用户</p><p>分别对应取值为阿里云主账号的AccessKey Secret，或RAM用户的AccessKey Secret。</p><p>登录物联网平台控制台，将鼠标移至账号头像上，然后单击 <b>AccessKey管理</b> ，获取AccessKey。</p></li><li><p>对于通过RAM角色授权的RAM用户</p><p>取值为扮演RAM角色的RAM用户的AccessKey Secret。</p></li></ul></td></tr></tbody></table>

## 客户端接收消息逻辑

客户端和物联网平台云端之间的Receiver Link建连成功后，云端就可以在这条Link上向AMQP客户端推送消息。

**说明**

客户端仅支持接收物联网平台已经订阅的消息，要向设备发送消息或指令，可根据需要，调用对应的API。更多信息，请参见 [API列表](https://help.aliyun.com/zh/iot/developer-reference/list-of-operations-by-function#reference-kd4-l4z-wdb) 。

### 消息推送

物联网平台推送的消息：

- 消息体：消息的payload为二进制格式。
- 消息的业务属性：如消息Topic和Message ID等，需要从AMQP协议的 Application Properties 中获取。格式为 `key:value` 。
  <table><thead><tr><td rowspan="1" colspan="1"><span><p><b>Key</b></p></span></td><td rowspan="1" colspan="1"><span><p><b>含义</b></p></span></td></tr></thead></table>
    <table><tbody><tr><td rowspan="1" colspan="1"><p><b>Key</b></p></td><td rowspan="1" colspan="1"><p><b>含义</b></p></td></tr><tr><td rowspan="1" colspan="1"><p><span>topic</span></p></td><td rowspan="1" colspan="1"><p>消息Topic。</p></td></tr><tr><td rowspan="1" colspan="1"><p><span>messageId</span></p></td><td rowspan="1" colspan="1"><p>消息ID。</p></td></tr><tr><td rowspan="1" colspan="1"><p><span>generateTime</span></p></td><td rowspan="1" colspan="1"><p>消息生成时间。</p><p><strong>说明</strong></p><p>消息生成时间 <span>generateTime</span> 不能作为判断消息顺序的依据。</p></td></tr></tbody></table>

### 消息回执

按照AMQP协议的定义，客户端需要给物联网平台的云端回执（AMQP协议上一般称为settle），通知云端消息已经被成功接收。AMQP客户端通常会提供自动回执模式（推荐）和手动回执模式。具体请参考相应的客户端的使用说明。

### 消息处理

AMQP客户端接收到消息后，业务层处理该消息的逻辑和方法，由您自行完成开发。

### 消息策略

- 实时消息直接推送。
- 进入堆积列队的消息：
  由于消费客户端离线、消息消费慢等原因，消息不能实时消费，而进入堆积队列。
  - 消费客户端重新上线并恢复稳定消费能力后，物联网平台重试推送堆积消息。
  - 如果客户端对重试推送的消息消费失败，可能导致堆积队列阻塞。按大约一分钟间隔，物联网平台向客户端再次重试推送。

**说明**

- 消费端存在短暂的流量不均衡，属于正常现象。一般能在10分钟内恢复。如果您的消息QPS较高或消息处理较耗费资源，建议增加消费端的数量，保持消费能力冗余。
- 数据流转时，为确保消息送达，同一条消息可能重复发送，直到客户端返回ACK或消息过期。同一条消息的消息ID相同，您可根据消息ID去重。
- 关于消息限制的更多信息，请参见 [服务端订阅使用限制](https://help.aliyun.com/zh/iot/user-guide/limits-on-server-side-subscriptions#concept-2332563) 。
- 您可以在物联网平台控制台清除堆积消息。具体操作，请参见 [查看和监控消费组](https://help.aliyun.com/zh/iot/user-guide/manage-consumer-groups#section-li8-gk2-300) 。

### 消息时序

**说明**

消息不保序，即接收到消息的时间顺序不一定是消息实际产生的时间顺序。

- 设备上下线消息：
  收到消息的顺序不是实际设备上下线时间排序。设备上下线顺序需按照 time 具体值排序。
  例如，您依次收到3条消息：

  1. 上线： `2018-08-31 10:02:28.195` 。
  2. 下线： `2018-08-31 10:01:28.195` 。
  3. 下线： `2018-08-31 10:03:28.195` 。
     这3条消息展示了，设备先下线，再上线，最后下线的过程。
     关于消息中参数的更多信息，请参见 [数据格式](https://help.aliyun.com/zh/iot/user-guide/data-formats#concept-ap3-lql-b2b) 。
- 其他类型的消息：
  您需要在业务层，给消息增加序列号。根据接收到消息中的序列号，幂等判断消息是否需要处理。
