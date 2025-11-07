import { createChatCompletion } from './openaiAPI';

// 8个创意触发维度
export interface TriggerDimension {
  id: string;
  name: string;
  description: string;
  keywords: string[];
  locked: boolean;
  selectedKeywords: string[]; // 用户选中的关键词
}

// 简单选题（不再分公式）
export type SimpleTopic = string;

// 8个维度定义
export const TRIGGER_DIMENSIONS: Omit<TriggerDimension, 'keywords' | 'locked' | 'selectedKeywords'>[] = [
  {
    id: 'audience',
    name: '受众标签',
    description: '谁会买'
  },
  {
    id: 'painpoint', 
    name: '典型痛点',
    description: '怕什么'
  },
  {
    id: 'desire',
    name: '梦想/愿望', 
    description: '想得到什么'
  },
  {
    id: 'mistake',
    name: '误区/错误',
    description: '容易踩的坑'
  },
  {
    id: 'scenario',
    name: '场景/使用时机',
    description: '什么时候用到'
  },
  {
    id: 'competitor',
    name: '对比对象',
    description: '对手是谁'
  },
  {
    id: 'trend',
    name: '趋势/热点',
    description: '当前话题'
  },
  {
    id: 'story',
    name: '故事/案例',
    description: '真实经历'
  }
];

// 不再使用固定7公式结构

// 检测是否为中文输入
function isChineseInput(text: string): boolean {
  const chineseRegex = /[\u4e00-\u9fff]/;
  return chineseRegex.test(text);
}

// 生成关键词的系统提示
function getKeywordGenerationPrompt(dimension: string, topic: string, isChinese: boolean): string {
  const dimensionPrompts = {
    audience: isChinese 
      ? `针对主题"${topic}"，生成8个具体的目标受众标签。要求：
      - 具体明确，避免过于宽泛
      - 符合马来西亚本土特色
      - 涵盖不同年龄段和背景
      - 例如：新装修夫妻、有小孩家庭、商铺老板、年轻租户
      请只返回关键词，用逗号分隔。`
      : `For the topic "${topic}", generate 8 specific target audience labels. Requirements:
      - Be specific and precise, avoid being too broad
      - Include Malaysian local characteristics  
      - Cover different age groups and backgrounds
      - Example: newly married couples, families with kids, shop owners, young tenants
      Return only keywords, comma separated.`,
      
    painpoint: isChinese
      ? `针对主题"${topic}"，生成8个与${topic}直接相关的典型痛点。要求：
      - 必须是使用${topic}的人群真实面临的痛点
      - 与${topic}功能和使用场景紧密相关的担忧
      - 避免过于泛化的描述，要具体到${topic}领域
      - 例如：如果是护胃奶粉，应该是"胃痛"、"消化慢"、"怕添加剂"、"预算有限"等具体痛点
      请只返回与${topic}直接相关的痛点关键词，用逗号分隔。`
      : `For the topic "${topic}", generate 8 typical pain points. Requirements:
      - Real worries and fears
      - Malaysian localized scenarios
      - Specific perceptible problems
      - Example: fear of mold, fear of cold, limited budget, quality concerns
      Return only keywords, comma separated.`,
      
    desire: isChinese
      ? `针对主题"${topic}"，生成8个梦想/愿望。要求：
      - 积极正面的期待
      - 实际可达成的目标
      - 情感层面的满足
      - 例如：想防水、想好看、想耐用、想省钱
      请只返回关键词，用逗号分隔。`
      : `For the topic "${topic}", generate 8 dreams/desires. Requirements:
      - Positive expectations
      - Achievable goals
      - Emotional satisfaction
      - Example: want waterproof, want beautiful, want durable, want to save money
      Return only keywords, comma separated.`,
      
    mistake: isChinese
      ? `针对主题"${topic}"，生成8个常见误区/错误。要求：
      - 用户容易犯的错误
      - 认知偏差和误解
      - 可以纠正的错误观念
      - 例如：只看便宜、不看材质、忽略安装、跟风购买
      请只返回关键词，用逗号分隔。`
      : `For the topic "${topic}", generate 8 common mistakes/misconceptions. Requirements:
      - Mistakes users easily make
      - Cognitive biases and misunderstandings  
      - Correctable wrong concepts
      - Example: only look at price, ignore material, neglect installation, follow trends
      Return only keywords, comma separated.`,
      
    scenario: isChinese
      ? `针对主题"${topic}"，生成8个与该主题直接相关的使用场景/时机。要求：
      - 必须与${topic}紧密相关的具体使用场景
      - 针对${topic}的最佳使用时机
      - 结合${topic}的功能和效果的场景
      - 避免过于泛化的场景描述
      - 例如：如果是护胃奶粉，应该是"餐后"、"熬夜后"、"孕期"、"肠胃不适时"等具体时机
      请只返回与${topic}直接相关的关键词，用逗号分隔。`
      : `For the topic "${topic}", generate 8 usage scenarios/timing. Requirements:
      - Specific usage environments
      - Time points and seasons
      - Malaysian local scenarios
      - Example: rainy season, renovation season, before moving, before opening
      Return only keywords, comma separated.`,
      
    competitor: isChinese
      ? `针对主题"${topic}"，生成8个对比对象/竞争对手。要求：
      - 直接竞争的产品/服务
      - 替代方案
      - 传统选择vs新选择
      - 例如：瓷砖、木地板、复合地板、水泥地
      请只返回关键词，用逗号分隔。`
      : `For the topic "${topic}", generate 8 comparison objects/competitors. Requirements:
      - Direct competing products/services
      - Alternative solutions
      - Traditional vs new choices
      - Example: tiles, wooden floor, composite floor, cement floor
      Return only keywords, comma separated.`,
      
    trend: isChinese
      ? `针对主题"${topic}"，生成8个相关趋势/热点。要求：
      - 当前流行话题
      - 社会趋势和潮流
      - 马来西亚本土热点
      - 例如：环保装修、轻装修、马来西亚雨季、简约风格
      请只返回关键词，用逗号分隔。`
      : `For the topic "${topic}", generate 8 related trends/hot topics. Requirements:
      - Current popular topics
      - Social trends and fashions
      - Malaysian local hot topics
      - Example: eco-friendly renovation, light renovation, Malaysian rainy season, minimalist style
      Return only keywords, comma separated.`,
      
    story: isChinese
      ? `针对主题"${topic}"，生成8个故事/案例场景。要求：
      - 真实感人的故事背景
      - 具体的案例场景
      - 马来西亚本土特色
      - 例如：屋主翻新记、咖啡馆换地板、孩子房改造、老房子升级
      请只返回关键词，用逗号分隔。`
      : `For the topic "${topic}", generate 8 story/case scenarios. Requirements:
      - Realistic touching story backgrounds
      - Specific case scenarios
      - Malaysian local characteristics
      - Example: homeowner renovation, cafe floor replacement, kids room makeover, old house upgrade
      Return only keywords, comma separated.`
  };

  return dimensionPrompts[dimension as keyof typeof dimensionPrompts] || '';
}

