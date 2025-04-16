import React, { useState, useEffect, useRef } from 'react';
import ReactMarkdown from 'react-markdown';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { oneDark, oneLight } from 'react-syntax-highlighter/dist/esm/styles/prism';
import remarkGfm from 'remark-gfm';
import { useTheme } from '../contexts/ThemeContext';
import { ClipboardIcon, ClipboardDocumentCheckIcon } from '@heroicons/react/24/outline';

const TypewriterEffect = ({ 
  content, 
  typingSpeed = 10, 
  markdownComponents,
  onTypingComplete
}) => {
  const [displayedContent, setDisplayedContent] = useState('');
  const [isTyping, setIsTyping] = useState(true);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [copiedCode, setCopiedCode] = useState(null);
  const contentRef = useRef(content);
  const { darkMode } = useTheme();
  
  // 复制代码到剪贴板
  const copyToClipboard = (code) => {
    navigator.clipboard.writeText(code).then(() => {
      setCopiedCode(code);
      setTimeout(() => setCopiedCode(null), 2000);
    });
  };
  
  // 定义Markdown渲染器
  const components = markdownComponents || {
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

  // 处理内容变化
  useEffect(() => {
    contentRef.current = content;
    setDisplayedContent('');
    setCurrentIndex(0);
    setIsTyping(true);
  }, [content]);

  // 打字效果
  useEffect(() => {
    if (!isTyping || currentIndex >= contentRef.current.length) {
      if (currentIndex >= contentRef.current.length && onTypingComplete) {
        onTypingComplete();
      }
      return;
    }

    // 用于处理代码块更平滑的显示
    const isInCodeBlock = () => {
      const textSoFar = contentRef.current.substring(0, currentIndex);
      const codeBlockStarts = (textSoFar.match(/```/g) || []).length;
      return codeBlockStarts % 2 !== 0;
    };

    // 如果在代码块中，加快速度或一次性显示多个字符
    const inCodeBlock = isInCodeBlock();
    const charsToAdd = inCodeBlock ? 10 : 1; // 代码块中每次添加10个字符
    const delayMultiplier = inCodeBlock ? 0.5 : 1; // 代码块中打字速度加快
    
    const timer = setTimeout(() => {
      const nextIndex = Math.min(currentIndex + charsToAdd, contentRef.current.length);
      setDisplayedContent(contentRef.current.substring(0, nextIndex));
      setCurrentIndex(nextIndex);
    }, typingSpeed * delayMultiplier);

    return () => clearTimeout(timer);
  }, [isTyping, currentIndex, typingSpeed, onTypingComplete]);

  // 完成打字
  const handleCompleteTyping = () => {
    setDisplayedContent(contentRef.current);
    setCurrentIndex(contentRef.current.length);
    setIsTyping(false);
    if (onTypingComplete) {
      onTypingComplete();
    }
  };

  return (
    <div className="typewriter-container">
      <div className="prose dark:prose-invert prose-sm max-w-none">
        <ReactMarkdown 
          remarkPlugins={[remarkGfm]} 
          components={components}
        >
          {displayedContent || ' '}
        </ReactMarkdown>
      </div>
      
      {isTyping && (
        <div className="flex items-center justify-between mt-2">
          <div className="typewriter-cursor inline-block w-2 h-4 bg-gray-500 dark:bg-gray-300 animate-pulse"></div>
          <button 
            onClick={handleCompleteTyping}
            className="text-xs text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 bg-gray-200 dark:bg-gray-700 px-2 py-1 rounded"
          >
            显示全部
          </button>
        </div>
      )}
    </div>
  );
};

export default TypewriterEffect; 