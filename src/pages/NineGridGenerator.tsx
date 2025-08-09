import React, { useState, useCallback } from 'react';
import { Sparkles, Download, Copy, RefreshCw, Star, TrendingUp, MessageCircle, Zap } from 'lucide-react';
import { cn } from '../utils/cn';
import { generateNineGridTopics, GridTopic, ContentType } from '../utils/nineGridAPI';
import { LoadingOverlay } from '../components/LoadingSpinner';
import { ApiStatus } from '../components/ApiStatus';
import { LLMSelector } from '../components/LLMSelector';

const contentTypes: ContentType[] = [
  { position: 0, type: '揭秘型', formula: 'reveal', icon: '🔍', color: 'from-purple-500 to-purple-600' },
  { position: 1, type: '教学型', formula: 'tutorial', icon: '📚', color: 'from-blue-500 to-blue-600' },
  { position: 2, type: '故事型', formula: 'story', icon: '📖', color: 'from-green-500 to-green-600' },
  { position: 3, type: '对比型', formula: 'comparison', icon: '⚖️', color: 'from-yellow-500 to-yellow-600' },
  { position: 4, type: '核心主题', formula: 'core', icon: '🎯', color: 'from-red-500 to-red-600' },
  { position: 5, type: '挑战型', formula: 'challenge', icon: '🏆', color: 'from-indigo-500 to-indigo-600' },
  { position: 6, type: '数据型', formula: 'data', icon: '📊', color: 'from-pink-500 to-pink-600' },
  { position: 7, type: '热点型', formula: 'trending', icon: '🔥', color: 'from-orange-500 to-orange-600' },
  { position: 8, type: 'UGC型', formula: 'ugc', icon: '👥', color: 'from-teal-500 to-teal-600' }
];

interface GridCellProps {
  contentType: ContentType;
  topic?: GridTopic;
  isCenter: boolean;
  centerTopic: string;
  onCenterTopicChange?: (value: string) => void;
  onGenerate: () => void;
  onCopy: () => void;
  onRefresh: () => void;
  isLoading: boolean;
}

function GridCell({ 
  contentType, 
  topic, 
  isCenter, 
  centerTopic,
  onCenterTopicChange,
  onGenerate, 
  onCopy, 
  onRefresh,
  isLoading 
}: GridCellProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    if (topic?.content) {
      navigator.clipboard.writeText(topic.content);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      onCopy();
    }
  };

  if (isCenter) {
    return (
      <div className="relative bg-gradient-to-br from-red-500 to-red-600 rounded-xl p-6 text-white shadow-xl">
        <div className="absolute top-2 right-2 text-3xl">{contentType.icon}</div>
        <div className="space-y-4">
          <h3 className="text-lg font-bold">核心主题</h3>
          <input
            type="text"
            value={centerTopic}
            onChange={(e) => onCenterTopicChange?.(e.target.value)}
            placeholder="输入你的主题..."
            className="w-full px-3 py-2 bg-white/20 backdrop-blur rounded-lg text-white placeholder-white/70 focus:outline-none focus:ring-2 focus:ring-white/50"
          />
          <button
            onClick={onGenerate}
            disabled={!centerTopic.trim() || isLoading}
            className={cn(
              "w-full py-2 px-4 rounded-lg font-medium transition-all",
              "bg-white text-red-600 hover:bg-white/90",
              (!centerTopic.trim() || isLoading) && "opacity-50 cursor-not-allowed"
            )}
          >
            {isLoading ? (
              <span className="flex items-center justify-center">
                <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                生成中...
              </span>
            ) : (
              <span className="flex items-center justify-center">
                <Sparkles className="w-4 h-4 mr-2" />
                一键生成9宫格
              </span>
            )}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={cn(
      "relative rounded-xl p-4 shadow-lg transition-all duration-300",
      "bg-white hover:shadow-xl border border-gray-200",
      isLoading && "animate-pulse"
    )}>
      <div className={cn(
        "absolute top-2 right-2 w-10 h-10 rounded-lg flex items-center justify-center",
        "bg-gradient-to-br text-white text-lg",
        contentType.color
      )}>
        {contentType.icon}
      </div>
      
      <div className="pr-12">
        <h4 className="font-semibold text-gray-900 mb-1">{contentType.type}</h4>
        {topic ? (
          <div className="space-y-3">
            <p className="text-sm text-gray-700 line-clamp-3">{topic.content}</p>
            
            {topic.scores && (
              <div className="flex items-center gap-3 text-xs">
                <div className="flex items-center" title="爆款潜力">
                  <Star className="w-3 h-3 text-yellow-500 mr-1" />
                  <span>{topic.scores.viral}/5</span>
                </div>
                <div className="flex items-center" title="互动潜力">
                  <MessageCircle className="w-3 h-3 text-blue-500 mr-1" />
                  <span>{topic.scores.engagement}/5</span>
                </div>
                <div className="flex items-center" title="传播潜力">
                  <TrendingUp className="w-3 h-3 text-green-500 mr-1" />
                  <span>{topic.scores.spread}/5</span>
                </div>
              </div>
            )}
            
            <div className="flex gap-2">
              <button
                onClick={handleCopy}
                className="flex-1 text-xs py-1.5 px-2 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
              >
                {copied ? '✓ 已复制' : '复制'}
              </button>
              <button
                onClick={onRefresh}
                className="text-xs py-1.5 px-2 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
                title="重新生成"
              >
                <RefreshCw className="w-3 h-3" />
              </button>
            </div>
          </div>
        ) : (
          <div className="text-sm text-gray-400 py-8 text-center">
            等待生成...
          </div>
        )}
      </div>
    </div>
  );
}