// 生成简洁选题的系统提示
function getSimpleTopicGenerationPrompt(
  topic: string,
  dimensions: TriggerDimension[],
  totalCount: number,
  isChinese: boolean
): string {
  const keywords = dimensions.reduce((acc, dim) => {
    acc[dim.name] = dim.keywords.join('、');
    return acc;
  }, {} as Record<string, string>);

  return isChinese
    ? `你是资深短视频选题专家，请基于下列信息生成${totalCount}条简洁选题标题：

核心主题：${topic}
可用关键词：
- 受众标签：${keywords['受众标签'] || ''}
- 典型痛点：${keywords['典型痛点'] || ''}
- 梦想/愿望：${keywords['梦想/愿望'] || ''}
- 误区/错误：${keywords['误区/错误'] || ''}
- 场景/使用时机：${keywords['场景/使用时机'] || ''}
- 对比对象：${keywords['对比对象'] || ''}
- 趋势/热点：${keywords['趋势/热点'] || ''}
- 故事/案例：${keywords['故事/案例'] || ''}

要求：
- 只输出标题本身，每行一条，不要编号或分类
- 15-40字，口语化，信息前置，有明确钩子
- 尽量多样化角度，避免重复或近义改写
- 合规：避免夸大承诺、绝对化表述、污名化群体
现在开始生成：`
    : `You are a short-form video topic expert. Generate ${totalCount} concise topic lines based on:

Core Topic: ${topic}
Keywords by dimensions:
- Audience: ${keywords['受众标签'] || ''}
- Pain Points: ${keywords['典型痛点'] || ''}
- Desires: ${keywords['梦想/愿望'] || ''}
- Mistakes: ${keywords['误区/错误'] || ''}
- Scenarios: ${keywords['场景/使用时机'] || ''}
- Competitors: ${keywords['对比对象'] || ''}
- Trends: ${keywords['趋势/热点'] || ''}
- Stories: ${keywords['故事/案例'] || ''}

Rules:
- Output plain lines only, one per line, no numbering
- 8-20 words, spoken style, early hook
- Maximize diversity, avoid repetition/near duplicates
- Compliant wording
Generate now:`;
}

