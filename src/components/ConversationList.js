import React, { useState } from 'react';
import { format } from 'date-fns';
import { PencilIcon, TrashIcon, ArrowDownTrayIcon, CheckIcon, XMarkIcon } from '@heroicons/react/24/outline';
import { saveAs } from 'file-saver';

const ConversationList = ({ 
  conversations, 
  currentConversation, 
  onSelectConversation,
  onDeleteConversation,
  onRenameConversation,
  onExportConversation,
  messages
}) => {
  const [editingId, setEditingId] = useState(null);
  const [newTitle, setNewTitle] = useState('');

  // 处理重命名开始
  const handleStartRename = (conversation) => {
    setEditingId(conversation.id);
    setNewTitle(conversation.title || '新对话');
  };

  // 处理重命名取消
  const handleCancelRename = () => {
    setEditingId(null);
    setNewTitle('');
  };

  // 处理重命名保存
  const handleSaveRename = (id) => {
    if (newTitle.trim()) {
      onRenameConversation(id, newTitle.trim());
    }
    setEditingId(null);
    setNewTitle('');
  };

  // 处理导出对话
  const handleExport = (conversation) => {
    if (onExportConversation) {
      onExportConversation(conversation.id);
    } else {
      // 默认导出为JSON格式
      const conversationMessages = messages.filter(msg => msg.conversation_id === conversation.id);
      const exportData = {
        id: conversation.id,
        title: conversation.title || '新对话',
        created_at: conversation.created_at,
        messages: conversationMessages
      };
      
      const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
      saveAs(blob, `对话_${conversation.title || '新对话'}_${format(new Date(), 'yyyyMMdd_HHmmss')}.json`);
    }
  };

  if (conversations.length === 0) {
    return (
      <div className="text-center text-gray-500 dark:text-gray-400 py-4">
        没有对话记录
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {conversations.map((conversation) => (
        <div
          key={conversation.id}
          className={`p-2 rounded-md ${
            editingId === conversation.id
              ? 'bg-gray-100 dark:bg-gray-700'
              : currentConversation?.id === conversation.id
              ? 'bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200'
              : 'hover:bg-gray-200 dark:hover:bg-gray-700 cursor-pointer'
          }`}
        >
          {editingId === conversation.id ? (
            // 编辑模式
            <div className="flex items-center">
              <input
                type="text"
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                className="flex-1 p-1 mr-2 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-200"
                autoFocus
              />
              <button
                onClick={() => handleSaveRename(conversation.id)}
                className="p-1 text-green-600 dark:text-green-400 hover:text-green-800 dark:hover:text-green-300"
                title="保存"
              >
                <CheckIcon className="h-4 w-4" />
              </button>
              <button
                onClick={handleCancelRename}
                className="p-1 text-red-600 dark:text-red-400 hover:text-red-800 dark:hover:text-red-300"
                title="取消"
              >
                <XMarkIcon className="h-4 w-4" />
              </button>
            </div>
          ) : (
            // 显示模式
            <div>
              <div 
                className="text-sm font-medium truncate mb-1 cursor-pointer" 
                onClick={() => onSelectConversation(conversation)}
              >
                {conversation.title || '新对话'}
              </div>
              <div className="flex items-center justify-between">
                <div className="text-xs text-gray-500 dark:text-gray-400">
                  {format(new Date(conversation.created_at), 'yyyy-MM-dd HH:mm')}
                </div>
                <div className="flex space-x-1">
                  <button
                    onClick={() => handleStartRename(conversation)}
                    className="p-1 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"
                    title="重命名"
                  >
                    <PencilIcon className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => handleExport(conversation)}
                    className="p-1 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"
                    title="导出对话"
                  >
                    <ArrowDownTrayIcon className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => onDeleteConversation(conversation.id)}
                    className="p-1 text-red-500 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300"
                    title="删除"
                  >
                    <TrashIcon className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      ))}
    </div>
  );
};

export default ConversationList; 