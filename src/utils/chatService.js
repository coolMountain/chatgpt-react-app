import { supabase } from './supabaseClient';

// 创建新的对话
export const createConversation = async (userId, title = '新对话') => {
  const { data, error } = await supabase
    .from('conversations')
    .insert([{ user_id: userId, title }])
    .select('*')
    .single();

  if (error) throw error;
  return data;
};

// 获取用户所有对话
export const getConversations = async (userId) => {
  const { data, error } = await supabase
    .from('conversations')
    .select('*')
    .eq('user_id', userId)
    .order('updated_at', { ascending: false });

  if (error) throw error;
  return data;
};

// 获取特定对话的所有消息
export const getMessages = async (conversationId) => {
  const { data, error } = await supabase
    .from('messages')
    .select('*')
    .eq('conversation_id', conversationId)
    .order('created_at', { ascending: true });

  if (error) throw error;
  return data;
};

// 添加新消息到对话
export const addMessage = async (conversationId, role, content) => {
  const { data, error } = await supabase
    .from('messages')
    .insert([{ conversation_id: conversationId, role, content }])
    .select('*')
    .single();

  if (error) throw error;
  
  // 更新对话的updated_at时间
  await supabase
    .from('conversations')
    .update({ updated_at: new Date() })
    .eq('id', conversationId);
    
  return data;
};

// 调用ChatGPT API
export const callChatGPT = async (messages) => {
  try {
    // 这里会调用我们的后端函数，该函数将中继到OpenAI API
    const response = await fetch('/api/chat', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ messages }),
    });
    
    if (!response.ok) {
      throw new Error(`API调用失败: ${response.status}`);
    }
    
    const data = await response.json();
    return data.message;
  } catch (error) {
    console.error('调用ChatGPT API出错:', error);
    throw error;
  }
};

// 更新消息内容
export const updateMessage = async (messageId, newContent) => {
  try {
    const { data, error } = await supabase
      .from('messages')
      .update({ content: newContent })
      .eq('id', messageId)
      .select();

    if (error) throw error;
    return data[0];
  } catch (error) {
    console.error('更新消息失败:', error);
    throw error;
  }
};

// 删除消息之后的所有消息
export const deleteMessagesAfter = async (conversationId, messageTimestamp) => {
  try {
    const { error } = await supabase
      .from('messages')
      .delete()
      .eq('conversation_id', conversationId)
      .gt('created_at', messageTimestamp);

    if (error) throw error;
    return true;
  } catch (error) {
    console.error('删除后续消息失败:', error);
    throw error;
  }
}; 