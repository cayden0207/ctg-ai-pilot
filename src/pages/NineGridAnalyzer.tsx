import React, { useState, useCallback } from 'react';
import { RefreshCw, Lock, Unlock, Target, Zap, ChevronDown, ChevronUp, Sparkles, Info, Grid3x3 } from 'lucide-react';
import { cn } from '../utils/cn';
import {
  generateDimensionKeywords,
  TRIGGER_DIMENSIONS,
  TriggerDimension
} from '../utils/nineGridFormulaAPI';
import { LoadingOverlay } from '../components/LoadingSpinner';
import { ApiStatus } from '../components/ApiStatus';

// 九宫格位置映射
const gridPositions = [
  { row: 0, col: 0, dimension: 'audience' },
  { row: 0, col: 1, dimension: 'painpoint' },
  { row: 0, col: 2, dimension: 'desire' },
  { row: 1, col: 0, dimension: 'mistake' },
  { row: 1, col: 1, dimension: 'center' },
  { row: 1, col: 2, dimension: 'scenario' },
  { row: 2, col: 0, dimension: 'competitor' },
  { row: 2, col: 1, dimension: 'trend' },
  { row: 2, col: 2, dimension: 'story' }
];

interface GridCellProps {
  dimension?: TriggerDimension;
  isCenter: boolean;
  centerTopic: string;
  onCenterTopicChange?: (value: string) => void;
  onRefresh?: () => void;
  isLoading: boolean;
  onLockToggle?: () => void;
}

