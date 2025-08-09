import React, { useState } from 'react';
import { Copy, Download, Share2, MessageCircle, FileText } from 'lucide-react';
import { generateContentPlan } from '../utils/openaiAPI';

interface TopicResultsProps {
  topics: string[];
  isLoading: boolean;
  onCopy?: (topic: string) => void;
  onExport?: () => void;
  onShare?: (topic: string) => void;
}

// 简单列表展示，不再按“7大公式”分组

export function TopicResults({ topics, isLoading, onCopy, onExport, onShare }: TopicResultsProps) {
  if (isLoading) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">正在生成选题...</h3>
          <div className="animate-pulse bg-gray-200 h-6 w-20 rounded"></div>
        </div>
        <div className="space-y-4">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="animate-pulse">
              <div className="bg-gray-200 h-20 rounded-lg"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (topics.length === 0) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8 text-center">
        <div className="text-gray-400 mb-4">
          <MessageCircle className="h-12 w-12 mx-auto" />
        </div>
        <h3 className="text-lg font-medium text-gray-900 mb-2">还没有生成选题</h3>
        <p className="text-gray-500">
          请先在上方的三个维度中各选择至少一个关键词，然后点击"生成选题"
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-primary-50 to-secondary-50 px-6 py-4 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-900">
            生成的选题 ({topics.length}条)
          </h3>
          <div className="flex space-x-2">
            <button
              onClick={onExport}
              className="btn btn-outline text-sm"
              title="导出选题"
            >
              <Download className="h-4 w-4 mr-1" />
              导出
            </button>
          </div>
        </div>
      </div>

      {/* Simple list */}
      <div className="p-6 space-y-3">
        {topics.map((topic, idx) => (
          <TopicCard
            key={idx}
            topic={topic}
            index={idx + 1}
            onCopy={onCopy}
            onShare={onShare}
          />
        ))}
      </div>
    </div>
  );
}

interface TopicCardProps {
  topic: string;
  index: number;
  onCopy?: (topic: string) => void;
  onShare?: (topic: string) => void;
}

function TopicCard({ topic, index, onCopy, onShare }: TopicCardProps) {
  const [isLoadingPlan, setIsLoadingPlan] = useState(false);
  const [plan, setPlan] = useState<any | null>(null);

  const handleCopy = () => {
    if (onCopy) {
      onCopy(topic);
    } else {
      navigator.clipboard.writeText(topic);
    }
  };

  const handleShare = () => {
    if (onShare) {
      onShare(topic);
    }
  };

  const handleGeneratePlan = async () => {
    try {
      setIsLoadingPlan(true);
      const res = await generateContentPlan(topic, 'zh');
      setPlan(res);
    } catch (e) {
      console.error('生成内容卡失败', e);
      alert('生成内容失败，请稍后重试');
    } finally {
      setIsLoadingPlan(false);
    }
  };

  return (
    <div className="bg-gradient-to-r from-gray-50 to-gray-100 rounded-lg p-4 border border-gray-200 hover:shadow-md transition-all duration-200 group">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center mb-2">
            <span className="inline-flex items-center justify-center w-6 h-6 bg-primary-100 text-primary-600 rounded-full text-sm font-medium mr-3">
              {index}
            </span>
            <span className="text-sm text-gray-500">选题 #{index}</span>
          </div>
          <h4 className="text-gray-900 font-medium text-lg leading-relaxed mb-1">
            {topic}
          </h4>

        </div>

        {/* Actions */}
        <div className="flex space-x-2 opacity-0 group-hover:opacity-100 transition-opacity ml-4">
          <button
            onClick={handleGeneratePlan}
            className="p-2 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
            title="生成内容"
          >
            <FileText className="h-4 w-4" />
          </button>
          <button
            onClick={handleCopy}
            className="p-2 text-gray-400 hover:text-primary-600 hover:bg-primary-50 rounded-lg transition-colors"
            title="复制选题"
          >
            <Copy className="h-4 w-4" />
          </button>
          <button
            onClick={handleShare}
            className="p-2 text-gray-400 hover:text-secondary-600 hover:bg-secondary-50 rounded-lg transition-colors"
            title="分享选题"
          >
            <Share2 className="h-4 w-4" />
          </button>
        </div>
      </div>

      {plan && (
        <div className="mt-3 text-sm bg-white rounded border p-3">
          <div className="flex items-center justify-between mb-2">
            <span className="font-medium text-gray-900">内容卡</span>
            {isLoadingPlan && <span className="text-xs text-gray-400">生成中...</span>}
          </div>
          <div className="space-y-1 text-gray-700">
            {plan.hook && <p><span className="text-gray-500">HOOK：</span>{plan.hook}</p>}
            {plan.positioning && <p><span className="text-gray-500">定位：</span>{plan.positioning}</p>}
            {plan.painpoint && <p><span className="text-gray-500">痛点：</span>{plan.painpoint}</p>}
            {plan.solution && <p><span className="text-gray-500">方案：</span>{plan.solution}</p>}
            {plan.cta && <p><span className="text-gray-500">CTA：</span>{plan.cta}</p>}
            {Array.isArray(plan.outline) && plan.outline.length > 0 && (
              <div>
                <p className="text-gray-500">要点：</p>
                <ul className="list-disc ml-5">
                  {plan.outline.slice(0,3).map((o: string, i: number) => (
                    <li key={i}>{o}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
} 