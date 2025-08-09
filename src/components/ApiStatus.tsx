import React, { useState, useEffect } from 'react';
import { Wifi, WifiOff, AlertCircle } from 'lucide-react';

interface ApiStatusProps {
  className?: string;
}

export function ApiStatus({ className = '' }: ApiStatusProps) {
  const [isConnected, setIsConnected] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // 檢查 OpenAI API 密鑰是否配置
    const apiKey = import.meta.env.VITE_OPENAI_API_KEY;
    if (!apiKey) {
      setIsConnected(false);
      setError('OpenAI API 密鑰未配置');
    } else if (!apiKey.startsWith('sk-')) {
      setIsConnected(false);
      setError('OpenAI API 密鑰格式不正確');
    } else {
      setIsConnected(true);
      setError(null);
    }
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