export function NineGridGenerator() {
  const [centerTopic, setCenterTopic] = useState('');
  const [gridTopics, setGridTopics] = useState<(GridTopic | null)[]>(new Array(9).fill(null));
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationCount, setGenerationCount] = useState(1);
  const [stats, setStats] = useState({ totalGenerated: 0, totalCopied: 0 });

  const handleGenerateAll = useCallback(async () => {
    if (!centerTopic.trim()) return;

    setIsGenerating(true);
    try {
      const topics = await generateNineGridTopics(centerTopic, contentTypes, generationCount);
      setGridTopics(topics);
      setStats(prev => ({ ...prev, totalGenerated: prev.totalGenerated + topics.filter(t => t).length }));
    } catch (error) {
      console.error('生成失败:', error);
      alert('生成失败，请检查网络连接或API配置');
    } finally {
      setIsGenerating(false);
    }
  }, [centerTopic, generationCount]);

  const handleRefreshSingle = useCallback(async (index: number) => {
    if (!centerTopic.trim() || index === 4) return;

    setIsGenerating(true);
    try {
      const topics = await generateNineGridTopics(
        centerTopic, 
        [contentTypes[index]], 
        1
      );
      const newGridTopics = [...gridTopics];
      newGridTopics[index] = topics[0];
      setGridTopics(newGridTopics);
      setStats(prev => ({ ...prev, totalGenerated: prev.totalGenerated + 1 }));
    } catch (error) {
      console.error('生成失败:', error);
    } finally {
      setIsGenerating(false);
    }
  }, [centerTopic, gridTopics]);

  const handleCopy = useCallback(() => {
    setStats(prev => ({ ...prev, totalCopied: prev.totalCopied + 1 }));
  }, []);

  const handleExportAll = useCallback(() => {
    const validTopics = gridTopics.filter(t => t?.content);
    if (validTopics.length === 0) {
      alert('没有可导出的内容');
      return;
    }

    const content = validTopics.map((topic, index) => {
      const type = contentTypes.find(ct => ct.position === index);
      return `【${type?.type}】\n${topic?.content}\n`;
    }).join('\n');

    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `九宫格爆款选题_${centerTopic}_${new Date().toLocaleDateString()}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  }, [gridTopics, centerTopic]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <LoadingOverlay isVisible={isGenerating} message="AI正在创作爆款内容..." />
      
      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center">
              <Zap className="h-8 w-8 text-yellow-500 mr-3" />
              <h1 className="text-3xl font-bold text-gray-900">九宫格爆款生成器</h1>
            </div>
            <ApiStatus />
          </div>
          <p className="text-gray-600 text-lg">
            输入核心主题，一键生成9种不同类型的爆款短视频选题
          </p>
        </div>

        {/* Stats Bar */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 mb-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-6">
              <div className="text-sm">
                <span className="text-gray-500">已生成：</span>
                <span className="font-semibold text-gray-900 ml-1">{stats.totalGenerated}</span>
              </div>
              <div className="text-sm">
                <span className="text-gray-500">已复制：</span>
                <span className="font-semibold text-gray-900 ml-1">{stats.totalCopied}</span>
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              <LLMSelector className="!p-2" />
              
              <div className="flex items-center space-x-2">
                <span className="text-sm text-gray-600">每格生成：</span>
                <select
                  value={generationCount}
                  onChange={(e) => setGenerationCount(Number(e.target.value))}
                  className="px-3 py-1 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                >
                  <option value={1}>1条</option>
                  <option value={3}>3条</option>
                  <option value={5}>5条</option>
                </select>
              </div>
              
              <button
                onClick={handleExportAll}
                disabled={!gridTopics.some(t => t?.content)}
                className={cn(
                  "flex items-center px-4 py-2 bg-green-600 text-white rounded-lg",
                  "hover:bg-green-700 transition-colors",
                  !gridTopics.some(t => t?.content) && "opacity-50 cursor-not-allowed"
                )}
              >
                <Download className="w-4 h-4 mr-2" />
                导出全部
              </button>
            </div>
          </div>
        </div>

        {/* Nine Grid */}
        <div className="grid grid-cols-3 gap-4 mb-8">
          {contentTypes.map((contentType, index) => (
            <GridCell
              key={index}
              contentType={contentType}
              topic={gridTopics[index] || undefined}
              isCenter={index === 4}
              centerTopic={centerTopic}
              onCenterTopicChange={setCenterTopic}
              onGenerate={handleGenerateAll}
              onCopy={handleCopy}
              onRefresh={() => handleRefreshSingle(index)}
              isLoading={isGenerating}
            />
          ))}
        </div>

        {/* Tips */}
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-6">
          <h3 className="font-semibold text-blue-900 mb-3">💡 使用技巧</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-blue-800">
            <div>
              <strong>快速开始：</strong>
              <p>在中心格输入主题，点击"一键生成9宫格"</p>
            </div>
            <div>
              <strong>精准优化：</strong>
              <p>点击单个格子的刷新按钮重新生成该类型</p>
            </div>
            <div>
              <strong>批量创作：</strong>
              <p>调整"每格生成"数量，获取更多选题变体</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}