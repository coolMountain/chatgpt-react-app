// 健康检查API端点
module.exports = async (req, res) => {
  // 提供API健康状态
  res.status(200).json({
    status: 'ok',
    message: 'API服务运行正常',
    timestamp: new Date().toISOString()
  });
}; 