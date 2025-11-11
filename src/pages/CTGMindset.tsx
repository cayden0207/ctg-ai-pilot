import React, { useState, useRef, useEffect } from 'react';
import { Brain, Send, Loader2, RotateCcw } from 'lucide-react';
import { ApiStatus } from '../components/ApiStatus';
import { sendCTGMessage, CTGMessage } from '../utils/ctgMindsetAPI';
import { cn } from '../utils/cn';

export function CTGMindset() {
  const [messages, setMessages] = useState<CTGMessage[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // 加载历史消息（现在由本地管理）
  useEffect(() => {
    // 可以从 localStorage 加载历史消息
    const savedMessages = localStorage.getItem('ctg_mindset_messages');
    if (savedMessages) {
      try {
        const parsedMessages = JSON.parse(savedMessages);
        setMessages(parsedMessages.map((msg: any) => ({
          ...msg,
          timestamp: new Date(msg.timestamp)
        })));
      } catch (error) {
        console.error('Failed to load message history:', error);
      }
    }
  }, []);

  // 保存消息到 localStorage
  useEffect(() => {
    if (messages.length > 0) {
      localStorage.setItem('ctg_mindset_messages', JSON.stringify(messages));
    }
  }, [messages]);

  // 自动滚动到底部
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // 发送消息
  const handleSendMessage = async (message: string = inputMessage) => {
    if (!message.trim() || isLoading) return;

    const userMessage: CTGMessage = {
      role: 'user',
      content: message,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputMessage('');
    setIsLoading(true);

    try {
      const response = await sendCTGMessage(message, messages);
      const assistantMessage: CTGMessage = {
        role: 'assistant',
        content: response,
        timestamp: new Date()
      };
      setMessages(prev => [...prev, assistantMessage]);
    } catch (error) {
      console.error('发送消息失败:', error);
      // 可以添加错误提示
    } finally {
      setIsLoading(false);
    }
  };

  // 清除对话
  const handleClearChat = () => {
    localStorage.removeItem('ctg_mindset_messages'); // 清除本地存储的消息
    setMessages([]);
  };

  // 格式化消息内容（处理 Markdown 格式）
  const formatMessageContent = (content: string | any) => {
    // 确保 content 是字符串
    if (typeof content !== 'string') {
      content = String(content || '');
    }

    // 处理标题
    content = content.replace(/^## (.+)$/gm, '<h2 class="text-lg font-bold mt-4 mb-2 text-gray-900">$1</h2>');
    content = content.replace(/^### (.+)$/gm, '<h3 class="text-base font-semibold mt-3 mb-1 text-gray-800">$1</h3>');

    // 处理加粗
    content = content.replace(/\*\*(.+?)\*\*/g, '<strong class="font-semibold">$1</strong>');

    // 处理【】标签
    content = content.replace(/【([^】]+)】/g, '<span class="inline-block bg-purple-100 text-purple-800 px-2 py-0.5 rounded text-sm font-medium mr-1">$1</span>');

    // 处理列表
    content = content.replace(/^[-•] (.+)$/gm, '<li class="ml-4">• $1</li>');
    content = content.replace(/^(\d+)\. (.+)$/gm, '<li class="ml-4">$1. $2</li>');

    // 处理换行
    content = content.replace(/\n/g, '<br/>');

    return content;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-pink-50">
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center">
              <Brain className="h-8 w-8 text-purple-600 mr-3" />
              <div>
                <h1 className="text-3xl font-bold text-gray-900">
                  CTG Mindset
                </h1>
                <p className="text-gray-600">战略智能体 | CEO 思维模式</p>
              </div>
            </div>
            <ApiStatus />
          </div>
        </div>

        <div className="max-w-4xl mx-auto">
          {/* 对话区域（移动端优化） */}
          <div className="bg-white rounded-xl shadow-lg flex flex-col h-[75vh] sm:h-[78vh] md:h-[80vh]">
              {/* 对话头部 */}
              <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
                <div className="flex items-center">
                  <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
                  <span className="text-sm text-gray-600">AI 助手在线</span>
                </div>
                {messages.length > 0 && (
                  <button
                    onClick={handleClearChat}
                    className="flex items-center text-sm text-gray-500 hover:text-gray-700"
                  >
                    <RotateCcw className="h-4 w-4 mr-1" />
                    清除对话
                  </button>
                )}
              </div>

              {/* 消息列表 */}
              <div className="flex-1 overflow-y-auto px-4 sm:px-6 py-4">
                {messages.length === 0 ? (
                  <div className="text-center py-12">
                    <Brain className="h-16 w-16 text-purple-200 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">
                      欢迎使用 CTG Mindset
                    </h3>
                    <p className="text-gray-600 mb-4">
                      我是您的战略智能助手，可以帮您解决经营难题
                    </p>
                    <p className="text-sm text-gray-500">
                      直接在下方输入您的问题开始对话
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {messages.map((message, index) => (
                      <div
                        key={index}
                        className={cn(
                          "flex",
                          message.role === 'user' ? 'justify-end' : 'justify-start'
                        )}
                      >
                        <div
                          className={cn(
                            "max-w-[85%] sm:max-w-[80%] rounded-lg px-3 sm:px-4 py-2.5 sm:py-3",
                            message.role === 'user'
                              ? 'bg-purple-600 text-white'
                              : 'bg-gray-100 text-gray-800'
                          )}
                        >
                          {message.role === 'assistant' ? (
                            <div
                              className="prose prose-sm max-w-none"
                              dangerouslySetInnerHTML={{
                                __html: formatMessageContent(message.content)
                              }}
                            />
                          ) : (
                            <p className="whitespace-pre-wrap text-sm sm:text-base">{message.content}</p>
                          )}
                        </div>
                      </div>
                    ))}
                    {isLoading && (
                      <div className="flex justify-start">
                        <div className="bg-gray-100 rounded-lg px-3 py-2.5 sm:px-4 sm:py-3 flex items-center">
                          <Loader2 className="h-4 w-4 animate-spin text-purple-600 mr-2" />
                          <span className="text-gray-600">正在思考...</span>
                        </div>
                      </div>
                    )}
                    <div ref={messagesEndRef} />
                  </div>
                )}
              </div>

              {/* 输入区域 */}
              <div className="px-3 sm:px-6 py-3 sm:py-4 border-t border-gray-200">
                <div className="flex items-center gap-2 sm:gap-3">
                  <input
                    type="text"
                    value={inputMessage}
                    onChange={(e) => setInputMessage(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                    placeholder="输入您的问题..."
                    disabled={isLoading}
                    className="flex-1 px-3 sm:px-4 py-2 sm:py-2.5 text-sm sm:text-base border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent disabled:bg-gray-50"
                  />
                  <button
                    onClick={() => handleSendMessage()}
                    disabled={!inputMessage.trim() || isLoading}
                    className="px-3 sm:px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors flex items-center text-sm sm:text-base"
                  >
                    {isLoading ? (
                      <Loader2 className="h-5 w-5 animate-spin" />
                    ) : (
                      <>
                        <Send className="h-5 w-5 mr-1" />
                        发送
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
