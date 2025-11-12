import React, { useState, useCallback } from 'react';
import { RefreshCw, Lock, Unlock, Target, Zap, ChevronDown, ChevronUp } from 'lucide-react';
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
  if (isCenter) {
    return (
      <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl p-6 text-white shadow-xl">
        <div className="flex items-center justify-center mb-4">
          <Target className="w-8 h-8" />
        </div>
        <h3 className="text-lg font-bold text-center mb-4">核心主题</h3>
        <input
          type="text"
          value={centerTopic}
          onChange={(e) => onCenterTopicChange?.(e.target.value)}
          placeholder="例如：护胃奶粉"
          className="w-full px-3 py-2 bg-white/20 backdrop-blur rounded-lg text-white placeholder-white/70 focus:outline-none focus:ring-2 focus:ring-white/50 text-center"
        />
        <p className="text-xs text-white/80 text-center mt-2">
          请输入具体的产品或服务名称
        </p>
        <p className="text-xs text-white/60 text-center mt-1">
          越具体越好，如"护胃奶粉"而非"奶粉"
        </p>
      </div>
    );
  }

  if (!dimension) return null;

  return (
    <div className="bg-white rounded-xl p-4 shadow-lg border border-gray-200 hover:shadow-xl transition-shadow">
      <div className="flex items-center justify-between mb-2">
        <h4 className="font-semibold text-gray-900 text-sm">{dimension.name}</h4>
        <div className="flex items-center gap-1">
          <button
            onClick={onLockToggle}
            className={cn(
              "p-1 rounded text-xs",
              dimension.locked
                ? "text-orange-600 bg-orange-50"
                : "text-gray-400 hover:text-gray-600"
            )}
            title={dimension.locked ? "已锁定" : "点击锁定"}
          >
            {dimension.locked ? <Lock className="w-3 h-3" /> : <Unlock className="w-3 h-3" />}
          </button>
          <button
            onClick={onRefresh}
            disabled={isLoading || dimension.locked}
            className={cn(
              "p-1 rounded text-xs",
              (isLoading || dimension.locked) 
                ? "text-gray-300 cursor-not-allowed" 
                : "text-gray-400 hover:text-gray-600"
            )}
            title="刷新关键词"
          >
            <RefreshCw className={cn("w-3 h-3", isLoading && "animate-spin")} />
          </button>
        </div>
      </div>
      
      <p className="text-xs text-gray-500 mb-3">{dimension.description}</p>

      <div className="space-y-1">
        {dimension.keywords.length > 0 ? (
          <>
            <div className={cn("flex flex-wrap gap-1", !isExpanded && "max-h-20 overflow-hidden")}>
              {(isExpanded ? dimension.keywords : dimension.keywords.slice(0, 4)).map((keyword, index) => (
                <span
                  key={index}
                  className="text-xs text-gray-700 bg-gray-100 hover:bg-blue-100 px-2 py-1 rounded-full cursor-pointer transition-colors"
                  title={keyword}
                >
                  {isExpanded || keyword.length <= 12 ? keyword : `${keyword.slice(0, 10)}...`}
                </span>
              ))}
            </div>
            {dimension.keywords.length > 4 && (
              <button
                onClick={() => setIsExpanded(!isExpanded)}
                className="flex items-center gap-1 text-xs text-blue-600 hover:text-blue-700 mt-1"
              >
                {isExpanded ? (
                  <>
                    <ChevronUp className="w-3 h-3" />
                    收起
                  </>
                ) : (
                  <>
                    <ChevronDown className="w-3 h-3" />
                    展开全部 ({dimension.keywords.length}个)
                  </>
                )}
              </button>
            )}
          </>
        ) : (
          <div className="text-xs text-gray-400 text-center py-4 border-2 border-dashed border-gray-200 rounded">
            <RefreshCw className="w-4 h-4 mx-auto mb-1 opacity-50" />
            点击刷新生成关键词
          </div>
        )}
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
        if (dimension.locked) return dimension; // 跳过锁定的维度
        
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
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50">
      <LoadingOverlay
        isVisible={isGeneratingKeywords}
        message="正在生成关键词..."
      />
      
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center">
              <Zap className="h-8 w-8 text-yellow-500 mr-3" />
              <div>
                <h1 className="text-3xl font-bold text-gray-900">9宫格题材分析器</h1>
                <p className="text-gray-600 mt-1">输入核心题材，获得8个维度的创意关键词进行头脑风暴</p>
              </div>
            </div>
            <ApiStatus />
          </div>
        </div>

        {/* Control Panel */}
        <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6 mb-8">
          <div className="text-center mb-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-2">题材分析控制台</h2>
            <p className="text-sm text-gray-600">输入核心题材，AI将为您生成8个维度的创意关键词</p>
          </div>
          <div className="flex flex-wrap items-center justify-center gap-4">
            <button
              onClick={handleGenerateAllKeywords}
              disabled={!centerTopic.trim() || isGeneratingKeywords}
              className={cn(
                "px-6 py-3 rounded-lg font-medium transition-all",
                "bg-blue-600 text-white hover:bg-blue-700",
                (!centerTopic.trim() || isGeneratingKeywords) && "opacity-50 cursor-not-allowed"
              )}
            >
              <RefreshCw className={cn("w-4 h-4 mr-2 inline", isGeneratingKeywords && "animate-spin")} />
              生成关键词
            </button>
          </div>
        </div>

        {/* Nine Grid */}
        <div className="grid grid-cols-3 gap-4 mb-8">
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
        <div className="mt-8 bg-gradient-to-r from-amber-50 to-yellow-50 border border-amber-200 rounded-xl p-6">
          <h3 className="font-semibold text-amber-900 mb-4">💡 生成质量提示</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-amber-800">
            <div>
              <h4 className="font-medium mb-2">✅ 高质量关键词特征</h4>
              <ul className="space-y-1">
                <li>• 与主题直接相关（如护胃奶粉→胃痛、消化慢）</li>
                <li>• 具体场景化（餐后、熬夜后、孕期）</li>
                <li>• 贴近日常生活用语</li>
              </ul>
            </div>
            <div>
              <h4 className="font-medium mb-2">❌ 需要避免的关键词</h4>
              <ul className="space-y-1">
                <li>• 过于泛化（节庆聚餐、生活方式）</li>
                <li>• 与主题无关（SPC地板出现在护胃产品中）</li>
                <li>• 过于商业化的表达</li>
              </ul>
            </div>
          </div>
          <div className="mt-4 p-3 bg-white/50 rounded-lg">
            <p className="text-sm text-amber-800">
              💡 <strong>建议</strong>：如果生成的关键词不够精准，可以：1) 使用更具体的主题词 2) 点击单个维度的刷新按钮重新生成 3) 使用锁定功能保留满意的维度
            </p>
          </div>
        </div>

        {/* Instructions */}
            <div className="mt-6 bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-xl p-6">
          <h3 className="font-semibold text-blue-900 mb-4">📋 使用说明</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-blue-800">
            <div>
              <h4 className="font-medium mb-2">1. 输入核心题材</h4>
              <p>在中心格输入你的行业/产品/服务关键词，例如：SPC地板、婚礼摄影、咖啡馆经营</p>
            </div>
            <div>
              <h4 className="font-medium mb-2">2. 生成关键词</h4>
              <p>AI会为8个维度生成相关关键词，每个维度代表不同的创意角度</p>
            </div>
            <div>
              <h4 className="font-medium mb-2">3. 灵活调整</h4>
               <p>可以锁定满意的维度，单独刷新不满意的维度，直到获得理想的关键词组合</p>
            </div>
            <div>
               <h4 className="font-medium mb-2">4. 头脑风暴</h4>
               <p>使用这些关键词作为创意起点，进行内容创作的头脑风暴</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}