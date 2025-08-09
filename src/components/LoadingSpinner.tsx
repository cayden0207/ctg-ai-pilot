
import React from 'react';
import { cn } from '../utils/cn';

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export function LoadingSpinner({ size = 'md', className }: LoadingSpinnerProps) {
  const sizeClasses = {
    sm: 'h-4 w-4',
    md: 'h-6 w-6',
    lg: 'h-8 w-8'
  };

  return (
    <div className={cn("animate-spin rounded-full border-2 border-gray-300 border-t-primary-600", sizeClasses[size], className)} />
  );
}

interface LoadingOverlayProps {
  isVisible: boolean;
  message?: string;
}

export function LoadingOverlay({ isVisible, message = "正在处理..." }: LoadingOverlayProps) {
  if (!isVisible) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 shadow-xl">
        <div className="flex items-center space-x-4">
          <LoadingSpinner size="lg" />
          <span className="text-lg font-medium text-gray-900">{message}</span>
        </div>
      </div>
    </div>
  );
} 