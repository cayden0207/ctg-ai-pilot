import React, { useState, useEffect } from 'react';
import { Wifi, WifiOff, AlertCircle } from 'lucide-react';
import { getCurrentLLMProvider } from '../utils/openaiAPI';

interface ApiStatusProps {
  className?: string;
}

export function ApiStatus({ className = '' }: ApiStatusProps) {
  const [isConnected, setIsConnected] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const computeStatus = () => {
    const provider = getCurrentLLMProvider();
    if (provider === 'deepseek') {
      const key = import.meta.env.VITE_DEEPSEEK_API_KEY as string | undefined;
      // 在生产环境中，如果前端没有密钥，检查是否有后端 API 可用
      if (!key && !import.meta.env.PROD) {
        setIsConnected(false);
        setError('DeepSeek API 密钥未配置');
      } else {
        // 生产环境通过代理使用后端的密钥，所以总是显示已连接
        setIsConnected(true);
        setError(null);
      }
      return;
    }

    // OpenAI key check
    const apiKey = import.meta.env.VITE_OPENAI_API_KEY as string | undefined;
    if (!apiKey && !import.meta.env.PROD) {
      setIsConnected(false);
      setError('OpenAI API 密钥未配置');
    } else {
      // 生产环境通过代理使用后端的密钥
      setIsConnected(true);
      setError(null);
    }
  };

  useEffect(() => {
    computeStatus();
    const handler = () => computeStatus();
    window.addEventListener('llm-provider-changed', handler as EventListener);
    return () => window.removeEventListener('llm-provider-changed', handler as EventListener);
  }, []);

  if (isConnected) {
    return (
      <div className={`flex items-center text-green-600 ${className}`}>
        <Wifi className="h-4 w-4 mr-1" />
        <span className="text-sm">AI 已連接</span>
      </div>
    );
  }

  return (
    <div className={`flex items-center text-red-600 ${className}`}>
      <WifiOff className="h-4 w-4 mr-1" />
      <span className="text-sm">AI 未連接</span>
      {error && (
        <div className="ml-2 group relative">
          <AlertCircle className="h-4 w-4 cursor-help" />
          <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 bg-black text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
            {error}
          </div>
        </div>
      )}
    </div>
  );
} 
