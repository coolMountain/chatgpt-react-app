import React, { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { oneDark, oneLight } from 'react-syntax-highlighter/dist/esm/styles/prism';
import remarkGfm from 'remark-gfm';
import { format } from 'date-fns';
import { useTheme } from '../contexts/ThemeContext';
import { 
  ClipboardIcon, 
  ClipboardDocumentCheckIcon,
  PencilIcon,
  CheckIcon,
  XMarkIcon,
  TrashIcon
} from '@heroicons/react/24/outline';
import TextareaAutosize from 'react-textarea-autosize';
import TypewriterEffect from './TypewriterEffect';

const MessageBubble = ({ 
  message, 
  isUser, 
  onEdit, 
  onDeleteSubsequent,
  isLast,
  isNew = false
}) => {
  const { darkMode } = useTheme();
  const [copiedCode, setCopiedCode] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editedContent, setEditedContent] = useState(message.content);
  const [typingCompleted, setTypingCompleted] = useState(!isNew || isUser);

  // 复制代码到剪贴板
  const copyToClipboard = (code) => {
    navigator.clipboard.writeText(code).then(() => {
      setCopiedCode(code);
      setTimeout(() => setCopiedCode(null), 2000);
    });
  };
  
  // 开始编辑消息
  const handleStartEdit = () => {
    setEditedContent(message.content);
    setIsEditing(true);
  };
  
  // 取消编辑
  const handleCancelEdit = () => {
    setIsEditing(false);
    setEditedContent(message.content);
  };
  
  // 保存编辑
  const handleSaveEdit = () => {
    if (editedContent.trim() !== '') {
      onEdit(message.id, editedContent);
      setIsEditing(false);
    }
  };
  
  // 删除后续消息并重新生成
  const handleDeleteSubsequent = () => {
    if (window.confirm('这将删除此消息之后的所有消息，并基于编辑后的消息重新生成回复。确定要继续吗？')) {
      onDeleteSubsequent(message);
    }
  };
  
  // 处理打字效果完成
  const handleTypingComplete = () => {
    setTypingCompleted(true);
  };

  // 自定义渲染器组件
  const components = {
    // 代码块渲染
    code({ node, inline, className, children, ...props }) {
      const match = /language-(\w+)/.exec(className || '');
      const code = String(children).replace(/\n$/, '');
      
      return !inline && match ? (
        <div className="relative group">
          <div className="absolute right-2 top-2 opacity-0 group-hover:opacity-100 transition-opacity">
            <button
              onClick={() => copyToClipboard(code)}
              className="p-1 rounded bg-gray-700 text-white hover:bg-gray-600 transition-colors"
              title="复制代码"
            >
              {copiedCode === code ? (
                <ClipboardDocumentCheckIcon className="h-5 w-5 text-green-400" />
              ) : (
                <ClipboardIcon className="h-5 w-5" />
              )}
            </button>
          </div>
          <SyntaxHighlighter
            style={darkMode ? oneDark : oneLight}
            language={match[1]}
            PreTag="div"
            className="rounded-md !mt-0"
            showLineNumbers
            {...props}
          >
            {code}
          </SyntaxHighlighter>
        </div>
      ) : (
        <code className={`${className} rounded px-1 py-0.5 bg-gray-200 dark:bg-gray-700`} {...props}>
          {children}
        </code>
      );
    },
    // 表格渲染增强
    table({ node, ...props }) {
      return (
        <div className="overflow-x-auto my-4">
          <table className="w-full border-collapse border border-gray-300 dark:border-gray-700" {...props} />
        </div>
      );
    },
    thead({ node, ...props }) {
      return <thead className="bg-gray-100 dark:bg-gray-800" {...props} />;
    },
    th({ node, ...props }) {
      return <th className="border border-gray-300 dark:border-gray-700 px-4 py-2 text-left" {...props} />;
    },
    td({ node, ...props }) {
      return <td className="border border-gray-300 dark:border-gray-700 px-4 py-2" {...props} />;
    },
    // 其他元素增强
    p({ node, ...props }) {
      return <p className="mb-4 last:mb-0" {...props} />;
    },
    ul({ node, ...props }) {
      return <ul className="list-disc pl-6 mb-4 space-y-1" {...props} />;
    },
    ol({ node, ...props }) {
      return <ol className="list-decimal pl-6 mb-4 space-y-1" {...props} />;
    },
    li({ node, ...props }) {
      return <li className="mb-1" {...props} />;
    },
    blockquote({ node, ...props }) {
      return <blockquote className="border-l-4 border-gray-300 dark:border-gray-700 pl-4 py-1 text-gray-600 dark:text-gray-400 italic" {...props} />;
    },
    a({ node, ...props }) {
      return <a className="text-blue-600 dark:text-blue-400 hover:underline" target="_blank" rel="noopener noreferrer" {...props} />;
    },
  };

  return (
    <div className={`flex mb-4 ${isUser ? 'justify-end' : 'justify-start'}`}>
      <div
        className={`max-w-xs md:max-w-md lg:max-w-lg xl:max-w-xl p-3 rounded-lg ${
          isUser
            ? 'bg-blue-500 dark:bg-blue-600 text-white rounded-br-none'
            : 'bg-gray-200 dark:bg-gray-800 text-gray-800 dark:text-gray-200 rounded-bl-none'
        }`}
      >
        {isUser && isEditing ? (
          // 编辑模式 - 用户消息
          <div className="flex flex-col">
            <TextareaAutosize
              value={editedContent}
              onChange={(e) => setEditedContent(e.target.value)}
              className="w-full p-2 mb-2 text-sm text-gray-800 bg-white dark:bg-gray-700 dark:text-gray-200 rounded border border-gray-300 dark:border-gray-600 resize-none"
              minRows={2}
              maxRows={8}
              autoFocus
            />
            <div className="flex justify-end space-x-2">
              <button
                onClick={handleCancelEdit}
                className="p-1 text-blue-200 hover:text-white"
                title="取消"
              >
                <XMarkIcon className="h-5 w-5" />
              </button>
              <button
                onClick={handleSaveEdit}
                className="p-1 text-blue-200 hover:text-white"
                title="保存"
              >
                <CheckIcon className="h-5 w-5" />
              </button>
              {!isLast && (
                <button
                  onClick={handleDeleteSubsequent}
                  className="p-1 text-blue-200 hover:text-white"
                  title="保存并重新生成后续回复"
                >
                  <TrashIcon className="h-5 w-5" />
                </button>
              )}
            </div>
          </div>
        ) : isUser ? (
          // 显示模式 - 用户消息
          <div>
            <p className="text-sm whitespace-pre-wrap break-words">{message.content}</p>
            <div className="flex items-center justify-between">
              <div className={`text-xs mt-1 ${isUser ? 'text-blue-100' : 'text-gray-500 dark:text-gray-400'}`}>
                {format(new Date(message.created_at), 'HH:mm • yyyy-MM-dd')}
              </div>
              <button
                onClick={handleStartEdit}
                className="p-1 text-blue-200 hover:text-white transition-opacity"
                title="编辑消息"
              >
                <PencilIcon className="h-4 w-4" />
              </button>
            </div>
          </div>
        ) : (
          // 显示模式 - AI消息
          <div>
            {isNew && !typingCompleted ? (
              // 带打字效果的新回复
              <TypewriterEffect 
                content={message.content} 
                typingSpeed={15}
                markdownComponents={components}
                onTypingComplete={handleTypingComplete}
              />
            ) : (
              // 正常显示的回复
              <div className="prose dark:prose-invert prose-sm max-w-none">
                <ReactMarkdown 
                  children={message.content} 
                  remarkPlugins={[remarkGfm]} 
                  components={components}
                />
              </div>
            )}
            <div className={`text-xs mt-1 ${isUser ? 'text-blue-100' : 'text-gray-500 dark:text-gray-400'}`}>
              {format(new Date(message.created_at), 'HH:mm • yyyy-MM-dd')}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default MessageBubble; 