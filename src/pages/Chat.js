import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '../utils/supabaseClient';
import { createConversation, getConversations, getMessages, addMessage, updateMessage, deleteMessagesAfter } from '../utils/chatService';
import MessageBubble from '../components/MessageBubble';
import ConversationList from '../components/ConversationList';
import SettingsPanel from '../components/SettingsPanel';
import TextareaAutosize from 'react-textarea-autosize';
import { useAISettings } from '../contexts/AISettingsContext';
import { useTheme } from '../contexts/ThemeContext';
import { toast } from 'react-toastify';
import { 
  Cog6ToothIcon, 
  PaperAirplaneIcon, 
  PlusIcon,
  ArrowUpOnSquareIcon,
  PaperClipIcon
} from '@heroicons/react/24/outline';

// 修改API URL配置，使用相对路径
const API_URL = process.env.REACT_APP_API_URL || '';

const Chat = ({ session }) => {
  const [conversations, setConversations] = useState([]);
  const [currentConversation, setCurrentConversation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [inputValue, setInputValue] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [showSettings, setShowSettings] = useState(false);
  const [uploadedFile, setUploadedFile] = useState(null);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);
  const fileInputRef = useRef(null);
  const [newMessageId, setNewMessageId] = useState(null);
  
  const { darkMode } = useTheme();
  const { 
    model, 
    temperature, 
    maxTokens, 
    systemPrompt
  } = useAISettings();

  // 获取对话列表
  useEffect(() => {
    const fetchConversations = async () => {
      try {
        const data = await getConversations(session.user.id);
        setConversations(data);
        
        // 如果有会话，选择第一个
        if (data.length > 0) {
          setCurrentConversation(data[0]);
        }
      } catch (error) {
        console.error('获取对话列表失败:', error);
        setError('获取对话列表失败');
        toast.error('获取对话列表失败');
      }
    };

    fetchConversations();
  }, [session]);

  // 当当前对话改变时，获取消息
  useEffect(() => {
    const fetchMessages = async () => {
      if (!currentConversation) return;
      
      try {
        const data = await getMessages(currentConversation.id);
        setMessages(data);
      } catch (error) {
        console.error('获取消息失败:', error);
        setError('获取消息失败');
        toast.error('获取消息失败');
      }
    };

    fetchMessages();
  }, [currentConversation]);

  // 滚动到底部
  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  // 创建新对话
  const handleNewConversation = async () => {
    try {
      const newConversation = await createConversation(session.user.id);
      setConversations([newConversation, ...conversations]);
      setCurrentConversation(newConversation);
      setMessages([]);
      inputRef.current?.focus();
    } catch (error) {
      console.error('创建新对话失败:', error);
      setError('创建新对话失败');
      toast.error('创建新对话失败');
    }
  };

  // 选择对话
  const handleSelectConversation = (conversation) => {
    setCurrentConversation(conversation);
  };
  
  // 删除对话
  const handleDeleteConversation = async (id) => {
    if (!window.confirm('确定要删除这个对话吗？')) return;
    
    try {
      // 从Supabase删除对话
      const { error } = await supabase
        .from('conversations')
        .delete()
        .eq('id', id);
        
      if (error) throw error;
      
      // 更新本地状态
      const updatedConversations = conversations.filter(conv => conv.id !== id);
      setConversations(updatedConversations);
      
      // 如果删除的是当前对话，切换到第一个对话或清空
      if (currentConversation?.id === id) {
        if (updatedConversations.length > 0) {
          setCurrentConversation(updatedConversations[0]);
        } else {
          setCurrentConversation(null);
          setMessages([]);
        }
      }
      
      toast.success('对话已删除');
    } catch (error) {
      console.error('删除对话失败:', error);
      toast.error('删除对话失败');
    }
  };
  
  // 重命名对话
  const handleRenameConversation = async (id, newTitle) => {
    try {
      // 更新Supabase中的对话标题
      const { error } = await supabase
        .from('conversations')
        .update({ title: newTitle })
        .eq('id', id);
        
      if (error) throw error;
      
      // 更新本地状态
      const updatedConversations = conversations.map(conv => 
        conv.id === id ? { ...conv, title: newTitle } : conv
      );
      setConversations(updatedConversations);
      
      // 如果重命名的是当前对话，更新当前对话
      if (currentConversation?.id === id) {
        setCurrentConversation({ ...currentConversation, title: newTitle });
      }
      
      toast.success('对话已重命名');
    } catch (error) {
      console.error('重命名对话失败:', error);
      toast.error('重命名对话失败');
    }
  };
  
  // 处理文件上传
  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    // 验证文件大小
    if (file.size > 10 * 1024 * 1024) {
      toast.error('文件大小超过10MB限制');
      return;
    }
    
    const formData = new FormData();
    formData.append('file', file);
    
    try {
      setLoading(true);
      
      const response = await fetch(`${API_URL}/api/upload`, {
        method: 'POST',
        body: formData,
      });
      
      if (!response.ok) {
        throw new Error(`上传失败: ${response.status}`);
      }
      
      const data = await response.json();
      setUploadedFile(data.file);
      
      // 如果是文本文件，添加到输入框
      if (data.file.content) {
        // 添加文件内容摘要到输入
        const summary = data.file.content.length > 500 
          ? data.file.content.substring(0, 500) + '...(内容已截断)'
          : data.file.content;
          
        setInputValue((prev) => {
          const fileDesc = `我上传了一个文件"${data.file.originalName}"，内容如下:\n\`\`\`\n${summary}\n\`\`\`\n\n请分析这个文件内容。`;
          return prev ? `${prev}\n\n${fileDesc}` : fileDesc;
        });
      } else {
        // 图片等非文本文件
        setInputValue((prev) => {
          const fileDesc = `我上传了一个${data.file.type}文件"${data.file.originalName}"（${(data.file.size / 1024).toFixed(2)}KB）。`;
          return prev ? `${prev}\n\n${fileDesc}` : fileDesc;
        });
      }
      
      toast.success('文件上传成功');
    } catch (error) {
      console.error('文件上传失败:', error);
      toast.error('文件上传失败: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  // 发送消息
  const handleSendMessage = async (e) => {
    e.preventDefault();
    
    if (!inputValue.trim() || loading) return;
    
    // 如果没有当前对话，创建一个新的
    if (!currentConversation) {
      await handleNewConversation();
    }
    
    setLoading(true);
    setError(null);
    
    try {
      // 添加用户消息
      const userMessage = await addMessage(currentConversation.id, 'user', inputValue);
      setMessages([...messages, userMessage]);
      setInputValue('');
      
      // 准备API调用
      const messagesForAPI = [
        ...messages.map(msg => ({ role: msg.role, content: msg.content })),
        { role: 'user', content: inputValue }
      ];
      
      // 实际调用ChatGPT API
      try {
        const response = await fetch(`${API_URL}/api/chat`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ 
            messages: messagesForAPI,
            model,
            temperature,
            max_tokens: maxTokens,
            systemPrompt
          }),
        });
        
        if (!response.ok) {
          throw new Error(`API调用失败: ${response.status}`);
        }
        
        const data = await response.json();
        
        // 添加助手消息
        const assistantMessage = await addMessage(
          currentConversation.id, 
          'assistant', 
          data.message.content
        );
        setMessages(prev => [...prev, assistantMessage]);
        // 设置新消息ID，用于激活打字效果
        setNewMessageId(assistantMessage.id);
        // 重置新消息ID（3秒后，确保打字效果充分显示）
        setTimeout(() => setNewMessageId(null), 3000);
        
        // 更新对话标题（如果是新对话）
        if (!currentConversation.title || currentConversation.title === '新对话') {
          // 根据对话内容生成标题
          const shortenedContent = inputValue.slice(0, 40) + (inputValue.length > 40 ? '...' : '');
          await handleRenameConversation(currentConversation.id, shortenedContent);
        }
      } catch (error) {
        console.error('处理AI响应失败:', error);
        setError('获取AI回复失败: ' + error.message);
        toast.error('获取AI回复失败');
      } finally {
        setLoading(false);
        setUploadedFile(null);
      }
      
    } catch (error) {
      console.error('发送消息失败:', error);
      setError('发送消息失败');
      toast.error('发送消息失败');
      setLoading(false);
    }
  };

  // 登出
  const handleSignOut = async () => {
    await supabase.auth.signOut();
  };

  // 切换设置面板显示
  const toggleSettings = () => {
    setShowSettings(!showSettings);
  };

  // 处理消息编辑
  const handleEditMessage = async (messageId, newContent) => {
    try {
      // 更新消息
      const updatedMessage = await updateMessage(messageId, newContent);
      
      // 更新本地消息列表
      setMessages(prev => 
        prev.map(msg => 
          msg.id === messageId ? { ...msg, content: newContent } : msg
        )
      );
      
      toast.success('消息已更新');
    } catch (error) {
      console.error('编辑消息失败:', error);
      toast.error('编辑消息失败');
    }
  };

  // 处理删除消息后的所有消息并重新生成
  const handleDeleteSubsequentAndRegenerate = async (message) => {
    if (!message || !currentConversation) return;
    
    setLoading(true);
    
    try {
      // 找到当前消息在数组中的索引
      const messageIndex = messages.findIndex(msg => msg.id === message.id);
      if (messageIndex === -1) return;
      
      // 删除此消息之后的所有消息
      await deleteMessagesAfter(currentConversation.id, message.created_at);
      
      // 更新本地消息列表，仅保留当前消息及之前的消息
      const remainingMessages = messages.slice(0, messageIndex + 1);
      setMessages(remainingMessages);
      
      // 准备API调用，重新生成回复
      const messagesForAPI = remainingMessages.map(msg => ({ 
        role: msg.role, 
        content: msg.content 
      }));
      
      // 调用ChatGPT API
      const response = await fetch(`${API_URL}/api/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          messages: messagesForAPI,
          model,
          temperature,
          max_tokens: maxTokens,
          systemPrompt
        }),
      });
      
      if (!response.ok) {
        throw new Error(`API调用失败: ${response.status}`);
      }
      
      const data = await response.json();
      
      // 添加助手消息
      const assistantMessage = await addMessage(
        currentConversation.id, 
        'assistant', 
        data.message.content
      );
      setMessages([...remainingMessages, assistantMessage]);
      // 设置新消息ID，用于激活打字效果
      setNewMessageId(assistantMessage.id);
      // 重置新消息ID（3秒后，确保打字效果充分显示）
      setTimeout(() => setNewMessageId(null), 3000);
      
      toast.success('已重新生成回复');
    } catch (error) {
      console.error('重新生成回复失败:', error);
      toast.error('重新生成回复失败: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-screen">
      <header className="flex items-center justify-between px-4 py-2 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
        <h1 className="text-xl font-bold">ChatGPT聊天应用</h1>
        <div className="flex items-center space-x-2">
          <button
            onClick={toggleSettings}
            className="p-2 text-gray-600 hover:text-gray-800 dark:text-gray-300 dark:hover:text-gray-100"
            title="设置"
          >
            <Cog6ToothIcon className="h-5 w-5" />
          </button>
          <button
            onClick={handleSignOut}
            className="px-3 py-1 text-sm text-white bg-red-500 rounded-md hover:bg-red-600"
          >
            登出
          </button>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden">
        {/* 侧边栏 */}
        <div className="hidden w-64 p-4 overflow-y-auto bg-gray-100 dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 md:block">
          <button
            onClick={handleNewConversation}
            className="flex items-center justify-center w-full px-3 py-2 mb-4 text-sm text-white bg-blue-600 rounded-md hover:bg-blue-700"
          >
            <PlusIcon className="h-4 w-4 mr-1" />
            新对话
          </button>
          
          <ConversationList
            conversations={conversations}
            currentConversation={currentConversation}
            onSelectConversation={handleSelectConversation}
            onDeleteConversation={handleDeleteConversation}
            onRenameConversation={handleRenameConversation}
            messages={messages}
          />
        </div>

        {/* 聊天区域 */}
        <div className="flex flex-col flex-1 bg-white dark:bg-gray-900">
          {/* 移动版菜单 */}
          <div className="flex items-center p-2 md:hidden">
            <button
              onClick={handleNewConversation}
              className="flex items-center px-3 py-1 mr-2 text-sm text-white bg-blue-600 rounded-md hover:bg-blue-700"
            >
              <PlusIcon className="h-4 w-4 mr-1" />
              新对话
            </button>
          </div>

          {/* 设置面板 */}
          {showSettings && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
              <SettingsPanel onClose={toggleSettings} />
            </div>
          )}

          {/* 消息区域 */}
          <div className="flex-1 p-4 overflow-y-auto">
            {messages.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-center text-gray-500 dark:text-gray-400">
                <p className="mb-4 text-lg">开始一个新的对话</p>
                <p className="text-sm">发送消息开始与ChatGPT对话</p>
              </div>
            ) : (
              messages.map((message, index) => (
                <MessageBubble
                  key={message.id}
                  message={message}
                  isUser={message.role === 'user'}
                  onEdit={handleEditMessage}
                  onDeleteSubsequent={handleDeleteSubsequentAndRegenerate}
                  isLast={index === messages.length - 1}
                  isNew={message.id === newMessageId}
                />
              ))
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* 错误提示 */}
          {error && (
            <div className="p-2 mx-4 mb-2 text-sm text-red-600 bg-red-100 dark:text-red-400 dark:bg-red-900/30 rounded-md">
              {error}
            </div>
          )}

          {/* 输入区域 */}
          <div className="p-4 border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
            <form onSubmit={handleSendMessage} className="flex flex-col space-y-2">
              <div className="relative">
                <TextareaAutosize
                  ref={inputRef}
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  disabled={loading}
                  placeholder="输入消息..."
                  className="w-full px-3 py-2 pr-10 max-h-60 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 resize-none"
                  minRows={2}
                  maxRows={8}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      handleSendMessage(e);
                    }
                  }}
                />
                <div className="absolute right-2 bottom-2 flex space-x-1">
                  <input
                    type="file"
                    ref={fileInputRef}
                    className="hidden"
                    onChange={handleFileUpload}
                  />
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={loading}
                    className="p-1 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300 disabled:opacity-50"
                    title="上传文件"
                  >
                    <PaperClipIcon className="h-5 w-5" />
                  </button>
                </div>
              </div>
              
              {uploadedFile && (
                <div className="text-xs text-gray-500 dark:text-gray-400">
                  已上传: {uploadedFile.originalName} ({(uploadedFile.size / 1024).toFixed(2)}KB)
                </div>
              )}
              
              <div className="flex justify-between items-center">
                <div className="text-xs text-gray-500 dark:text-gray-400">
                  使用模型: {model}
                </div>
                <button
                  type="submit"
                  disabled={loading || !inputValue.trim()}
                  className="flex items-center px-4 py-2 text-white bg-blue-600 rounded-md hover:bg-blue-700 disabled:bg-blue-300 dark:disabled:bg-blue-800 disabled:cursor-not-allowed transition-colors"
                >
                  {loading ? (
                    <span className="flex items-center">
                      <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      处理中...
                    </span>
                  ) : (
                    <>
                      <PaperAirplaneIcon className="h-4 w-4 mr-1" />
                      发送
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Chat; 