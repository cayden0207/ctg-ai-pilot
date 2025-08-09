import React, { useState, useCallback } from 'react';
import { Target, Zap, AlertCircle } from 'lucide-react';
import { KeywordGrid } from '../components/KeywordGrid';
import { TopicResults } from '../components/TopicResults';
import { LoadingOverlay } from '../components/LoadingSpinner';
import { ApiStatus } from '../components/ApiStatus';
import { LLMSelector } from '../components/LLMSelector';
import { useKeywordGrid } from '../hooks/useKeywordGrid';
import { generateTopics } from '../utils/openaiAPI';
import { cn } from '../utils/cn';

// 跟随六种类型，每SET=6条
const setOptions = [
  { sets: 1, total: 6, label: '1 SET', description: '每组生成6条（六类各1条）' },
  { sets: 3, total: 18, label: '3 SET', description: '每组生成18条（六类各3条）' },
  { sets: 5, total: 30, label: '5 SET', description: '每组生成30条（六类各5条）' }
];

export function DwhyGenerator() {
  const [domainInput, setDomainInput] = useState('');
  const [selectedSets, setSelectedSets] = useState(1);
  const [generatedTopics, setGeneratedTopics] = useState<string[]>([]);
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
    // 这里可以添加提示消息
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
    <div className="min-h-screen bg-gray-50">
      <LoadingOverlay isVisible={isGeneratingTopics} message="正在生成短视频爆款选题..." />
      
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center">
              <Target className="h-8 w-8 text-primary-600 mr-3" />
              <h1 className="text-3xl font-bold text-gray-900">爆款短视频内容GENERATOR</h1>
            </div>
            <ApiStatus />
          </div>
          <p className="text-gray-600 text-lg max-w-3xl">
            基于垂直九宫格框架，通过 Domain（领域）、Who（目标人群）、Why（痛点）三个维度，
            智能生成爆款短视频选题内容。
          </p>
        </div>

        {/* Instructions */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-8">
          <div className="flex items-start">
            <AlertCircle className="h-5 w-5 text-blue-600 mr-2 mt-0.5 flex-shrink-0" />
            <div className="text-sm text-blue-800">
              <strong>使用说明：</strong>
              <ol className="list-decimal list-inside mt-1 space-y-1">
                <li>选择 AI 模型（OpenAI 或 DeepSeek）</li>
                <li>在 Domain 中心输入您的主题，按回车生成相关关键词</li>
                <li>在每个九宫格中选择相关的关键词（左键选择，右键锁定）</li>
                <li>确保每个维度至少选择一个关键词</li>
                <li>选择SET数量（1 SET = 7条选题）并点击"生成短视频爆款选题"</li>
              </ol>
            </div>
          </div>
        </div>

        {/* LLM Selector */}
        <div className="mb-8">
          <LLMSelector />
        </div>

        {/* Grids */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          {/* Domain Grid */}
          <KeywordGrid
            title="Domain - 领域"
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

          {/* Who Grid */}
          <KeywordGrid
            title="Who - 目标人群"
            centerValue="Who"
            keywords={whoGrid.keywords}
            isLoading={whoGrid.isLoading}
            onRefresh={() => handleRefresh('who')}
            onKeywordToggle={whoGrid.toggleKeyword}
          />

          {/* Why Grid */}
          <KeywordGrid
            title="Why - 痛点"
            centerValue="Why"
            keywords={whyGrid.keywords}
            isLoading={whyGrid.isLoading}
            onRefresh={() => handleRefresh('why')}
            onKeywordToggle={whyGrid.toggleKeyword}
          />
        </div>

        {/* Generate Section */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-8">
          <div className="flex flex-col sm:flex-row items-center justify-between space-y-4 sm:space-y-0">
            <div className="flex flex-col space-y-2">
              <span className="text-sm font-medium text-gray-700">选择SET数量：</span>
              <div className="flex space-x-2">
                {setOptions.map(option => (
                  <button
                    key={option.sets}
                    onClick={() => setSelectedSets(option.sets)}
                    className={cn(
                      "px-4 py-3 rounded-lg text-sm font-medium transition-all duration-200 text-center",
                      selectedSets === option.sets
                        ? "bg-primary-600 text-white shadow-md"
                        : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                    )}
                  >
                    <div className="font-semibold">{option.label}</div>
                    <div className="text-xs opacity-80">{option.description}</div>
                    <div className="text-xs opacity-60">共{option.total}条</div>
                  </button>
                ))}
              </div>
            </div>

            <button
              onClick={handleGenerateTopics}
              disabled={!canGenerate() || isGeneratingTopics}
              className={cn(
                "btn btn-primary flex items-center space-x-2",
                !canGenerate() && "opacity-50 cursor-not-allowed"
              )}
            >
              <Zap className="h-4 w-4" />
              <span>生成短视频爆款选题</span>
            </button>
          </div>

          {!canGenerate() && (
            <div className="mt-4 p-3 bg-amber-50 border border-amber-200 rounded-lg">
              <div className="flex items-center text-amber-800 text-sm">
                <AlertCircle className="h-4 w-4 mr-2" />
                <span>请在每个维度中至少选择一个关键词</span>
              </div>
            </div>
          )}
        </div>

        {/* Results */}
        <TopicResults
          topics={generatedTopics}
          isLoading={isGeneratingTopics}
          onCopy={handleCopyTopic}
          onExport={handleExportTopics}
        />
      </div>
    </div>
  );
} 