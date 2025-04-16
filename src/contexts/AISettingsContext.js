import React, { createContext, useState, useContext, useEffect } from 'react';

// 创建上下文
const AISettingsContext = createContext({
  model: 'gpt-4o',
  temperature: 0.7,
  maxTokens: 2000,
  systemPrompt: '',
  setModel: () => {},
  setTemperature: () => {},
  setMaxTokens: () => {},
  setSystemPrompt: () => {},
});

// 可用模型列表
export const AVAILABLE_MODELS = [
  { id: 'gpt-4o', name: 'GPT-4o' },
  { id: 'gpt-4', name: 'GPT-4' },
  { id: 'gpt-3.5-turbo', name: 'GPT-3.5 Turbo' },
];

// 上下文提供者组件
export const AISettingsProvider = ({ children }) => {
  // 从本地存储初始化设置
  const [model, setModel] = useState(() => {
    return localStorage.getItem('aiModel') || 'gpt-4o';
  });
  
  const [temperature, setTemperature] = useState(() => {
    const savedTemp = localStorage.getItem('aiTemperature');
    return savedTemp ? parseFloat(savedTemp) : 0.7;
  });
  
  const [maxTokens, setMaxTokens] = useState(() => {
    const savedTokens = localStorage.getItem('aiMaxTokens');
    return savedTokens ? parseInt(savedTokens) : 2000;
  });
  
  const [systemPrompt, setSystemPrompt] = useState(() => {
    return localStorage.getItem('aiSystemPrompt') || '';
  });

  // 当设置改变时，保存到本地存储
  useEffect(() => {
    localStorage.setItem('aiModel', model);
  }, [model]);

  useEffect(() => {
    localStorage.setItem('aiTemperature', temperature.toString());
  }, [temperature]);

  useEffect(() => {
    localStorage.setItem('aiMaxTokens', maxTokens.toString());
  }, [maxTokens]);

  useEffect(() => {
    localStorage.setItem('aiSystemPrompt', systemPrompt);
  }, [systemPrompt]);

  // 提供上下文值
  const contextValue = {
    model,
    temperature,
    maxTokens,
    systemPrompt,
    setModel,
    setTemperature,
    setMaxTokens,
    setSystemPrompt,
  };

  return (
    <AISettingsContext.Provider value={contextValue}>
      {children}
    </AISettingsContext.Provider>
  );
};

// 自定义钩子，方便在组件中使用AI设置上下文
export const useAISettings = () => {
  return useContext(AISettingsContext);
}; 