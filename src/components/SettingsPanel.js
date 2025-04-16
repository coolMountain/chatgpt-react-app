import React from 'react';
import { useAISettings, AVAILABLE_MODELS } from '../contexts/AISettingsContext';
import { useTheme } from '../contexts/ThemeContext';
import { SunIcon, MoonIcon } from '@heroicons/react/24/outline';

const SettingsPanel = ({ onClose }) => {
  const { 
    model, setModel, 
    temperature, setTemperature, 
    maxTokens, setMaxTokens, 
    systemPrompt, setSystemPrompt 
  } = useAISettings();
  
  const { darkMode, toggleDarkMode } = useTheme();

  return (
    <div className="p-4 bg-white dark:bg-gray-800 shadow-lg rounded-lg w-full max-w-md">
      <div className="flex justify-between mb-4">
        <h2 className="text-xl font-semibold text-gray-800 dark:text-white">设置</h2>
        <button 
          onClick={onClose}
          className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
        >
          &times;
        </button>
      </div>
      
      {/* 暗色模式切换 */}
      <div className="mb-4">
        <div className="flex justify-between items-center">
          <label className="text-gray-700 dark:text-gray-300 font-medium">
            暗色模式
          </label>
          <button
            onClick={toggleDarkMode}
            className="p-2 rounded-full bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300"
            aria-label={darkMode ? '切换到亮色模式' : '切换到暗色模式'}
          >
            {darkMode ? (
              <SunIcon className="h-5 w-5" />
            ) : (
              <MoonIcon className="h-5 w-5" />
            )}
          </button>
        </div>
      </div>
      
      {/* 模型选择 */}
      <div className="mb-4">
        <label 
          htmlFor="model-select" 
          className="block text-gray-700 dark:text-gray-300 font-medium mb-2"
        >
          选择模型
        </label>
        <select
          id="model-select"
          value={model}
          onChange={(e) => setModel(e.target.value)}
          className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300"
        >
          {AVAILABLE_MODELS.map((m) => (
            <option key={m.id} value={m.id}>
              {m.name}
            </option>
          ))}
        </select>
      </div>
      
      {/* 温度设置 */}
      <div className="mb-4">
        <label 
          htmlFor="temperature-slider" 
          className="block text-gray-700 dark:text-gray-300 font-medium mb-2"
        >
          温度: {temperature.toFixed(1)}
        </label>
        <input
          id="temperature-slider"
          type="range"
          min="0"
          max="2"
          step="0.1"
          value={temperature}
          onChange={(e) => setTemperature(parseFloat(e.target.value))}
          className="w-full"
        />
        <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400">
          <span>精确</span>
          <span>平衡</span>
          <span>创意</span>
        </div>
      </div>
      
      {/* 最大令牌设置 */}
      <div className="mb-4">
        <label 
          htmlFor="max-tokens-input" 
          className="block text-gray-700 dark:text-gray-300 font-medium mb-2"
        >
          最大令牌数
        </label>
        <input
          id="max-tokens-input"
          type="number"
          min="100"
          max="4000"
          step="100"
          value={maxTokens}
          onChange={(e) => setMaxTokens(parseInt(e.target.value))}
          className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300"
        />
      </div>
      
      {/* 系统提示设置 */}
      <div className="mb-4">
        <label 
          htmlFor="system-prompt-textarea" 
          className="block text-gray-700 dark:text-gray-300 font-medium mb-2"
        >
          系统提示词
        </label>
        <textarea
          id="system-prompt-textarea"
          value={systemPrompt}
          onChange={(e) => setSystemPrompt(e.target.value)}
          placeholder="设置默认的系统提示词..."
          rows="4"
          className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300"
        />
      </div>
    </div>
  );
};

export default SettingsPanel; 