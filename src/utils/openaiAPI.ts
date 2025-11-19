import OpenAI from 'openai';
import { supabase } from '../lib/supabaseClient';

// LLM 提供商类型
export type LLMProvider = 'openai' | 'deepseek';

// 初始化 OpenAI 客户端
const openai = new OpenAI({
  apiKey: import.meta.env.VITE_OPENAI_API_KEY,
  dangerouslyAllowBrowser: true // 在生产环境中建议使用后端代理
});

// 当前使用的 LLM 提供商
let currentProvider: LLMProvider = ((): LLMProvider => {
  try {
    const saved = (typeof window !== 'undefined') ? (window.localStorage.getItem('llmProvider') as LLMProvider | null) : null;
    if (saved === 'deepseek' || saved === 'openai') return saved;
  } catch {}
  return 'openai';
})();

// 设置当前使用的 LLM 提供商
export function setLLMProvider(provider: LLMProvider) {
  currentProvider = provider;
  try {
    if (typeof window !== 'undefined') window.localStorage.setItem('llmProvider', provider);
  } catch {}
}

// 获取当前使用的 LLM 提供商
export function getCurrentLLMProvider(): LLMProvider {
  return currentProvider;
}

// 获取当前模型 (内部使用)
function getCurrentModel() {
  if (currentProvider === 'deepseek') {
    const deepseekModel = import.meta.env.VITE_DEEPSEEK_MODEL as string | undefined;
    return deepseekModel && deepseekModel.trim() ? deepseekModel : 'deepseek-chat';
  }
  const envModel = import.meta.env.VITE_OPENAI_MODEL as string | undefined;
  const fallback = 'gpt-4o-mini';
  if (!envModel || /gpt-5|invalid|kp/i.test(envModel)) return fallback;
  return envModel;
}

// --- 兼容 LLMSelector 的接口 ---

export function getLLMConfig() {
  return {
    provider: currentProvider,
    model: getCurrentModel()
  };
}

export function setLLMModel(modelName: string) {
  // 简单的逻辑映射：如果模型名包含 deepseek，则切换 provider 到 deepseek，否则切回 openai
  if (modelName.includes('deepseek')) {
    setLLMProvider('deepseek');
  } else {
    setLLMProvider('openai');
  }
}

// ---------------------------

// 获取当前客户端
export function getCurrentClient() {
  return openai;
}

// 统一的 Chat Completions 包装，自动在模型无效时回退到 gpt-4o-mini
export async function createChatCompletion(args: {
  messages: { role: 'system' | 'user' | 'assistant'; content: string }[];
  max_tokens: number;
  temperature: number;
}) {
  // 1. DeepSeek 处理逻辑
  if (currentProvider === 'deepseek') {
    const apiKey = import.meta.env.VITE_DEEPSEEK_API_KEY as string | undefined;
    const model = getCurrentModel();
    
    // 如果是开发环境且没有key，报错
    if (!apiKey && !import.meta.env.PROD) throw new Error('DeepSeek API 密钥未配置');
    
    try {
      const useProxy = typeof window !== 'undefined' && import.meta.env.PROD;
      const endpoint = useProxy ? '/api/deepseek' : 'https://api.deepseek.com/v1/chat/completions';
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      
      if (!useProxy) {
        // 仅在客户端直连时携带 Authorization
        headers['Authorization'] = `Bearer ${apiKey}`;
      } else {
        // 生产环境携带 Supabase Session Token
        const { data } = await supabase.auth.getSession();
        const token = data.session?.access_token;
        if (token) headers['Authorization'] = `Bearer ${token}`;
      }
      
      const resp = await fetch(endpoint, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          model,
          messages: args.messages,
          max_tokens: args.max_tokens,
          temperature: args.temperature,
          stream: false,
        }),
      });
      
      if (!resp.ok) {
        const txt = await resp.text().catch(() => '');
        // 如果是认证错误，抛出特定错误以便回退
        if (resp.status === 401) {
            throw new Error('DeepSeek Authentication Failed');
        }
        throw new Error(`DeepSeek API 调用失败: ${resp.status} ${txt}`);
      }
      
      const data = await resp.json();
      return data;
      
    } catch (error: any) {
      const msg = String(error?.message || '');
      // 仅在认证失败时回退到 OpenAI
      if (/Authentication Failed|401/i.test(msg)) {
        console.warn('DeepSeek 认证失败，自动回退到 OpenAI');
        // Fall through to OpenAI logic below
      } else {
        throw error;
      }
    }
  }

  // 2. OpenAI 处理逻辑
  // In production, use serverless proxy
  if (import.meta.env.PROD) {
    const model = getCurrentModel();
    const { data } = await supabase.auth.getSession();
    const token = data.session?.access_token;
    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    if (token) headers['Authorization'] = `Bearer ${token}`;
    
    const resp = await fetch('/api/openai', {
      method: 'POST',
      headers,
      body: JSON.stringify({
        model,
        messages: args.messages,
        max_tokens: args.max_tokens,
        temperature: args.temperature,
        stream: false,
      }),
    });
    
    if (!resp.ok) {
      const txt = await resp.text().catch(() => '');
      throw new Error(`OpenAI API 调用失败: ${resp.status} ${txt}`);
    }
    return await resp.json();
  }

  // Dev: direct SDK usage
  const client = getCurrentClient();
  let model = getCurrentModel();
  try {
    return await client.chat.completions.create({
      model,
      messages: args.messages,
      max_tokens: args.max_tokens,
      temperature: args.temperature,
    });
  } catch (error: any) {
    const msg = String(error?.message || error || '');
    // 如果模型名称错误，回退到 mini
    if (/model.*does not exist|invalid model/i.test(msg)) {
      console.warn(`Model ${model} failed, falling back to gpt-4o-mini`);
      model = 'gpt-4o-mini';
      return await client.chat.completions.create({
        model,
        messages: args.messages,
        max_tokens: args.max_tokens,
        temperature: args.temperature,
      });
    }
    throw error;
  }
}

