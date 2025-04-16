import React, { createContext, useState, useEffect, useContext } from 'react';

// 创建上下文
const ThemeContext = createContext({
  darkMode: false,
  toggleDarkMode: () => {},
});

// 主题提供者组件
export const ThemeProvider = ({ children }) => {
  // 从本地存储初始化暗色模式状态
  const [darkMode, setDarkMode] = useState(() => {
    const savedTheme = localStorage.getItem('theme');
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    return savedTheme ? savedTheme === 'dark' : prefersDark;
  });

  // 切换暗色模式
  const toggleDarkMode = () => {
    setDarkMode(!darkMode);
  };

  // 当暗色模式状态改变时，更新文档类和本地存储
  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  }, [darkMode]);

  // 提供上下文值
  const contextValue = {
    darkMode,
    toggleDarkMode,
  };

  return (
    <ThemeContext.Provider value={contextValue}>
      {children}
    </ThemeContext.Provider>
  );
};

// 自定义钩子，方便在组件中使用主题上下文
export const useTheme = () => {
  return useContext(ThemeContext);
}; 