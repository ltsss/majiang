const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3006;

// 中间件
app.use(cors());
app.use(express.json());

// 企业微信机器人 Webhook 配置
// 注意：需要替换为实际的企业微信群机器人 Webhook Key
const WECHAT_WEBHOOK_KEY = process.env.WECHAT_WEBHOOK_KEY || 'YOUR_WEBHOOK_KEY';
const WECHAT_WEBHOOK_URL = `https://qyapi.weixin.qq.com/cgi-bin/webhook/send?key=${WECHAT_WEBHOOK_KEY}`;

// 数据存储目录
const DATA_DIR = path.join(__dirname, 'data');
if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
}

/**
 * 发送消息到企业微信群机器人
 */
async function sendToWechatRobot(message) {
    try {
        const response = await fetch(WECHAT_WEBHOOK_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                msgtype: 'markdown',
                markdown: {
                    content: message
                }
            })
        });
        
        const result = await response.json();
        if (result.errcode !== 0) {
            console.error('WeChat robot error:', result);
            return { success: false, error: result.errmsg };
        }
        return { success: true };
    } catch (error) {
        console.error('Send to WeChat robot failed:', error);
        return { success: false, error: error.message };
    }
}

/**
 * 保存联系信息到本地文件
 */
function saveContact(data) {
    const timestamp = new Date().toISOString();
    const date = new Date().toISOString().split('T')[0];
    const filename = `contacts_${date}.json`;
    const filepath = path.join(DATA_DIR, filename);
    
    const record = {
        ...data,
        timestamp,
        id: Date.now().toString(36)
    };
    
    let records = [];
    if (fs.existsSync(filepath)) {
        const content = fs.readFileSync(filepath, 'utf8');
        records = JSON.parse(content);
    }
    
    records.push(record);
    fs.writeFileSync(filepath, JSON.stringify(records, null, 2));
    
    return record;
}

/**
 * 格式化消息内容
 */
function formatMessage(data) {
    const time = new Date().toLocaleString('zh-CN', { timeZone: 'Asia/Shanghai' });
    
    let message = `## 🎯 新的客户咨询\n\n`;
    message += `**时间：** ${time}\n\n`;
    message += `**姓名：** ${data.name}\n\n`;
    message += `**电话：** ${data.phone}\n\n`;
    
    if (data.wechat) {
        message += `**微信号：** ${data.wechat}\n\n`;
    }
    
    message += `**感兴趣产品：** ${data.interest}\n\n`;
    
    if (data.message) {
        message += `**留言备注：**\n${data.message}\n\n`;
    }
    
    message += `**来源页面：** [查看页面](${data.page})\n\n`;
    message += `---\n`;
    message += `<font color=\"warning\">请及时跟进联系客户</font>`;
    
    return message;
}

// API 路由：提交联系表单
app.post('/api/contact', async (req, res) => {
    try {
        const { name, phone, wechat, interest, message, page, source } = req.body;
        
        // 验证必填字段
        if (!name || !phone || !interest) {
            return res.status(400).json({
                success: false,
                message: '请填写必填字段'
            });
        }
        
        // 验证手机号格式
        const phoneRegex = /^1[3-9]\d{9}$/;
        if (!phoneRegex.test(phone)) {
            return res.status(400).json({
                success: false,
                message: '请输入正确的手机号'
            });
        }
        
        const data = { name, phone, wechat, interest, message, page, source };
        
        // 保存到本地
        const record = saveContact(data);
        
        // 发送到企业微信群机器人
        const messageContent = formatMessage(data);
        const wechatResult = await sendToWechatRobot(messageContent);
        
        if (!wechatResult.success) {
            console.error('Failed to send to WeChat robot:', wechatResult.error);
            // 即使发送到微信失败，也返回成功，因为数据已保存
        }
        
        res.json({
            success: true,
            message: '提交成功',
            data: { id: record.id }
        });
        
    } catch (error) {
        console.error('Contact API error:', error);
        res.status(500).json({
            success: false,
            message: '服务器错误，请稍后重试'
        });
    }
});

// 健康检查
app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// 启动服务器
app.listen(PORT, () => {
    console.log(`Contact API server running on port ${PORT}`);
    console.log(`Data directory: ${DATA_DIR}`);
    if (WECHAT_WEBHOOK_KEY === 'YOUR_WEBHOOK_KEY') {
        console.warn('⚠️  Warning: WECHAT_WEBHOOK_KEY not set. Please set the environment variable.');
    }
});

module.exports = app;
