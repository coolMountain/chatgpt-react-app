const multer = require('multer');
const fs = require('fs');
const path = require('path');
const { v4: uuidv4 } = require('uuid');

// 创建一个内存存储器，用于Vercel无文件系统环境
const memoryStorage = multer.memoryStorage();

// 添加基本配置
const MAX_FILE_SIZE = parseInt(process.env.MAX_FILE_SIZE || '10485760', 10); // 默认10MB

// 创建用于内存的上传中间件
const upload = multer({
  storage: memoryStorage,
  limits: { fileSize: MAX_FILE_SIZE }
});

// Vercel Serverless函数处理器
module.exports = async (req, res) => {
  // 只接受POST请求
  if (req.method !== 'POST') {
    return res.status(405).json({ error: '只支持POST请求' });
  }

  try {
    // 自定义处理文件上传
    const processFile = () => {
      return new Promise((resolve, reject) => {
        upload.single('file')(req, res, (err) => {
          if (err) {
            if (err.code === 'LIMIT_FILE_SIZE') {
              return reject({
                statusCode: 400,
                message: `文件大小超过限制，最大允许${MAX_FILE_SIZE / (1024 * 1024)}MB`
              });
            }
            return reject({ statusCode: 400, message: `上传错误: ${err.message}` });
          }
          
          if (!req.file) {
            return reject({ statusCode: 400, message: '未提供文件' });
          }
          
          resolve(req.file);
        });
      });
    };

    // 处理文件
    const file = await processFile();
    
    // 提取文件信息
    const buffer = file.buffer;
    const originalName = file.originalname;
    const mimeType = file.mimetype;
    const fileSize = file.size;
    
    // 为处理文本文件做准备
    let fileContent = null;
    const textExtensions = ['.txt', '.md', '.csv', '.json', '.html', '.js', '.py', '.css'];
    const fileExt = path.extname(originalName).toLowerCase();
    
    // 如果是文本文件，解析内容
    if (textExtensions.includes(fileExt)) {
      try {
        fileContent = buffer.toString('utf8');
      } catch (readError) {
        console.error('解析文件内容失败:', readError);
      }
    }
    
    // 响应文件信息和内容
    return res.status(200).json({
      success: true,
      file: {
        name: `${uuidv4()}-${originalName}`,
        originalName,
        size: fileSize,
        type: mimeType,
        content: fileContent
      }
    });
    
  } catch (error) {
    console.error('文件上传失败:', error);
    const statusCode = error.statusCode || 500;
    return res.status(statusCode).json({
      error: '文件上传处理失败',
      details: error.message
    });
  }
}; 