const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const axios = require('axios');
const multer = require('multer');
const fs = require('fs');
const path = require('path');
const { v4: uuidv4 } = require('uuid');
require('dotenv').config();

const app = express();
const port = process.env.PORT || 5000;

// 中间件
app.use(cors());
app.use(bodyParser.json({ limit: '50mb' }));
app.use(bodyParser.urlencoded({ extended: true, limit: '50mb' }));

// 文件上传配置
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(__dirname, 'uploads');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniquePrefix = uuidv4();
    cb(null, `${uniquePrefix}-${file.originalname}`);
  }
});

const upload = multer({ 
  storage,
  limits: { fileSize: 10 * 1024 * 1024 } // 10MB限制
});

// 设置OpenAI镜像API配置
const OPENAI_API_BASE_URL = 'https://burn.hair/v1';
const OPENAI_API_KEY = 'sk-af9MVTQd8qykJbhe0c9686E8A35640B18f2b1786D308C5C3';
// 尝试几种可能的模型名称格式
const OPENAI_MODEL = 'gpt-4o'; // 可能是gpt-4o而不是4o

// ChatGPT API路由
app.post('/api/chat', async (req, res) => {
  try {
    const { messages, model, temperature, max_tokens, systemPrompt } = req.body;
    
    console.log(`发送请求到镜像API，消息数量: ${messages.length}`);
    console.log(`使用模型: ${model || OPENAI_MODEL}`);
    console.log(`温度: ${temperature !== undefined ? temperature : 0.7}`);
    console.log(`最大令牌数: ${max_tokens || 2000}`);
    
    // 规范化请求消息
    let formattedMessages = messages.map(msg => ({
      role: msg.role === 'assistant' ? 'assistant' : 'user',
      content: msg.content
    }));
    
    // 如果有系统提示，添加到消息开头
    if (systemPrompt) {
      formattedMessages = [
        { role: 'system', content: systemPrompt },
        ...formattedMessages
      ];
    }
    
    // 使用配置的镜像API和密钥
    try {
      const response = await axios.post(
        `${OPENAI_API_BASE_URL}/chat/completions`,
        {
          model: model || OPENAI_MODEL,
          messages: formattedMessages,
          temperature: temperature !== undefined ? temperature : 0.7,
          max_tokens: max_tokens || 2000
        },
        {
          headers: {
            'Authorization': `Bearer ${OPENAI_API_KEY}`,
            'Content-Type': 'application/json',
          },
          timeout: 60000 // 60秒超时
        }
      );
      
      console.log('API响应状态:', response.status);
      
      // 提取并返回AI回复
      const message = response.data.choices[0].message;
      return res.json({ message });
    } catch (apiError) {
      console.error('API请求错误详情:');
      if (apiError.response) {
        // 服务器响应了错误状态码
        console.error('状态码:', apiError.response.status);
        console.error('响应头:', JSON.stringify(apiError.response.headers));
        console.error('响应数据:', JSON.stringify(apiError.response.data));
      } else if (apiError.request) {
        // 请求发出但没有收到响应
        console.error('没有收到响应:', apiError.request);
      } else {
        // 设置请求时发生的错误
        console.error('请求错误:', apiError.message);
      }
      throw apiError;
    }
  } catch (error) {
    console.error('处理失败的完整错误:', error);
    return res.status(500).json({ 
      error: '处理请求失败', 
      details: error.response?.data?.error?.message || error.message,
      fullError: error.response ? JSON.stringify(error.response.data) : error.message
    });
  }
});

// 文件上传处理
app.post('/api/upload', upload.single('file'), (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: '未提供文件' });
    }

    // 读取文件内容
    const filePath = req.file.path;
    const fileName = req.file.filename;
    const originalName = req.file.originalname;
    
    // 如果是文本文件，尝试读取内容
    let fileContent = null;
    const textExtensions = ['.txt', '.md', '.csv', '.json', '.html', '.js', '.py', '.css'];
    const fileExt = path.extname(originalName).toLowerCase();
    
    if (textExtensions.includes(fileExt)) {
      try {
        fileContent = fs.readFileSync(filePath, 'utf8');
      } catch (readError) {
        console.error('读取文件内容失败:', readError);
      }
    }
    
    res.json({
      success: true,
      file: {
        name: fileName,
        originalName,
        path: filePath,
        size: req.file.size,
        type: req.file.mimetype,
        content: fileContent
      }
    });
  } catch (error) {
    console.error('文件上传失败:', error);
    res.status(500).json({ 
      error: '文件上传失败', 
      details: error.message 
    });
  }
});

// 健康检查端点
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'API服务器正常运行' });
});

// 测试镜像API端点
app.get('/api/test-mirror', async (req, res) => {
  try {
    const response = await axios.get(
      `${OPENAI_API_BASE_URL}/models`,
      {
        headers: {
          'Authorization': `Bearer ${OPENAI_API_KEY}`,
        },
      }
    );
    res.json({ success: true, models: response.data });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      error: error.message,
      details: error.response?.data
    });
  }
});

// 启动服务器
app.listen(port, () => {
  console.log(`API服务器运行在端口 ${port}`);
  console.log(`使用API基础URL: ${OPENAI_API_BASE_URL}`);
  console.log(`使用默认模型: ${OPENAI_MODEL}`);
}); 