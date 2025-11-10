import React from 'react';
import { Brain, ExternalLink, MessageSquare, Sparkles, Target, Zap } from 'lucide-react';
import { ApiStatus } from '../components/ApiStatus';

export function CTGMindset() {
  const gptUrl = 'https://chatgpt.com/g/g-6910b59fbd2081918570c0f9feb58ada-ctg-mindset';

  const features = [
    {
      icon: Brain,
      title: '战略思维分析',
      description: '深度解析营销策略和商业模式'
    },
    {
      icon: Target,
      title: '精准定位指导',
      description: '帮助找到目标受众和市场定位'
    },
    {
      icon: Zap,
      title: '创意灵感激发',
      description: '提供创新的营销思路和方案'
    },
    {
      icon: MessageSquare,
      title: '实时对话咨询',
      description: '即时回答营销相关问题'
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-pink-50">
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-3xl font-bold text-gray-900">
              CTG Mindset AI 助手
            </h1>
            <ApiStatus />
          </div>
          <p className="text-gray-600 text-lg">
            专业的营销策略 AI 顾问，助您突破思维瓶颈
          </p>
        </div>

        {/* Main Content */}
        <div className="grid gap-8 lg:grid-cols-2">
          {/* Left Column - Introduction */}
          <div className="space-y-6">
            <div className="bg-white rounded-xl shadow-lg p-6">
              <div className="flex items-center mb-4">
                <Brain className="h-8 w-8 text-purple-600 mr-3" />
                <h2 className="text-2xl font-semibold text-gray-800">
                  关于 CTG Mindset
                </h2>
              </div>
              <div className="prose prose-gray max-w-none">
                <p className="text-gray-600 mb-4">
                  CTG Mindset 是一个专门为内容创作者和营销人员设计的 AI 助手。
                  它能够帮助您：
                </p>
                <ul className="space-y-2 text-gray-600">
                  <li>• 制定内容营销策略</li>
                  <li>• 分析目标受众心理</li>
                  <li>• 优化转化漏斗</li>
                  <li>• 提供创意方向建议</li>
                  <li>• 解答营销疑难问题</li>
                </ul>
              </div>
            </div>

            {/* Features Grid */}
            <div className="grid grid-cols-2 gap-4">
              {features.map((feature, index) => (
                <div key={index} className="bg-white rounded-lg p-4 shadow-md hover:shadow-lg transition-shadow">
                  <feature.icon className="h-6 w-6 text-purple-600 mb-2" />
                  <h3 className="font-semibold text-gray-800 mb-1">
                    {feature.title}
                  </h3>
                  <p className="text-sm text-gray-600">
                    {feature.description}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* Right Column - Chat Interface */}
          <div className="space-y-6">
            {/* Chat Preview Card */}
            <div className="bg-gradient-to-br from-purple-600 to-pink-600 rounded-xl shadow-lg p-8 text-white">
              <div className="flex items-center mb-6">
                <Sparkles className="h-10 w-10 mr-3" />
                <div>
                  <h3 className="text-2xl font-bold">开始对话</h3>
                  <p className="text-purple-100">与 AI 营销顾问交流</p>
                </div>
              </div>

              <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4 mb-6">
                <p className="text-purple-50 mb-3">您可以询问：</p>
                <div className="space-y-2 text-sm">
                  <div className="bg-white/10 rounded px-3 py-2">
                    "如何提高短视频的完播率？"
                  </div>
                  <div className="bg-white/10 rounded px-3 py-2">
                    "帮我分析这个产品的目标受众"
                  </div>
                  <div className="bg-white/10 rounded px-3 py-2">
                    "给我一个爆款内容的策划方案"
                  </div>
                </div>
              </div>

              <a
                href={gptUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center w-full bg-white text-purple-600 font-semibold py-4 px-6 rounded-lg hover:bg-purple-50 transition-colors"
              >
                <MessageSquare className="h-5 w-5 mr-2" />
                开始与 CTG Mindset 对话
                <ExternalLink className="h-4 w-4 ml-2" />
              </a>
            </div>

            {/* Usage Tips */}
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <h4 className="font-semibold text-yellow-800 mb-2">
                💡 使用提示
              </h4>
              <ul className="text-sm text-yellow-700 space-y-1">
                <li>• 需要 ChatGPT Plus 订阅才能使用</li>
                <li>• 对话将在 ChatGPT 网站上进行</li>
                <li>• 可以保存对话历史记录</li>
                <li>• 支持上传图片和文件分析</li>
              </ul>
            </div>

            {/* Alternative Options */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h4 className="font-semibold text-blue-800 mb-2">
                🔧 其他选项
              </h4>
              <p className="text-sm text-blue-700 mb-3">
                如果您没有 ChatGPT Plus，可以使用我们的内置 AI 功能：
              </p>
              <div className="space-y-2">
                <a href="/nine-grid" className="block text-sm text-blue-600 hover:text-blue-800 hover:underline">
                  → 9宫格选题生成器
                </a>
                <a href="/nine-grid-formula" className="block text-sm text-blue-600 hover:text-blue-800 hover:underline">
                  → 九宫格爆款公式
                </a>
                <a href="/topic-results" className="block text-sm text-blue-600 hover:text-blue-800 hover:underline">
                  → 爆款选题分析
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}