// 检测是否为中文输入
function isChineseInput(text: string): boolean {
  const chineseRegex = /[\\u4e00-\\u9fff]/;
  return chineseRegex.test(text);
}

// 生成关键词的系统提示
function getSystemPrompt(type: 'domain' | 'who' | 'why', isChinese: boolean): string {
  const baseStyle = isChinese 
    ? "你是马来西亚资深短视频选题策划。请使用简体中文，并采用马来西亚本土化的中文表达习惯和词汇。" 
    : "Please respond in English.";

  const prompts = {
    domain: isChinese 
      ? `你是马来西亚资深短视频选题策划。${baseStyle}
        根据用户提供的主题，生成8个高度相关的关键词或关联字。
        这些关键词应该：
        1. 与主题密切相关，具有强关联性
        2. 覆盖主题的不同维度和角度
        3. 适合短视频内容创作
        4. 使用马来西亚华人常用的中文词汇
        5. 每个关键词2-6个字，简洁明了
        
        请只返回8个关键词，用逗号分隔，不要添加其他说明。`
      : `You are a professional viral content creation consultant. ${baseStyle}
        Based on the user's topic, generate 8 highly relevant keywords.
        Please return only 8 keywords, separated by commas, without additional explanations.`,
    
    who: isChinese
      ? `你是马来西亚资深短视频选题策划，兼具用户画像分析能力。${baseStyle}
        基于主题，请生成8个“场景化用户画像标签”（3-6字），要求：
        - 用“场景/角色/行为/诉求/限制”任意两项组合
        - 规避敏感定向（性别/年龄/群体标签）；优先中性场景化表达
        - 可使用本土职业/称呼：SME老板、Property Agent、Lazada卖家、Grab司机等
        - 仅输出8个标签，使用中文逗号分隔`
      : `You are a professional viral content user analyst. ${baseStyle}
        Generate 8 scene-based audience tags (3-6 words) for the topic. Return 8 tags only, comma-separated, no explanations.`,
    
    why: isChinese
      ? `你是马来西亚资深短视频选题策划，理解本地用户的人性与痛点表达。${baseStyle}
        根据主题，生成8个与该主题直接相关的核心痛点，需满足：
        - 2-6字，直击要害
        - 与主题直接相关，不能偏离
        - 使用马来西亚本土化表达
        - 能引起目标用户的即时情绪反应
        
        请返回8个与主题直接相关的痛点，用逗号分隔，不要解释。`
      : `You are a professional viral content psychological analyst. ${baseStyle}
        Based on the provided topic, analyze and generate 8 core pain points directly related to that topic.
        Please return 8 pain points directly related to the topic, separated by commas, without explanations.`
  };

  return prompts[type];
}

// 生成爆款选题的系统提示
function getTopicGenerationPrompt(isChinese: boolean, count: number): string {
  return isChinese
    ? `你是马来西亚资深短视频爆款选题策划，使用简体中文与本土化表达，为 IG Reels / TikTok / YouTube Shorts 生成吸引点击的优质选题。

输出规则：
总数 ${count} 条选题，确保以下六类主题均衡覆盖（分类自然融入标题，不需要输出分类标签）：
真人真事、争议讨论、好奇心理、利益驱动、经验价值、FOMO心态

标题长度15–40字，口语化、信息前置、钩子强烈，避免模板化句式。
每个标题必须包含以下爆款元素中的至少三项：具体数字、对比冲突、明确对象、紧迫感、价值承诺。

请直接生成 ${count} 条选题，不要添加序号，不要添加分类前缀，每行一条。`
    : `You are a Malaysian senior short-form topic strategist.
      Generate ${count} viral topics balanced across categories: Real Story, Debate, Curiosity, Benefit, Experience, FOMO.
      Output one topic per line, no numbering, no category prefixes.
      8–20 words per line, spoken, clear hook.`;
}

