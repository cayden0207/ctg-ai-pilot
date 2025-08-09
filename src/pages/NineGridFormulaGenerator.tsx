import React, { useState, useCallback } from 'react';
import { Sparkles, Download, RefreshCw, Lock, Unlock, Target, Zap } from 'lucide-react';
import { cn } from '../utils/cn';
import { 
  generateDimensionKeywords, 
  generateSimpleTopics, 
  exportSimpleTopics,
  TRIGGER_DIMENSIONS,
  TriggerDimension,
  SimpleTopic
} from '../utils/nineGridFormulaAPI';
import { LoadingOverlay } from '../components/LoadingSpinner';
import { ApiStatus } from '../components/ApiStatus';
import { LLMSelector } from '../components/LLMSelector';

// SET选项
const setOptions = [
  { sets: 1, label: '1 SET', description: '每组生成6条（六类各1条）', total: 6 },
  { sets: 3, label: '3 SET', description: '每组生成18条（六类各3条）', total: 18 },
  { sets: 5, label: '5 SET', description: '每组生成30条（六类各5条）', total: 30 }
];

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
      
      <div className="space-y-1 max-h-20 overflow-y-auto">
        {dimension.keywords.length > 0 ? (
          <div className="flex flex-wrap gap-1">
            {dimension.keywords.slice(0, 6).map((keyword, index) => (
              <span 
                key={index} 
                className="text-xs text-gray-700 bg-gray-100 hover:bg-blue-100 px-2 py-1 rounded-full cursor-pointer transition-colors"
                title={keyword}
              >
                {keyword.length > 8 ? `${keyword.slice(0, 8)}...` : keyword}
              </span>
            ))}
            {dimension.keywords.length > 6 && (
              <span className="text-xs text-gray-400 px-1">
                +{dimension.keywords.length - 6}
              </span>
            )}
          </div>
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

interface TitleResultsProps {
  titles: SimpleTopic[];
  isLoading: boolean;
  onCopy: (title: string) => void;
}

function TitleResults({ titles, isLoading, onCopy }: TitleResultsProps) {
  const [copiedTitle, setCopiedTitle] = useState<string>('');

  const handleCopy = (title: string) => {
    navigator.clipboard.writeText(title);
    setCopiedTitle(title);
    setTimeout(() => setCopiedTitle(''), 2000);
    onCopy(title);
  };

  if (isLoading) {
    return (
      <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6">
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 rounded mb-4"></div>
          <div className="space-y-3">
            {Array.from({ length: 7 }).map((_, i) => (
              <div key={i} className="h-3 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (titles.length === 0) {
    return (
      <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-8 text-center">
        <div className="text-gray-400 mb-2">
          <Sparkles className="w-12 h-12 mx-auto" />
        </div>
        <p className="text-gray-600">输入主题并生成关键词后，点击"生成选题"开始创作</p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {titles.map((title, index) => (
        <div key={index} className="group flex items-center justify-between p-2 bg-white rounded-lg border hover:bg-gray-50">
          <span className="text-sm text-gray-700 flex-1">{title}</span>
          <button
            onClick={() => handleCopy(title)}
            className={cn(
              "ml-2 px-2 py-1 text-xs rounded transition-colors",
              copiedTitle === title
                ? "bg-green-100 text-green-700"
                : "bg-gray-100 hover:bg-gray-200 text-gray-600 opacity-0 group-hover:opacity-100"
            )}
          >
            {copiedTitle === title ? '已复制' : '复制'}
          </button>
        </div>
      ))}
    </div>
  );
}

export function NineGridFormulaGenerator() {
  const [centerTopic, setCenterTopic] = useState('');
  const [dimensions, setDimensions] = useState<TriggerDimension[]>(
    TRIGGER_DIMENSIONS.map(dim => ({ ...dim, keywords: [], locked: false, selectedKeywords: [] }))
  );
  const [selectedSet, setSelectedSet] = useState(1);
  const [generatedTitles, setGeneratedTitles] = useState<SimpleTopic[]>([]);
  const [isGeneratingKeywords, setIsGeneratingKeywords] = useState(false);
  const [isGeneratingTitles, setIsGeneratingTitles] = useState(false);
  const [stats, setStats] = useState({ totalGenerated: 0, totalCopied: 0 });

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

  const handleGenerateTitles = useCallback(async () => {
    if (!centerTopic.trim()) return;
    
    // 检查是否有关键词
    const hasKeywords = dimensions.some(dim => dim.keywords.length > 0);
    if (!hasKeywords) {
      alert('请先生成关键词');
      return;
    }

    setIsGeneratingTitles(true);
    try {
      const titles = await generateSimpleTopics(centerTopic, dimensions, selectedSet);
      setGeneratedTitles(titles);
      
      // 计算生成的标题总数
      setStats(prev => ({ ...prev, totalGenerated: prev.totalGenerated + titles.length }));
    } catch (error) {
      console.error('生成标题失败:', error);
      alert('生成标题失败，请检查网络连接');
    } finally {
      setIsGeneratingTitles(false);
    }
  }, [centerTopic, dimensions, selectedSet]);

  const handleCopy = useCallback(() => {
    setStats(prev => ({ ...prev, totalCopied: prev.totalCopied + 1 }));
  }, []);

  const handleExport = useCallback(() => {
    if (generatedTitles.length === 0) {
      alert('没有可导出的标题');
      return;
    }

    const content = exportSimpleTopics(generatedTitles, centerTopic, 'txt');
    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `九宫格爆款标题_${centerTopic}_${selectedSet}SET_${new Date().toLocaleDateString()}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  }, [generatedTitles, centerTopic, selectedSet]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50">
      <LoadingOverlay 
        isVisible={isGeneratingKeywords || isGeneratingTitles} 
        message={isGeneratingKeywords ? "正在生成关键词..." : "正在生成爆款标题..."} 
      />
      
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center">
              <Zap className="h-8 w-8 text-yellow-500 mr-3" />
              <div>
                <h1 className="text-3xl font-bold text-gray-900">九宫格爆款选题生成器</h1>
                <p className="text-gray-600 mt-1">核心主题 + 8个创意触发维度，批量生成简洁选题</p>
              </div>
            </div>
            <ApiStatus />
          </div>
        </div>

        {/* Control Panel */}
        <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6 mb-8">
          <div className="text-center mb-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-2">爆款选题生成控制台</h2>
            <p className="text-sm text-gray-600">输入主题 → 生成关键词 → 选择SET → 生成选题</p>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  选择SET数量
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {setOptions.map(option => (
                    <button
                      key={option.sets}
                      onClick={() => setSelectedSet(option.sets)}
                      className={cn(
                        "p-2 rounded-lg border text-center transition-all",
                        selectedSet === option.sets
                          ? "border-blue-500 bg-blue-50 text-blue-700"
                          : "border-gray-200 hover:border-gray-300"
                      )}
                    >
                      <div className="font-semibold text-sm">{option.label}</div>
                      <div className="text-xs text-gray-500">{option.description}</div>
                    </button>
                  ))}
                </div>
              </div>

              <button
                onClick={handleGenerateAllKeywords}
                disabled={!centerTopic.trim() || isGeneratingKeywords}
                className={cn(
                  "w-full py-2 px-4 rounded-lg font-medium transition-all",
                  "bg-blue-600 text-white hover:bg-blue-700",
                  (!centerTopic.trim() || isGeneratingKeywords) && "opacity-50 cursor-not-allowed"
                )}
              >
                <RefreshCw className={cn("w-4 h-4 mr-2 inline", isGeneratingKeywords && "animate-spin")} />
                生成关键词
              </button>
            </div>

            <div className="space-y-4">
              <div className="bg-gray-50 rounded-lg p-3">
                <div className="grid grid-cols-2 gap-3 text-center">
                  <div>
                    <p className="text-xs text-gray-500">已生成</p>
                    <p className="text-xl font-bold text-gray-900">{stats.totalGenerated}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">已复制</p>
                    <p className="text-xl font-bold text-gray-900">{stats.totalCopied}</p>
                  </div>
                </div>
              </div>

              <button
                onClick={handleGenerateTitles}
                disabled={!centerTopic.trim() || isGeneratingTitles || dimensions.every(d => d.keywords.length === 0)}
                className={cn(
                  "w-full py-2 px-4 rounded-lg font-medium transition-all",
                  "bg-gradient-to-r from-green-500 to-green-600 text-white",
                  "hover:from-green-600 hover:to-green-700",
                  (!centerTopic.trim() || isGeneratingTitles || dimensions.every(d => d.keywords.length === 0)) && "opacity-50 cursor-not-allowed"
                )}
              >
                <Sparkles className="w-4 h-4 mr-2 inline" />
                 生成{selectedSet}SET选题
              </button>
            </div>

            <div className="space-y-4">
              <LLMSelector className="!p-3" />
              
              <button
                onClick={handleExport}
                disabled={generatedTitles.size === 0}
                className={cn(
                  "w-full py-2 px-4 rounded-lg font-medium transition-all",
                  "bg-gray-600 text-white hover:bg-gray-700",
                  generatedTitles.size === 0 && "opacity-50 cursor-not-allowed"
                )}
              >
                <Download className="w-4 h-4 mr-2 inline" />
                 导出选题
              </button>
            </div>
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

        {/* Results */}
        <TitleResults
          titles={generatedTitles}
          isLoading={isGeneratingTitles}
          onCopy={handleCopy}
        />

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
              <h4 className="font-medium mb-2">1. 输入核心主题</h4>
              <p>在中心格输入你的行业/产品/服务关键词，例如：SPC地板、婚礼摄影、咖啡馆经营</p>
            </div>
            <div>
              <h4 className="font-medium mb-2">2. 生成关键词</h4>
              <p>系统会为8个维度生成相关关键词，可以锁定满意的维度或单独刷新</p>
            </div>
            <div>
              <h4 className="font-medium mb-2">3. 选择SET数量</h4>
               <p>1 SET = 7条选题，3 SET = 21条选题，5 SET = 35条选题</p>
            </div>
            <div>
               <h4 className="font-medium mb-2">4. 生成选题</h4>
               <p>结合关键词生成适配短视频平台的简洁选题</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}