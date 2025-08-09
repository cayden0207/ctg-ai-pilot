import React from 'react';
import { RefreshCw, Lock, Check } from 'lucide-react';
import { cn } from '../utils/cn';
import { Keyword } from '../types';

interface KeywordGridProps {
  title: string;
  centerValue: string;
  keywords: Keyword[];
  isLoading: boolean;
  showInput?: boolean;
  inputValue?: string;
  error?: string | null;
  onInputChange?: (value: string) => void;
  onInputSubmit?: () => void;
  onRefresh?: () => void;
  onKeywordClick?: (keyword: Keyword) => void;
  onKeywordToggle?: (keyword: Keyword, mode: 'select' | 'lock') => void;
}

export function KeywordGrid({
  title,
  centerValue,
  keywords,
  isLoading,
  showInput = false,
  inputValue = '',
  error,
  onInputChange,
  onInputSubmit,
  onRefresh,
  onKeywordClick,
  onKeywordToggle
}: KeywordGridProps) {
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && onInputSubmit) {
      onInputSubmit();
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-gray-50 to-gray-100 px-4 py-3 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
          {onRefresh && (
            <button
              onClick={onRefresh}
              disabled={isLoading}
              className={cn(
                "p-2 rounded-lg transition-all duration-200",
                isLoading
                  ? "text-gray-300 cursor-not-allowed"
                  : "text-gray-500 hover:text-gray-700 hover:bg-gray-200"
              )}
              title="刷新关键词"
            >
              <RefreshCw className={cn("h-4 w-4", isLoading && "animate-spin")} />
            </button>
          )}
        </div>
      </div>

      {/* Grid */}
      <div className="p-4">
        <div className="keyword-grid">
          {/* Top row */}
          <KeywordCell
            keyword={keywords[0]}
            onKeywordClick={onKeywordClick}
            onKeywordToggle={onKeywordToggle}
            isLoading={isLoading}
          />
          <KeywordCell
            keyword={keywords[1]}
            onKeywordClick={onKeywordClick}
            onKeywordToggle={onKeywordToggle}
            isLoading={isLoading}
          />
          <KeywordCell
            keyword={keywords[2]}
            onKeywordClick={onKeywordClick}
            onKeywordToggle={onKeywordToggle}
            isLoading={isLoading}
          />

          {/* Middle row */}
          <KeywordCell
            keyword={keywords[3]}
            onKeywordClick={onKeywordClick}
            onKeywordToggle={onKeywordToggle}
            isLoading={isLoading}
          />
          
          {/* Center cell */}
          <div className="keyword-cell center">
            {showInput ? (
              <div className="w-full">
                <input
                  type="text"
                  value={inputValue}
                  onChange={(e) => onInputChange?.(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="输入主题..."
                  className="w-full text-sm text-center bg-transparent outline-none placeholder-gray-400"
                />
              </div>
            ) : (
              <span className="text-sm font-medium text-center">{centerValue}</span>
            )}
          </div>

          <KeywordCell
            keyword={keywords[4]}
            onKeywordClick={onKeywordClick}
            onKeywordToggle={onKeywordToggle}
            isLoading={isLoading}
          />

          {/* Bottom row */}
          <KeywordCell
            keyword={keywords[5]}
            onKeywordClick={onKeywordClick}
            onKeywordToggle={onKeywordToggle}
            isLoading={isLoading}
          />
          <KeywordCell
            keyword={keywords[6]}
            onKeywordClick={onKeywordClick}
            onKeywordToggle={onKeywordToggle}
            isLoading={isLoading}
          />
          <KeywordCell
            keyword={keywords[7]}
            onKeywordClick={onKeywordClick}
            onKeywordToggle={onKeywordToggle}
            isLoading={isLoading}
          />
        </div>
        
        {/* Error message */}
        {error && (
          <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-sm text-red-600">{error}</p>
          </div>
        )}
      </div>
    </div>
  );
}

interface KeywordCellProps {
  keyword?: Keyword;
  onKeywordClick?: (keyword: Keyword) => void;
  onKeywordToggle?: (keyword: Keyword, mode: 'select' | 'lock') => void;
  isLoading: boolean;
}

function KeywordCell({ keyword, onKeywordClick, onKeywordToggle, isLoading }: KeywordCellProps) {
  if (!keyword) {
    return (
      <div className="keyword-cell">
        {isLoading ? (
          <div className="animate-pulse bg-gray-200 h-4 w-16 rounded"></div>
        ) : (
          <span className="text-gray-300">-</span>
        )}
      </div>
    );
  }

  const handleClick = () => {
    if (onKeywordClick) {
      onKeywordClick(keyword);
    } else if (onKeywordToggle) {
      onKeywordToggle(keyword, 'select');
    }
  };

  const handleRightClick = (e: React.MouseEvent) => {
    e.preventDefault();
    if (onKeywordToggle) {
      onKeywordToggle(keyword, 'lock');
    }
  };

  return (
    <div
      className={cn(
        "keyword-cell relative group",
        keyword.isSelected && "selected",
        keyword.isLocked && "locked",
        !isLoading && "hover:shadow-sm"
      )}
      onClick={handleClick}
      onContextMenu={handleRightClick}
      title={keyword.isLocked ? "已锁定 (右键解锁)" : "左键选择，右键锁定"}
    >
      {isLoading ? (
        <div className="animate-pulse bg-gray-200 h-4 w-full rounded"></div>
      ) : (
        <>
          <span className="text-xs font-medium text-center leading-tight break-words">{keyword.value}</span>
          
          {/* Status indicators */}
          <div className="absolute top-1 right-1 flex space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
            {keyword.isLocked && (
              <Lock className="h-3 w-3 text-secondary-600" />
            )}
            {keyword.isSelected && (
              <Check className="h-3 w-3 text-primary-600" />
            )}
          </div>
        </>
      )}
    </div>
  );
} 