// 调用 OpenAI API 生成关键词
export async function generateKeywords(
  type: 'domain' | 'who' | 'why',
  domainInput: string,
  lockedKeywords: string[] = []
): Promise<string[]> {
  try {
    // 检查 API 密钥
    const apiKey = import.meta.env.VITE_OPENAI_API_KEY;
    if (!apiKey) throw new Error('OpenAI API 密钥未配置');

    const isChinese = isChineseInput(domainInput);
    const systemPrompt = getSystemPrompt(type, isChinese);
    
    const userPrompt = isChinese
      ? `主题：${domainInput}
        ${lockedKeywords.length > 0 ? `已锁定的关键词：${lockedKeywords.join(', ')}` : ''}
        ${lockedKeywords.length > 0 ? `请生成${8 - lockedKeywords.length}个新的关键词，避免与已锁定的关键词重复。` : '请生成8个关键词。'}`
      : `Topic: ${domainInput}
        ${lockedKeywords.length > 0 ? `Locked keywords: ${lockedKeywords.join(', ')}` : ''}
        ${lockedKeywords.length > 0 ? `Please generate ${8 - lockedKeywords.length} new keywords, avoiding duplication with locked keywords.` : 'Please generate 8 keywords.'}`;

    const response = await createChatCompletion({
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      max_tokens: 200,
      temperature: 0.7,
    });

    const content = response.choices[0]?.message?.content || '';
    const keywords = content
      .split(/[，,、;；\n\r\t\|]+/)
      .map(k => k.trim())
      .filter(k => k);
    
    const neededCount = 8 - lockedKeywords.length;
    const finalKeywords = keywords.slice(0, neededCount);
    
    return [...lockedKeywords, ...finalKeywords];
  } catch (error) {
    console.error('OpenAI API 调用失败:', error);
    throw new Error('生成失败');
  }
}

// 调用 API 生成爆款选题
export async function generateTopics(
  domainSelected: string[],
  whoSelected: string[],
  whySelected: string[],
  count: number
): Promise<string[]> {
  try {
    // 检查 API 密钥
    const apiKey = import.meta.env.VITE_OPENAI_API_KEY;
    if (!apiKey) throw new Error('OpenAI API 密钥未配置');

    const isChinese = isChineseInput(domainSelected[0] || '');
    const systemPrompt = getTopicGenerationPrompt(isChinese, count);
    
    const userPrompt = isChinese
      ? `请基于以下三个维度的关键词，生成 ${count} 个具有爆款潜力的短视频选题：
        
        领域关键词：${domainSelected.join(', ')}
        目标人群：${whoSelected.join(', ')}
        痛点需求：${whySelected.join(', ')}
        
        请生成 ${count} 个爆款选题：`
      : `Please generate ${count} viral short video topics based on the following three dimensions:
        Domain keywords: ${domainSelected.join(', ')}
        Target audience: ${whoSelected.join(', ')}
        Pain points: ${whySelected.join(', ')}
        Generate ${count} viral topics:`;

    const response = await createChatCompletion({
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      max_tokens: 1000,
      temperature: 0.8,
    });

    let content = response.choices[0]?.message?.content || '';
    content = content.replace(/```[a-zA-Z]*\n([\s\S]*?)```/g, '$1').trim();

    let topics = content
      .split(/\r?\n+/)
      .map(t => t.trim())
      .filter(t => t && !/^[-•]\s*$/.test(t) && !/^\d+[\.、\)]\s*$/.test(t))
      .map(t => t.replace(/^\d+[\.、\)]\s*/, ''))
      .map(t => t.replace(/^[-•*]\s*/, ''))
      .filter(t => t.length >= 6);

    if (topics.length === 0) {
      topics = content.split(/[；;。\n]/).map(s => s.trim()).filter(s => s.length >= 6);
    }

    return topics.slice(0, count);
  } catch (error) {
    console.error('OpenAI API 调用失败:', error);
    throw new Error('生成失败');
  }
}

// 选题分类
export type TopicCategory = '真人真事' | '争议讨论' | '好奇心理' | '利益驱动' | '经验价值' | 'FOMO心态';

export async function classifyTopics(topics: string[], language: 'zh' | 'en' = 'zh'): Promise<TopicCategory[]> {
  if (!topics.length) return [];
  
  // 本地简单分类兜底
  const fallbackLabels = topics.map(() => '好奇心理' as TopicCategory);

  try {
    // 为节省 Tokens，可以先只用简单的正则判定，或者如果需要精确再调 API。
    // 这里为了保持组件接口兼容，直接返回一个基于正则或简单逻辑的分类，
    // 或者直接返回空数组让前端不显示标签（如果 API 额度有限）。
    // 下面是一个简化版的正则分类实现：
    
    const labels: TopicCategory[] = topics.map(t => {
      if (/钱|赚|省|惠|值|益/.test(t)) return '利益驱动';
      if (/我|经历|事|妈|爸|友/.test(t)) return '真人真事';
      if (/揭秘|真相|内幕|\?/.test(t)) return '好奇心理';
      if (/坑|避雷|注意|错/.test(t)) return '争议讨论';
      if (/招|法|教|步/.test(t)) return '经验价值';
      if (/快|限|晚|停/.test(t)) return 'FOMO心态';
      return '经验价值';
    });
    return labels;

  } catch {
    return fallbackLabels;
  }
}