import React, { useEffect } from 'react';
import { Loader2 } from 'lucide-react';

export function MetaAdsSimulation() {
  useEffect(() => {
    // 跳转到完整的静态模拟页面，不再通过 iframe 内嵌
    const timer = setTimeout(() => {
      window.location.href = '/meta-ads-simulation/index.html';
    }, 10);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="h-[70vh] flex flex-col items-center justify-center gap-3 text-gray-700">
      <div className="flex items-center gap-2 text-base">
        <Loader2 className="w-5 h-5 animate-spin text-primary-600" />
        正在加载 Meta Ads 模拟器...
      </div>
      <a
        href="/meta-ads-simulation/index.html"
        className="text-sm text-primary-600 hover:text-primary-700 font-medium"
      >
        若未自动跳转，点此进入完整页面
      </a>
    </div>
  );
}
