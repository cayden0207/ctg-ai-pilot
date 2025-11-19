import React from 'react';
import { Bot, Cpu } from 'lucide-react';
import { useMembership } from '../hooks/useMembership';
import { cn } from '../utils/cn';
import { getLLMConfig, setLLMModel } from '../utils/openaiAPI';

export function LLMSelector() {
  const [model, setModel] = React.useState(getLLMConfig().model);
  const { isAdmin } = useMembership();

  const handleModelChange = (newModel: 'gpt-4' | 'deepseek-chat') => {
    setLLMModel(newModel);
    setModel(newModel);
  };

  // 只有管理员才能看到这个选择器
  if (!isAdmin) return null;

  return (
    <div className="flex items-center bg-white rounded-lg p-1 border border-gray-200 shadow-sm">
      <button
        onClick={() => handleModelChange('gpt-4')}
        className={cn(
          "flex items-center px-3 py-1.5 rounded-md text-xs font-medium transition-all duration-200",
          model === 'gpt-4'
            ? "bg-primary-50 text-primary-700 shadow-sm ring-1 ring-primary-200"
            : "text-gray-500 hover:text-gray-900 hover:bg-gray-50"
        )}
      >
        <Bot className="w-3.5 h-3.5 mr-1.5" />
        GPT-4
      </button>
      <div className="w-px h-4 bg-gray-200 mx-1" />
      <button
        onClick={() => handleModelChange('deepseek-chat')}
        className={cn(
          "flex items-center px-3 py-1.5 rounded-md text-xs font-medium transition-all duration-200",
          model === 'deepseek-chat'
            ? "bg-primary-50 text-primary-700 shadow-sm ring-1 ring-primary-200"
            : "text-gray-500 hover:text-gray-900 hover:bg-gray-50"
        )}
      >
        <Cpu className="w-3.5 h-3.5 mr-1.5" />
        DeepSeek
      </button>
    </div>
  );
}