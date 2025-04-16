const axios = require('axios');

// 设置OpenAI镜像API配置
const OPENAI_API_BASE_URL = process.env.OPENAI_API_BASE_URL || 'https://burn.hair/v1';
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const OPENAI_MODEL = process.env.OPENAI_MODEL || 'gpt-4o';

module.exports = async (req, res) => {
  // 只处理POST请求
  if (req.method !== 'POST') {
    return res.status(405).json({ error: '仅支持POST请求' });
  }

  try {
    const { messages, model, temperature, max_tokens, systemPrompt } = req.body;
    
    console.log(`发送请求到OpenAI API，消息数量: ${messages.length}`);
    console.log(`使用模型: ${model || OPENAI_MODEL}`);
    
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
      
      // 提取并返回AI回复
      const message = response.data.choices[0].message;
      return res.json({ message });
    } catch (apiError) {
      console.error('API请求错误详情:');
      if (apiError.response) {
        console.error('状态码:', apiError.response.status);
        console.error('响应数据:', JSON.stringify(apiError.response.data));
      } else if (apiError.request) {
        console.error('没有收到响应:', apiError.request);
      } else {
        console.error('请求错误:', apiError.message);
      }
      throw apiError;
    }
  } catch (error) {
    console.error('处理失败:', error);
    return res.status(500).json({ 
      error: '处理请求失败', 
      details: error.response?.data?.error?.message || error.message
    });
  }
}; 