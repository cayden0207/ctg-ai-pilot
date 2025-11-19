import React from 'react';
import { Copy, Download, Share2, CheckCircle2 } from 'lucide-react';
import { cn } from '../utils/cn';
import { TopicCategory } from '../utils/openaiAPI';

interface TopicResultsProps {
  topics: string[];
  isLoading: boolean;
  labels?: TopicCategory[];
  onCopy: (topic: string) => void;
  onExport: () => void;
}

export function TopicResults({ topics, isLoading, labels, onCopy, onExport }: TopicResultsProps) {
  const [copiedIndex, setCopiedIndex] = React.useState<number | null>(null);

  const handleCopy = (topic: string, index: number) => {
    onCopy(topic);
    setCopiedIndex(index);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  if (isLoading) return null;
  if (topics.length === 0) return null;

  return (
    <div className="space-y-4 animate-slide-up">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
          <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary-100 text-primary-600 text-xs ring-4 ring-white">
            {topics.length}
          </span>
          生成结果
        </h2>
        <button
          onClick={onExport}
          className="btn btn-secondary text-xs py-1.5 px-3 flex items-center gap-2"
        >
          <Download className="h-3.5 w-3.5" />
          导出全部
        </button>
      </div>

      <div className="grid grid-cols-1 gap-4">
        {topics.map((topic, index) => (
          <div
            key={index}
            className="group bg-white rounded-xl border border-gray-200 p-5 shadow-sm hover:shadow-md hover:border-primary-200 transition-all duration-200 relative overflow-hidden"
          >
            {/* Label Badge */}
            {labels && labels[index] && (
               <div className="absolute top-0 right-0 bg-gray-50 border-l border-b border-gray-100 px-3 py-1 rounded-bl-xl text-[10px] font-medium text-gray-500 uppercase tracking-wider">
                 {labels[index]}
               </div>
            )}

            <div className="pr-8">
               <div className="flex gap-3">
                 <span className="flex-shrink-0 w-6 h-6 rounded-full bg-gray-50 text-gray-400 flex items-center justify-center text-xs font-mono mt-0.5">
                   {index + 1}
                 </span>
                 <p className="text-gray-800 leading-relaxed whitespace-pre-wrap text-sm font-medium">
                   {topic}
                 </p>
               </div>
            </div>
            
            {/* Actions */}
            <div className="absolute bottom-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity flex gap-2">
              <button
                onClick={() => handleCopy(topic, index)}
                className={cn(
                  "p-2 rounded-lg transition-colors",
                  copiedIndex === index
                    ? "bg-emerald-50 text-emerald-600"
                    : "bg-gray-100 text-gray-500 hover:bg-primary-50 hover:text-primary-600"
                )}
                title="复制内容"
              >
                {copiedIndex === index ? (
                  <CheckCircle2 className="w-4 h-4" />
                ) : (
                  <Copy className="w-4 h-4" />
                )}
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}