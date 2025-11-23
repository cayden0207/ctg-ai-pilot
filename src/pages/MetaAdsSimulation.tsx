import React from 'react';
import { ExternalLink, Megaphone, ShieldCheck, Sparkles } from 'lucide-react';

export function MetaAdsSimulation() {
  return (
    <div className="space-y-6">
      <div className="bg-white border border-gray-100 rounded-2xl shadow-sm p-6 flex flex-col gap-4">
        <div className="flex items-start gap-4">
          <div className="p-3 rounded-2xl bg-blue-100 text-blue-600">
            <Megaphone className="w-6 h-6" />
          </div>
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold text-gray-900">Meta Ads Simulation</h1>
              <span className="px-2 py-1 rounded-full bg-gray-100 text-gray-700 text-xs font-semibold uppercase tracking-wide">
                模拟练习
              </span>
            </div>
            <p className="text-gray-600 leading-relaxed">
              将 GitHub 仓库中的教学版 Meta Ads Manager 完整嵌入，支持在不连接真实广告账户的情况下，
              按步骤练习创建 Engagement Campaign / Ad Set / Ad。
            </p>
            <div className="flex flex-wrap gap-2">
              <Badge icon={<Sparkles className="w-3.5 h-3.5" />} text="Objective 选择引导" />
              <Badge icon={<ShieldCheck className="w-3.5 h-3.5" />} text="安全沙盒" />
              <Badge icon={<Sparkles className="w-3.5 h-3.5" />} text="互动/预算/版位教学" />
            </div>
          </div>
          <a
            href="https://github.com/cayden0207/meta-ads-simulation"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 text-sm font-medium text-primary-600 hover:text-primary-700 ml-auto"
          >
            查看仓库
            <ExternalLink className="w-4 h-4" />
          </a>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2">
          <div className="bg-white border border-gray-100 rounded-2xl shadow-sm overflow-hidden">
            <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
              <div>
                <p className="text-sm font-semibold text-gray-900">交互演练</p>
                <p className="text-xs text-gray-500">嵌入原版模拟页面，可在内部多页面跳转。</p>
              </div>
              <a
                href="/meta-ads-simulation/index.html"
                target="_blank"
                rel="noreferrer"
                className="text-sm text-primary-600 hover:text-primary-700 font-medium inline-flex items-center gap-1"
              >
                新窗口打开
                <ExternalLink className="w-4 h-4" />
              </a>
            </div>
            <div className="bg-gray-50 border-b border-gray-100 px-4 py-3 text-xs text-gray-600">
              流程：选择 Engagement 目标 → 选择 Manual engagement campaign → 依次完成 Campaign、Ad Set、Ad 设置。
            </div>
            <div className="relative bg-gray-900/5">
              <iframe
                title="Meta Ads Simulation"
                src="/meta-ads-simulation/index.html"
                className="w-full min-h-[820px] md:min-h-[900px] border-0"
                allowFullScreen
              />
            </div>
          </div>
          <p className="text-xs text-gray-500 mt-2">
            如嵌入未加载，请使用「新窗口打开」在浏览器中直接访问。所有页面资源均来自 /public/meta-ads-simulation。
          </p>
        </div>

        <div className="bg-white border border-gray-100 rounded-2xl shadow-sm p-5 space-y-4">
          <h3 className="text-base font-semibold text-gray-900">如何使用</h3>
          <ul className="space-y-3 text-sm text-gray-700">
            <li>
              <span className="font-semibold text-gray-900">1. Objective 引导：</span> 在创建页只能选择 Engagement，配合右下角 Continue 进入下一步。
            </li>
            <li>
              <span className="font-semibold text-gray-900">2. Setup 分支：</span> 左右两个版本均需选择 Manual engagement campaign，练习识别 Meta 不同界面。
            </li>
            <li>
              <span className="font-semibold text-gray-900">3. Campaign / Ad Set：</span> 包含预算开关、版位选择、受众半径（Leaflet 地图）等关键训练点。
            </li>
            <li>
              <span className="font-semibold text-gray-900">4. Ad 预览：</span> 提供 Feed/Story/IG 预览切换与 CTA 选择，完整走完创建流程。
            </li>
          </ul>
          <div className="rounded-xl bg-primary-50 border border-primary-100 p-4 text-sm text-primary-800">
            这是纯模拟环境，不会连接真实广告账户或调用外部接口，方便培训和演示。
          </div>
        </div>
      </div>
    </div>
  );
}

function Badge({ icon, text }: { icon: React.ReactNode; text: string }) {
  return (
    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-gray-100 text-gray-700 text-xs font-medium">
      {icon}
      {text}
    </span>
  );
}
