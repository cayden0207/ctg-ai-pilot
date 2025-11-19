import React, { useState, useCallback } from 'react';
import { Target, Zap, AlertCircle, Sparkles, Wand2, Layers } from 'lucide-react';
import { KeywordGrid } from '../components/KeywordGrid';
import { TopicResults } from '../components/TopicResults';
import { LoadingOverlay } from '../components/LoadingSpinner';
import { ApiStatus } from '../components/ApiStatus';
import { LLMSelector } from '../components/LLMSelector';
import { useKeywordGrid } from '../hooks/useKeywordGrid';
import { generateTopics, classifyTopics, TopicCategory } from '../utils/openaiAPI';
import { cn } from '../utils/cn';

// 跟随六种类型，每SET=6条
const setOptions = [
  { sets: 1, total: 6, label: '1 Set', description: '生成 6 条' },
  { sets: 3, total: 18, label: '3 Sets', description: '生成 18 条' },
  { sets: 5, total: 30, label: '5 Sets', description: '生成 30 条' }
];

export function DwhyGenerator() {
  const [domainInput, setDomainInput] = useState('');
  const [selectedSets, setSelectedSets] = useState(1);
  const [generatedTopics, setGeneratedTopics] = useState<string[]>([]);
  const [generatedLabels, setGeneratedLabels] = useState<TopicCategory[]>([]);
  const [isGeneratingTopics, setIsGeneratingTopics] = useState(false);

  const domainGrid = useKeywordGrid('domain');
  const whoGrid = useKeywordGrid('who');
  const whyGrid = useKeywordGrid('why');

  const handleDomainSubmit = useCallback(async () => {
    if (!domainInput.trim()) return;

    await domainGrid.generateNewKeywords(domainInput);
    // 自动生成 Who 和 Why 关键词
    await whoGrid.generateNewKeywords(domainInput);
    await whyGrid.generateNewKeywords(domainInput);
  }, [domainInput, domainGrid, whoGrid, whyGrid]);

  const handleRefresh = useCallback((type: 'domain' | 'who' | 'why') => {
    if (!domainInput.trim()) return;

    switch (type) {
      case 'domain':
        domainGrid.generateNewKeywords(domainInput);
        break;
      case 'who':
        whoGrid.generateNewKeywords(domainInput);
        break;
      case 'why':
        whyGrid.generateNewKeywords(domainInput);
        break;
    }
  }, [domainInput, domainGrid, whoGrid, whyGrid]);

  const canGenerate = useCallback(() => {
    const domainSelected = domainGrid.getSelectedKeywords();
    const whoSelected = whoGrid.getSelectedKeywords();
    const whySelected = whyGrid.getSelectedKeywords();

    return domainSelected.length > 0 && whoSelected.length > 0 && whySelected.length > 0;
  }, [domainGrid, whoGrid, whyGrid]);

  const handleGenerateTopics = useCallback(async () => {
    if (!canGenerate()) return;

    setIsGeneratingTopics(true);
    try {
      const domainSelected = domainGrid.getSelectedKeywords().map(k => k.value);
      const whoSelected = whoGrid.getSelectedKeywords().map(k => k.value);
      const whySelected = whyGrid.getSelectedKeywords().map(k => k.value);

      const totalTopics = selectedSets * 6; // 每组按六类各1条
      const topics = await generateTopics(domainSelected, whoSelected, whySelected, totalTopics);
      setGeneratedTopics(topics);
      try {
        const labels = await classifyTopics(topics, 'zh');
        setGeneratedLabels(labels as TopicCategory[]);
      } catch (e) {
        console.warn('选题分类失败，将不显示分类标注', e);
        setGeneratedLabels([]);
      }
    } catch (error) {
      console.error('生成选题失败:', error);
      // 显示错误提示
      alert('生成失败，请检查网络连接或API配置');
    } finally {
      setIsGeneratingTopics(false);
    }
  }, [canGenerate, domainGrid, whoGrid, whyGrid, selectedSets]);

  const handleCopyTopic = useCallback((topic: string) => {
    navigator.clipboard.writeText(topic);
  }, []);

  const handleExportTopics = useCallback(() => {
    const content = generatedTopics.join('\n\n');
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `爆款短视频选题_${new Date().toLocaleDateString()}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  }, [generatedTopics]);

  return (
    <div className="space-y-8 pb-12">
      <LoadingOverlay isVisible={isGeneratingTopics} message="AI 正在为您构思爆款脚本..." />
      
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight flex items-center gap-2">
            <Target className="w-6 h-6 text-primary-600" />
            爆款选题生成器
          </h1>
          <p className="text-gray-500 text-sm mt-1">
            通过 Domain (领域) + Who (人群) + Why (痛点) 三维矩阵，精准打击用户需求。
          </p>
        </div>
        <div className="flex items-center gap-3">
          <ApiStatus />
          <LLMSelector />
        </div>
      </div>

      {/* Control Grids */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Domain Grid */}
        <div className="space-y-3">
           <KeywordGrid
            title="1. Domain (领域)"
            centerValue="主题"
            keywords={domainGrid.keywords}
            isLoading={domainGrid.isLoading}
            error={domainGrid.error}
            showInput
            inputValue={domainInput}
            onInputChange={setDomainInput}
            onInputSubmit={handleDomainSubmit}
            onRefresh={() => handleRefresh('domain')}
            onKeywordToggle={domainGrid.toggleKeyword}
          />
          <p className="text-xs text-gray-500 px-1">
            👇 输入主题 (如: "美白牙膏") 并回车，AI 将生成相关细分领域。
          </p>
        </div>

        {/* Who Grid */}
        <div className="space-y-3">
          <KeywordGrid
            title="2. Who (目标人群)"
            centerValue="Who"
            keywords={whoGrid.keywords}
            isLoading={whoGrid.isLoading}
            onRefresh={() => handleRefresh('who')}
            onKeywordToggle={whoGrid.toggleKeyword}
          />
          <p className="text-xs text-gray-500 px-1">
            👇 点击选择你想触达的人群。右键可锁定关键词。
          </p>
        </div>

        {/* Why Grid */}
        <div className="space-y-3">
          <KeywordGrid
            title="3. Why (痛点/需求)"
            centerValue="Why"
            keywords={whyGrid.keywords}
            isLoading={whyGrid.isLoading}
            onRefresh={() => handleRefresh('why')}
            onKeywordToggle={whyGrid.toggleKeyword}
          />
          <p className="text-xs text-gray-500 px-1">
            👇 选择用户最痛的痛点，这是爆款的核心。
          </p>
        </div>
      </div>

      {/* Action Bar */}
      <div className="card p-5 sticky bottom-6 z-20 shadow-xl border-primary-100/50">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          
          {/* Settings */}
          <div className="flex items-center gap-4 w-full md:w-auto">
            <div className="flex items-center gap-2 text-sm text-gray-600 font-medium">
              <Layers className="w-4 h-4 text-primary-500" />
              <span>生成数量:</span>
            </div>
            <div className="flex gap-2 bg-gray-50 p-1 rounded-lg border border-gray-200">
              {setOptions.map(option => (
                <button
                  key={option.sets}
                  onClick={() => setSelectedSets(option.sets)}
                  className={cn(
                    "px-3 py-1.5 text-xs font-medium rounded-md transition-all",
                    selectedSets === option.sets
                      ? "bg-white text-primary-600 shadow-sm ring-1 ring-gray-200"
                      : "text-gray-500 hover:text-gray-700 hover:bg-gray-100"
                  )}
                >
                  {option.label} <span className="opacity-50">({option.total})</span>
                </button>
              ))}
            </div>
          </div>

          {/* Main Button */}
          <button
            onClick={handleGenerateTopics}
            disabled={!canGenerate() || isGeneratingTopics}
            className={cn(
              "btn btn-primary w-full md:w-auto px-8 py-3 text-base shadow-lg shadow-primary-500/25 group",
              (!canGenerate() || isGeneratingTopics) && "opacity-70 cursor-not-allowed shadow-none bg-gray-400"
            )}
          >
             {isGeneratingTopics ? (
               <>
                 <Wand2 className="w-5 h-5 mr-2 animate-spin" />
                 正在编写剧本...
               </>
             ) : (
               <>
                 <Zap className="w-5 h-5 mr-2 group-hover:scale-110 transition-transform" />
                 开始生成爆款选题
               </>
             )}
          </button>
        </div>

        {!canGenerate() && (
           <div className="mt-3 flex items-center justify-center gap-2 text-xs text-amber-600 bg-amber-50/50 py-2 rounded-lg border border-amber-100/50">
             <AlertCircle className="w-3.5 h-3.5" />
             请在 Domain, Who, Why 每个维度至少选择 1 个关键词
           </div>
        )}
      </div>

      {/* Results Section */}
      <TopicResults
        topics={generatedTopics}
        isLoading={isGeneratingTopics}
        labels={generatedLabels}
        onCopy={handleCopyTopic}
        onExport={handleExportTopics}
      />
    </div>
  );
}