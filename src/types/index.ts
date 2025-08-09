export interface Keyword {
  id: string;
  value: string;
  isLocked: boolean;
  isSelected: boolean;
}

export interface AppState {
  domainInput: string;
  domainKeywords: Keyword[];
  whoKeywords: Keyword[];
  whyKeywords: Keyword[];
  selectedCount: number;
  isGenerating: boolean;
  generatedTopics: string[];
}

export interface GridState {
  centerValue: string;
  keywords: Keyword[];
  isLoading: boolean;
}

export type KeywordType = 'domain' | 'who' | 'why';

export interface NavigationItem {
  id: string;
  name: string;
  href: string;
  icon: any;
  isActive: boolean;
  isComingSoon?: boolean;
} 

// 选题转完整内容（HOOK/定位/痛点/方案/CTA）
export interface TopicContentPlan {
  hook: string;
  positioning: string; // 定位
  painpoint: string;   // 痛点/共鸣/主题
  solution: string;    // 方案/做法
  cta: string;         // 行动呼吁
  outline?: string[];  // 可选：脚本要点
}