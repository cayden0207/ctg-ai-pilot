import React from 'react';
import { Bot } from 'lucide-react';
import { cn } from '../utils/cn';
import { LLMProvider, getCurrentLLMProvider, setLLMProvider } from '../utils/openaiAPI';

interface LLMSelectorProps {
  className?: string;
}

export function LLMSelector({ className }: LLMSelectorProps) {
  const [selectedProvider, setSelectedProvider] = React.useState<LLMProvider>(getCurrentLLMProvider());

  const handleProviderChange = (provider: LLMProvider) => {
    setSelectedProvider(provider);
    setLLMProvider(provider);
  };

  const providers = [
    {
      id: 'openai' as LLMProvider,
      name: 'OpenAI',
      model: 'GPT-5',
      icon: Bot,
      color: 'from-green-500 to-green-600',
      description: '稳定可靠的选择'
    }
  ];

  return (
    <div className={cn("bg-white rounded-lg shadow-sm border border-gray-200 p-4", className)}>
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-medium text-gray-900">AI 模型选择</h3>
        <div className="flex items-center space-x-1">
          <div className="w-2 h-2 bg-green-500 rounded-full"></div>
          <span className="text-xs text-gray-500">在线</span>
        </div>
      </div>

      <div className="space-y-2">
        {providers.map((provider) => {
          const IconComponent = provider.icon;
          const isSelected = selectedProvider === provider.id;
          
          return (
            <button
              key={provider.id}
              onClick={() => handleProviderChange(provider.id)}
              className={cn(
                "w-full flex items-center justify-between p-3 rounded-lg border-2 transition-all duration-200",
                isSelected
                  ? "border-blue-500 bg-blue-50"
                  : "border-gray-200 hover:border-gray-300 hover:bg-gray-50"
              )}
            >
              <div className="flex items-center space-x-3">
                <div className={cn(
                  "w-8 h-8 rounded-lg flex items-center justify-center bg-gradient-to-r text-white",
                  provider.color
                )}>
                  <IconComponent className="w-4 h-4" />
                </div>
                <div className="text-left">
                  <div className="font-medium text-gray-900">{provider.name}</div>
                  <div className="text-xs text-gray-500">{provider.model}</div>
                </div>
              </div>
              
              <div className="text-right">
                <div className="text-xs text-gray-500">{provider.description}</div>
                {isSelected && (
                  <div className="flex items-center justify-end mt-1">
                    <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                    <span className="ml-1 text-xs text-blue-600">已选择</span>
                  </div>
                )}
              </div>
            </button>
          );
        })}
      </div>

      <div className="mt-3 p-2 bg-amber-50 border border-amber-200 rounded-lg">
        <div className="flex items-start space-x-2">
          <div className="w-1 h-1 bg-amber-500 rounded-full mt-1.5"></div>
          <p className="text-xs text-amber-800">
            不同模型可能产生不同风格的爆款选题，建议对比测试效果
          </p>
        </div>
      </div>
    </div>
  );
} 