function GridCell({
  dimension,
  isCenter,
  centerTopic,
  onCenterTopicChange,
  onRefresh,
  isLoading,
  onLockToggle
}: GridCellProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  // 核心卡片 (Center Card)
  if (isCenter) {
    return (
      <div className="relative overflow-hidden rounded-2xl shadow-2xl transform hover:scale-[1.02] transition-all duration-300 group">
        {/* 动态背景 */}
        <div className="absolute inset-0 bg-gradient-to-br from-primary-600 to-secondary-700 text-white z-0" />
        <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 z-0 mix-blend-overlay" />
        
        {/* 内容层 */}
        <div className="relative z-10 p-6 flex flex-col items-center justify-center h-full min-h-[280px]">
          <div className="mb-5 p-3 bg-white/10 rounded-full backdrop-blur-md shadow-inner ring-1 ring-white/20">
            <Target className="w-8 h-8 text-white" />
          </div>
          
          <h3 className="text-lg font-bold text-white mb-4 tracking-wide">核心题材</h3>
          
          <div className="w-full max-w-[240px] relative group/input">
            <input
              type="text"
              value={centerTopic}
              onChange={(e) => onCenterTopicChange?.(e.target.value)}
              placeholder="例如：护胃奶粉"
              className="w-full px-4 py-3 bg-white/10 border border-white/20 backdrop-blur-sm rounded-xl text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-white/40 focus:border-transparent text-center font-medium transition-all"
            />
            <div className="absolute inset-0 rounded-xl bg-white/5 opacity-0 group-hover/input:opacity-100 pointer-events-none transition-opacity" />
          </div>
          
          <p className="text-xs text-primary-100 text-center mt-4 max-w-[200px] leading-relaxed">
            输入产品或服务名称<br/>AI 将围绕此核心展开头脑风暴
          </p>
        </div>
      </div>
    );
  }

  if (!dimension) return null;

  // 普通维度卡片 (Satellite Cards)
  return (
    <div className={cn(
      "card flex flex-col h-full min-h-[280px] relative group transition-all duration-300",
      dimension.locked ? "ring-2 ring-amber-400/50 bg-amber-50/30" : "hover:shadow-xl hover:-translate-y-1"
    )}>
      {/* Header */}
      <div className="p-4 border-b border-gray-100 flex items-center justify-between bg-gray-50/50 rounded-t-xl">
        <div className="flex items-center gap-2">
          <span className="w-1.5 h-4 rounded-full bg-gradient-to-b from-primary-500 to-secondary-500" />
          <h4 className="font-semibold text-gray-900 text-sm">{dimension.name}</h4>
        </div>
        
        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
          <button
            onClick={onLockToggle}
            className={cn(
              "p-1.5 rounded-md transition-colors",
              dimension.locked
                ? "text-amber-600 bg-amber-100 hover:bg-amber-200"
                : "text-gray-400 hover:text-gray-600 hover:bg-gray-100"
            )}
            title={dimension.locked ? "解锁" : "锁定此维度"}
          >
            {dimension.locked ? <Lock className="w-3.5 h-3.5" /> : <Unlock className="w-3.5 h-3.5" />}
          </button>
          <button
            onClick={onRefresh}
            disabled={isLoading || dimension.locked}
            className={cn(
              "p-1.5 rounded-md transition-colors",
              (isLoading || dimension.locked) 
                ? "text-gray-300 cursor-not-allowed" 
                : "text-gray-400 hover:text-primary-600 hover:bg-primary-50"
            )}
            title="重新生成此维度"
          >
            <RefreshCw className={cn("w-3.5 h-3.5", isLoading && "animate-spin")} />
          </button>
        </div>
      </div>
      
      {/* Content */}
      <div className="p-4 flex-1 flex flex-col">
        <p className="text-xs text-gray-500 mb-4 line-clamp-2 min-h-[2.5em] leading-relaxed">
          {dimension.description}
        </p>

        <div className="flex-1">
          {dimension.keywords.length > 0 ? (
            <div className="space-y-2">
              <div className={cn(
                "flex flex-wrap gap-2 content-start",
                !isExpanded && "max-h-[140px] overflow-hidden"
              )}>
                {(isExpanded ? dimension.keywords : dimension.keywords.slice(0, 6)).map((keyword, index) => (
                  <span
                    key={index}
                    className="inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-medium bg-white border border-gray-200 text-gray-600 hover:border-primary-300 hover:text-primary-700 hover:shadow-sm cursor-pointer transition-all select-none"
                  >
                    {keyword}
                  </span>
                ))}
              </div>
              
              {dimension.keywords.length > 6 && (
                <button
                  onClick={() => setIsExpanded(!isExpanded)}
                  className="w-full py-1 flex items-center justify-center gap-1 text-[10px] font-medium text-gray-400 hover:text-primary-600 transition-colors border-t border-gray-100 mt-2"
                >
                  {isExpanded ? (
                    <>收起 <ChevronUp className="w-3 h-3" /></>
                  ) : (
                    <>查看全部 ({dimension.keywords.length}) <ChevronDown className="w-3 h-3" /></>
                  )}
                </button>
              )}
            </div>
          ) : (
            <div className="h-full flex flex-col items-center justify-center text-gray-400 text-center py-8 border-2 border-dashed border-gray-100 rounded-xl bg-gray-50/50">
              <Sparkles className="w-6 h-6 mb-2 opacity-40" />
              <span className="text-xs">等待灵感注入...</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}


export function NineGridAnalyzer() {
  const [centerTopic, setCenterTopic] = useState('');
  const [dimensions, setDimensions] = useState<TriggerDimension[]>(
    TRIGGER_DIMENSIONS.map(dim => ({ ...dim, keywords: [], locked: false, selectedKeywords: [] }))
  );
  const [isGeneratingKeywords, setIsGeneratingKeywords] = useState(false);

  const handleGenerateAllKeywords = useCallback(async () => {
    if (!centerTopic.trim()) return;

    setIsGeneratingKeywords(true);
    try {
      const promises = dimensions.map(async (dimension) => {
        if (dimension.locked) return dimension;
        
        try {
          const keywords = await generateDimensionKeywords(centerTopic, dimension.id);
          return { ...dimension, keywords };
        } catch (error) {
          console.error(`生成${dimension.name}关键词失败:`, error);
          return dimension;
        }
      });

      const updatedDimensions = await Promise.all(promises);
      setDimensions(updatedDimensions);
    } catch (error) {
      console.error('生成关键词失败:', error);
      alert('生成关键词失败，请检查网络连接');
    } finally {
      setIsGeneratingKeywords(false);
    }
  }, [centerTopic, dimensions]);

  const handleRefreshDimension = useCallback(async (dimensionId: string) => {
    if (!centerTopic.trim()) return;

    setIsGeneratingKeywords(true);
    try {
      const keywords = await generateDimensionKeywords(centerTopic, dimensionId);
      setDimensions(prev => prev.map(dim => 
        dim.id === dimensionId ? { ...dim, keywords } : dim
      ));
    } catch (error) {
      console.error('刷新关键词失败:', error);
    } finally {
      setIsGeneratingKeywords(false);
    }
  }, [centerTopic]);

  const handleToggleLock = useCallback((dimensionId: string) => {
    setDimensions(prev => prev.map(dim =>
      dim.id === dimensionId ? { ...dim, locked: !dim.locked } : dim
    ));
  }, []);

  return (
    <div className="space-y-8 pb-12">
      <LoadingOverlay
        isVisible={isGeneratingKeywords}
        message="AI 正在进行头脑风暴..."
      />
      
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight flex items-center gap-2">
            <Grid3x3 className="w-6 h-6 text-primary-600" />
            9宫格题材分析器
          </h1>
          <p className="text-gray-500 text-sm mt-1">
            基于 <span className="font-semibold text-gray-700">垂直九宫格方法论</span>，全方位拆解爆款潜质。
          </p>
        </div>
        <div className="flex items-center gap-3">
          <ApiStatus />
          <button
            onClick={handleGenerateAllKeywords}
            disabled={!centerTopic.trim() || isGeneratingKeywords}
            className={cn(
              "btn btn-primary shadow-lg shadow-primary-500/20",
              (!centerTopic.trim() || isGeneratingKeywords) && "opacity-70 cursor-not-allowed shadow-none"
            )}
          >
            <Sparkles className={cn("w-4 h-4 mr-2", isGeneratingKeywords && "animate-spin")} />
            {isGeneratingKeywords ? '分析中...' : '开始分析'}
          </button>
        </div>
      </div>

      {/* The Nine Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {gridPositions.map((pos, index) => {
          const dimension = dimensions.find(d => d.id === pos.dimension);
          return (
            <GridCell
              key={index}
              dimension={dimension}
              isCenter={pos.dimension === 'center'}
              centerTopic={centerTopic}
              onCenterTopicChange={setCenterTopic}
              onRefresh={() => handleRefreshDimension(pos.dimension)}
              onLockToggle={() => handleToggleLock(pos.dimension)}
              isLoading={isGeneratingKeywords}
            />
          );
        })}
      </div>

      {/* Quality Tips */}
      <div className="bg-white rounded-xl border border-blue-100 p-6 shadow-sm">
        <div className="flex items-start gap-4">
          <div className="p-2 bg-blue-50 rounded-lg shrink-0">
            <Info className="w-5 h-5 text-blue-600" />
          </div>
          <div className="flex-1">
            <h3 className="font-semibold text-gray-900 mb-2">如何获得最佳效果？</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-2 text-sm text-gray-600">
              <p className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                输入具体的细分产品，而非泛泛的行业词
              </p>
              <p className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                善用"锁定"功能保留满意的灵感
              </p>
              <p className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                针对不满意的维度可以单独点击刷新
              </p>
              <p className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                组合不同维度的关键词来构建故事
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
