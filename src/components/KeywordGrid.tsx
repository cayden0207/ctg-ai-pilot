import React from 'react';
import { RefreshCw, Lock, Check, ChevronRight } from 'lucide-react';
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
    <div className="card flex flex-col h-full overflow-hidden group hover:ring-1 hover:ring-primary-200 transition-all duration-300">
      {/* Header */}
      <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
        <div className="flex items-center gap-2">
          <div className={cn(
            "w-2 h-2 rounded-full",
            title.includes("Domain") ? "bg-blue-500" :
            title.includes("Who") ? "bg-purple-500" : "bg-rose-500"
          )} />
          <h3 className="font-semibold text-gray-900">{title}</h3>
        </div>
        {onRefresh && (
          <button
            onClick={onRefresh}
            disabled={isLoading}
            className={cn(
              "p-1.5 rounded-lg transition-all duration-200",
              isLoading
                ? "text-gray-300 cursor-not-allowed"
                : "text-gray-400 hover:text-primary-600 hover:bg-white hover:shadow-sm"
            )}
            title="刷新关键词"
          >
            <RefreshCw className={cn("h-4 w-4", isLoading && "animate-spin")} />
          </button>
        )}
      </div>

      {/* Content Area */}
      <div className="p-5 flex-1 bg-white">
        {/* 3x3 Layout */}
        <div className="grid grid-cols-3 gap-3 h-full min-h-[240px]">
          {/* Top Row */}
          {[0, 1, 2].map(idx => (
            <KeywordCell
              key={idx}
              keyword={keywords[idx]}
              onKeywordClick={onKeywordClick}
              onKeywordToggle={onKeywordToggle}
              isLoading={isLoading}
            />
          ))}

          {/* Middle Row (Left) */}
          <KeywordCell
            keyword={keywords[3]}
            onKeywordClick={onKeywordClick}
            onKeywordToggle={onKeywordToggle}
            isLoading={isLoading}
          />
          
          {/* Center Cell (The Core) */}
          <div className="relative flex items-center justify-center bg-gray-900 rounded-xl shadow-inner overflow-hidden group/center">
            <div className="absolute inset-0 bg-gradient-to-br from-gray-800 to-gray-900 z-0" />
            {/* Animated Glow */}
            <div className="absolute inset-0 opacity-30 bg-gradient-to-r from-transparent via-primary-500/20 to-transparent -translate-x-full group-hover/center:translate-x-full transition-transform duration-1000" />
            
            <div className="relative z-10 w-full px-2 text-center">
              {showInput ? (
                <input
                  type="text"
                  value={inputValue}
                  onChange={(e) => onInputChange?.(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="输入主题"
                  className="w-full bg-transparent text-white text-sm font-medium text-center placeholder-gray-500 outline-none focus:placeholder-gray-700"
                />
              ) : (
                <span className="text-sm font-bold text-white tracking-wide">{centerValue}</span>
              )}
            </div>
          </div>

          {/* Middle Row (Right) */}
          <KeywordCell
            keyword={keywords[4]}
            onKeywordClick={onKeywordClick}
            onKeywordToggle={onKeywordToggle}
            isLoading={isLoading}
          />

          {/* Bottom Row */}
          {[5, 6, 7].map(idx => (
            <KeywordCell
              key={idx}
              keyword={keywords[5 + (idx - 5)]}
              onKeywordClick={onKeywordClick}
              onKeywordToggle={onKeywordToggle}
              isLoading={isLoading}
            />
          ))}
        </div>
        
        {/* Error Toast */}
        {error && (
          <div className="mt-3 px-3 py-2 bg-rose-50 border border-rose-100 rounded-lg flex items-center gap-2 text-xs text-rose-600 animate-fade-in">
            <div className="w-1.5 h-1.5 rounded-full bg-rose-500" />
            {error}
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
  if (isLoading) {
    return (
      <div className="h-full min-h-[60px] rounded-xl bg-gray-50 border border-gray-100 animate-pulse flex items-center justify-center">
        <div className="w-1/2 h-2 bg-gray-200 rounded-full" />
      </div>
    );
  }

  if (!keyword) {
    return (
      <div className="h-full min-h-[60px] rounded-xl bg-gray-50/50 border border-dashed border-gray-200 flex items-center justify-center">
        <span className="text-gray-300 text-lg">·</span>
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
    <button
      className={cn(
        "relative h-full min-h-[60px] w-full px-2 py-1 rounded-xl text-xs font-medium transition-all duration-200 flex items-center justify-center text-center break-words select-none",
        // Default State
        "bg-white border border-gray-200 text-gray-600 hover:border-gray-300 hover:shadow-sm hover:-translate-y-0.5",
        // Selected State
        keyword.isSelected && "bg-primary-50 border-primary-500 text-primary-700 shadow-sm ring-1 ring-primary-200 z-10",
        // Locked State
        keyword.isLocked && "bg-amber-50 border-amber-400 text-amber-800",
        // Combined Locked & Selected
        keyword.isSelected && keyword.isLocked && "bg-amber-100 border-primary-500 text-primary-900"
      )}
      onClick={handleClick}
      onContextMenu={handleRightClick}
      title={keyword.isLocked ? "已锁定 (右键解锁)" : "左键选择，右键锁定"}
    >
      {keyword.value}
      
      {/* Corner Indicators */}
      <div className="absolute top-1 right-1 flex gap-0.5">
        {keyword.isLocked && <Lock className="w-3 h-3 text-amber-500" />}
        {keyword.isSelected && <Check className="w-3 h-3 text-primary-500" />}
      </div>
    </button>
  );
}