# 麻将机官网联系表单 API

## 功能
- 接收网站联系表单提交
- 保存数据到本地 JSON 文件
- 推送消息到企业微信群机器人

## 安装

```bash
cd contact-api
npm install
```

## 配置

设置企业微信群机器人 Webhook Key：

```bash
export WECHAT_WEBHOOK_KEY="your-webhook-key-here"
```

或者在启动时设置：

```bash
WECHAT_WEBHOOK_KEY="your-key" npm start
```

## 启动

```bash
npm start
```

或使用 PM2 守护进程：

```bash
pm2 start server.js --name majiang-contact-api
```

## API 接口

### POST /api/contact

提交联系表单

**请求体：**
```json
{
  "name": "张三",
  "phone": "13800138000",
  "wechat": "zhangsan123",
  "interest": "家用基础款",
  "message": "需要2台，请报价",
  "page": "https://www.wujietea.com/mahjong/",
  "source": "麻将机官网"
}
```

**响应：**
```json
{
  "success": true,
  "message": "提交成功",
  "data": { "id": "abc123" }
}
```

### GET /api/health

健康检查

## 企业微信群机器人配置

1. 在企业微信群中添加机器人
2. 复制 Webhook 地址中的 key 参数
3. 设置环境变量 `WECHAT_WEBHOOK_KEY`

## 数据存储

联系记录保存在 `data/contacts_YYYY-MM-DD.json` 文件中