// 关键词相关性过滤
function filterRelevantKeywords(keywords: string[], topic: string): string[] {
  // 简单的相关性检查，后续可以改进为更智能的算法
  const topicLowerCase = topic.toLowerCase();
  
  return keywords.filter(keyword => {
    const keywordLowerCase = keyword.toLowerCase();
    
    // 如果关键词包含主题词，认为相关
    if (keywordLowerCase.includes(topicLowerCase) || topicLowerCase.includes(keywordLowerCase)) {
      return true;
    }
    
    // 过滤掉过于泛化的词汇
    const genericTerms = ['节庆聚餐', '生活方式', '日常', '一般', '普通', '常见'];
    return !genericTerms.some(term => keywordLowerCase.includes(term));
  });
}

// 生成关键词
export async function generateDimensionKeywords(
  topic: string, 
  dimensionId: string
): Promise<string[]> {
  try {
    if (!import.meta.env.VITE_OPENAI_API_KEY) {
      throw new Error('OpenAI API密钥未配置');
    }

    const isChinese = isChineseInput(topic);
    
    // 强化系统提示，要求更高的相关性
    const systemPrompt = `你是专业的关键词生成专家。请严格基于主题"${topic}"生成关键词，要求：
    1. 关键词必须与"${topic}"直接相关
    2. 避免过于泛化或通用的词汇
    3. 聚焦于"${topic}"的核心特征和应用场景
    4. 使用准确、具体的行业术语`;
    
    const prompt = getKeywordGenerationPrompt(dimensionId, topic, isChinese);
    
    const response = await createChatCompletion({
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: prompt }
      ],
      max_tokens: 200,
      temperature: 0.7
    });

    const content = response.choices[0]?.message?.content || '';
    let keywords = content.split(/[,，]/).map(k => k.trim()).filter(k => k);
    
    // 应用相关性过滤
    keywords = filterRelevantKeywords(keywords, topic);
    
    // 确保返回8个关键词，如果过滤后不够，则使用原关键词补充
    const originalKeywords = content.split(/[,，]/).map(k => k.trim()).filter(k => k);
    while (keywords.length < 8 && originalKeywords.length > keywords.length) {
      const nextKeyword = originalKeywords[keywords.length];
      if (nextKeyword && !keywords.includes(nextKeyword)) {
        keywords.push(nextKeyword);
      } else {
        break;
      }
    }
    
    return keywords.slice(0, 8);
  } catch (error) {
    console.error(`生成${dimensionId}关键词失败:`, error);
    throw error;
  }
}

// 生成简洁选题
export async function generateSimpleTopics(
  topic: string,
  dimensions: TriggerDimension[],
  sets: number = 1
): Promise<SimpleTopic[]> {
  try {
    if (!import.meta.env.VITE_OPENAI_API_KEY) {
      throw new Error('OpenAI API密钥未配置');
    }

    const isChinese = isChineseInput(topic);
    const totalCount = sets * 7;
    const prompt = getSimpleTopicGenerationPrompt(topic, dimensions, totalCount, isChinese);
    
    const response = await createChatCompletion({
      messages: [
        { role: 'system', content: isChinese ? '只输出标题，每行一条。' : 'Output only titles, one per line.' },
        { role: 'user', content: prompt }
      ],
      max_tokens: 1200,
      temperature: 0.8
    });

    const content = response.choices[0]?.message?.content || '';
    const topics = content.split('\n')
      .map(t => t.trim())
      .filter(t => t && !t.match(/^\d+[\.|、\)]\s*/))
      .map(t => t.replace(/^\d+[\.|、\)]\s*/, ''))
      .filter(t => t.length >= 8);
    return topics.slice(0, totalCount);
  } catch (error) {
    console.error('生成选题失败:', error);
    throw error;
  }
}

// 导出功能
export function exportSimpleTopics(
  topics: SimpleTopic[],
  topic: string,
  format: 'txt' | 'csv' | 'json' = 'txt'
): string {
  switch (format) {
    case 'json':
      return JSON.stringify({ topic, topics }, null, 2);
    case 'csv':
      return ['选题'].concat(topics).join('\n');
    case 'txt':
    default:
      return `九宫格选题 - ${topic}\n${'='.repeat(50)}\n\n` + topics.map((t, i) => `${i + 1}. ${t}`).join('\n');
  }
}