# ChatGPT聊天应用

这是一个使用React和Supabase构建的聊天应用，集成了ChatGPT API。

## 功能特点

- 用户认证（注册/登录）
- 多对话管理
- 实时聊天界面
- 与ChatGPT API集成
- 响应式设计（适配移动端和桌面端）

## 技术栈

- 前端：React、React Router、TailwindCSS
- 后端：Supabase（认证、数据库、实时API）
- API：ChatGPT API（通过Express服务器代理）

## 项目结构

```
chatgpt-app/
├── public/               # 静态文件
├── src/                  # 前端源代码
│   ├── components/       # 可复用组件
│   ├── pages/            # 页面组件
│   └── utils/            # 工具和服务
├── server/               # API服务器代码
└── .env                  # 环境变量
```

## 安装与运行

### 前端

1. 安装依赖：
   ```
   npm install
   ```

2. 启动开发服务器：
   ```
   npm start
   ```

### API服务器

1. 进入server目录：
   ```
   cd server
   ```

2. 安装依赖：
   ```
   npm install
   ```

3. 设置环境变量：
   - 复制`.env`文件并填入您的OpenAI API密钥

4. 启动服务器：
   ```
   npm run dev
   ```

## 使用方法

1. 注册或登录账户
2. 创建新对话或选择现有对话
3. 输入消息并与ChatGPT进行交流

## 注意事项

- 您需要拥有OpenAI API密钥才能使用ChatGPT功能
- 将您的API密钥设置在`.env`文件中的`OPENAI_API_KEY`变量中
- 本应用使用Supabase的免费计划，有一定的使用限制

## 许可证

MIT 