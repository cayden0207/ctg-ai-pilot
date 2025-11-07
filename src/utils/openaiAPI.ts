import OpenAI from 'openai';

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

// 获取当前客户端
function getCurrentClient() {
  return openai;
}

// 获取当前模型
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

// 统一的 Chat Completions 包装，自动在模型无效时回退到 gpt-4o-mini
export async function createChatCompletion(args: {
  messages: { role: 'system' | 'user' | 'assistant'; content: string }[];
  max_tokens: number;
  temperature: number;
}) {
  if (currentProvider === 'deepseek') {
    const apiKey = import.meta.env.VITE_DEEPSEEK_API_KEY as string | undefined;
    const model = getCurrentModel();
    if (!apiKey && !import.meta.env.PROD) throw new Error('DeepSeek API 密钥未配置');
    try {
      const useProxy = typeof window !== 'undefined' && import.meta.env.PROD;
      const endpoint = useProxy ? '/api/deepseek' : 'https://api.deepseek.com/v1/chat/completions';
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (!useProxy) {
        // 仅在客户端直连时携带 Authorization；生产环境通过 Vercel 函数代理，不暴露密钥
        headers['Authorization'] = `Bearer ${apiKey}`;
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
        const err = new Error(`DeepSeek API 调用失败: ${resp.status} ${txt}`) as any;
        err.status = resp.status;
        // 将错误类型穿透，避免把 invalid_request_error 误判为认证失败
        if (txt && typeof txt === 'string') {
          try { err.body = JSON.parse(txt); } catch {}
        }
        throw err;
      }
      const data = await resp.json();
      return data;
    } catch (error: any) {
      const msg = String(error?.message || '');
      const status = Number(error?.status || 0);
      const bodyType = (error?.body && error.body.error && error.body.error.type) || '';
      // 仅在明确的认证失败时回退
      if (status === 401 || /authentication_error/i.test(bodyType)) {
        console.warn('DeepSeek 认证失败，自动回退到 OpenAI');
        // fall through to OpenAI branch below
      } else {
        throw error;
      }
    }
  }

  // In production, use serverless proxy for OpenAI as well
  if (import.meta.env.PROD) {
    const model = getCurrentModel();
    const resp = await fetch('/api/openai', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
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

  // Dev: direct SDK
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
    if (/invalid model/i.test(msg)) {
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
  const chineseRegex = /[\u4e00-\u9fff]/;
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
        
        🎯 **关键词生成要求：**
        - 专注于主题的核心关联性和延伸性
        - 涵盖主题的不同角度和层面
        - 包含相关的细分领域和概念
        - 适合马来西亚华人常用的表达方式
        
        这些关键词应该：
        1. 与主题密切相关，具有强关联性
        2. 覆盖主题的不同维度和角度
        3. 适合短视频内容创作
        4. 使用马来西亚华人常用的中文词汇
        5. 每个关键词2-6个字，简洁明了
        6. 容易理解，贴近生活
        
        请只返回8个关键词，用逗号分隔，不要添加其他说明。`
      : `You are a professional viral content creation consultant. ${baseStyle}
        Based on the user's topic, generate 8 highly relevant keywords or sub-domains with viral potential.
        These keywords should be:
        1. Closely related to the topic with viral potential
        2. Suitable for short video content creation that captures strong user attention
        3. Have high search value and traffic potential
        4. 2-6 words each, catchy and memorable
        5. Spark user curiosity and click desire
        Please return only 8 keywords, separated by commas, without additional explanations.`,
    
    who: isChinese
      ? `你是马来西亚资深短视频选题策划，兼具用户画像分析能力。${baseStyle}
        基于主题，请生成8个“场景化用户画像标签”（3-6字），要求：
        - 用“场景/角色/行为/诉求/限制”任意两项组合；示例：通勤健身、久坐上班、外食族、夜跑党、控糖减脂、乳糖不耐、增肌备赛、家庭健身、学生宿舍、低预算党
        - 避免过于泛化或空洞词：如“健康追求/饮食控/营养补充/爱好者/族群”等单一概念；需贴近具体生活场景与动机
        - 规避敏感定向（性别/年龄/群体标签）；优先中性场景化表达
        - 可使用本土职业/称呼：SME老板、Property Agent、Lazada卖家、Grab司机、Marketer、上班族、自由职业者、学生等
        - 仅输出8个标签，使用中文逗号分隔，不要编号或解释`
      : `You are a professional viral content user analyst. ${baseStyle}
        Generate 8 scene-based audience tags (3-6 words) for the topic. Combine scene/role/action/intent/constraint, e.g., commuting workout, desk job, eat-out group, night runner, low-sugar cutting, lactose-intolerant, bulking for contest, home workout, dorm student, budget-limited. Avoid vague single-concept words. Use neutral scene phrasing over sensitive demographics. Return 8 tags only, comma-separated, no explanations.`,
    
    why: isChinese
      ? `你是马来西亚资深短视频选题策划，理解本地用户的人性与痛点表达，擅长制造“秒停”级别的痛点触发。${baseStyle}
        
        **重要**：你必须严格针对用户提供的主题，生成与该主题直接相关的痛点。
        
        根据主题，生成8个与该主题直接相关的核心痛点，需满足：
        
        🎯 **痛点设计策略：**
        1. **严格围绕主题**：痛点必须与主题紧密相关，不能偏离主题
        2. **具体场景化**：针对主题的具体痛点场景（如主题是"情绪管理"，痛点应该是"压力大"、"焦虑"、"失眠"等）
        3. **情感触发**：能瞬间引起目标用户的情感共鸣
        4. **马来西亚本土化**：使用马来西亚华人常用的表达方式
        
        ⚡ **痛点必须符合：**
        - 2-6字，直击要害
        - 与主题直接相关，不能偏离
        - 具体而非模糊（如主题"健身"的痛点："腰酸背痛"、"体重超标"、"没时间运动"）
        - 使用马来西亚本土化表达
        - 能引起目标用户的即时情绪反应
        
        **示例**：
        - 主题"情绪管理"的痛点：压力大、焦虑、失眠、情绪失控、抑郁、暴躁、紧张、心烦意乱
        - 主题"减肥"的痛点：体重超标、腰粗、双下巴、穿衣不好看、自信心不足、反弹、节食痛苦、运动坚持不了
        
        请返回8个与主题直接相关的痛点，用逗号分隔，不要解释。`
      : `You are a professional viral content psychological analyst. ${baseStyle}
        
        **Important**: You must strictly generate pain points directly related to the user-provided topic.
        
        Based on the provided topic, analyze and generate 8 core pain points directly related to that topic. Requirements:
        
        🎯 **Pain Point Design Strategy:**
        1. **Strictly Focus on Topic**: Pain points must be closely related to the topic, not deviate
        2. **Specific Scenarios**: Target specific pain point scenarios related to the topic 
        3. **Emotional Triggers**: Should instantly trigger emotional resonance from target users
        
        ⚡ **Pain Points Must Meet:**
        - 2-6 words, hitting the core issue
        - Directly related to the topic, no deviation
        - Specific rather than vague (e.g., for "fitness" topic: "back pain", "overweight", "no time to exercise")
        - Can trigger immediate emotional reactions from target users
        
        **Examples**:
        - Topic "emotional management" pain points: stress, anxiety, insomnia, emotional outbursts, depression, irritability, nervousness, restlessness
        - Topic "weight loss" pain points: overweight, thick waist, double chin, clothes don't fit, low confidence, rebound, diet pain, can't stick to exercise
        
        Please return 8 pain points directly related to the topic, separated by commas, without explanations.`
  };

  return prompts[type];
}

// 生成爆款选题的系统提示
function getTopicGenerationPrompt(isChinese: boolean, count: number): string {
  return isChinese
    ? `你是马来西亚资深短视频选题策划，使用简体中文与本土化表达，为 IG Reels / TikTok / YouTube Shorts 生成选题。

      输出规则：每行一个，前缀必须包含以下六类之一（中括号保留）：
      【真人真事】、【争议讨论】、【好奇心理】、【利益驱动】、【经验价值】、【FOMO心态】
      - 总数 ${count} 条，六类尽量均衡
      - 标题15–40字，口语化，信息前置，有钩子与场景
      - 尽量包含对比/数字/对象/动作等元素增强点击
      - 合规：避免夸大/绝对化/贬损，避免敏感人群直指

      请直接生成，不要解释或空行：`
    : `You are a Malaysian senior short-form topic strategist.

      Output each topic on one line, prefixed with one of six categories (keep brackets):
      [Real Story], [Debate], [Curiosity], [Benefit], [Experience], [FOMO]
      - Total ${count}, balanced across categories
      - 8–20 words per line, spoken, clear hook and scene
      - Add contrast/numbers/object cues when possible
      - Compliant wording; avoid absolute claims and sensitive targeting

      Generate now, no explanations:`;
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
    
    if (!apiKey) {
      throw new Error('OpenAI API 密钥未配置');
    }

    const client = getCurrentClient();
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
    // 兼容中英文逗号/顿号/换行/分号/竖线等分隔
    const keywords = content
      .split(/[，,、;；\n\r\t\|]+/)
      .map(k => k.trim())
      .filter(k => k);
    
    // 确保返回正确数量的关键词
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
    
    if (!apiKey) {
      throw new Error('OpenAI API 密钥未配置');
    }

    const client = getCurrentClient();
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

    const content = response.choices[0]?.message?.content || '';
    const topics = content
      .split('\n')
      .map(t => t.trim())
      // 接受以【类别】或[Category]开头的行；仅过滤空行/纯编号/纯短划线
      .filter(t => t && !t.match(/^\d+\./) && !t.match(/^[-•]\s*$/))
      .map(t => t.replace(/^\d+[\.|、)]\s*/, ''))
      .filter(t => t.length > 6); // 放宽长度，防止被过度过滤
    
    return topics.slice(0, count);
  } catch (error) {
    console.error('OpenAI API 调用失败:', error);
    throw new Error('生成失败');
  }
} 

// 根据选题生成完整内容卡（HOOK/定位/痛点/方案/CTA）
export async function generateContentPlan(topic: string, language: 'zh' | 'en' = 'zh') {
  const client = getCurrentClient();
  const model = getCurrentModel();
  const isChinese = language === 'zh' || isChineseInput(topic);

  const system = isChinese
    ? `你是马来西亚资深短视频选题策划与脚本教练。严格输出 JSON（仅 JSON）。
公式：HOOK -> 定位 -> 痛点/共鸣/主题 -> 方案/做法 -> CTA（行动呼吁）。
平台：Reels/TikTok/Shorts；时长建议15–35秒；语言口语化、可拍、信息前置，避免夸大与绝对化。
篇幅要求：
- HOOK：1句，强钩子（对比/数字/悬念/问题）
- 定位：1句，告诉观众“你是谁/这条对谁有用”
- 痛点：2–3句，具体到场景/感受/成本
- 方案：分点3–5条，每条<=20字，能直接照做（步骤/动作/比例/时机/注意点等）
- CTA：1句，评论关键词/收藏/关注/私信引导，其一即可
- outline：5–7条镜头脚本或字幕建议（含画面/镜头/字幕提示）`
    : `You are a Malaysian senior short-form video strategist and script coach. Output JSON only. Formula: HOOK -> Positioning -> Painpoint -> Solution -> CTA. Duration 15–35s. Style: spoken, shootable, practical. Length: HOOK 1 line; positioning 1 line; painpoint 2–3 sentences; solution 3–5 bullet points (<=20 words each); CTA 1 line; outline 5–7 shot/overlay cues.`;

  const user = isChinese
    ? `选题：${topic}
请基于上面公式生成完整内容卡。字段：{hook, positioning, painpoint, solution, cta, outline}。
注意：solution 用1段内的短句并用顿号或分号分隔呈现3–5条；outline 至少5条。不得输出解释文本。`
    : `Topic: ${topic}
Generate a complete content card with fields {hook, positioning, painpoint, solution, cta, outline}. Provide 3–5 concise solution bullets in one field (separated by commas/semicolons) and at least 5 outline items.`;

  const resp = await createChatCompletion({
    messages: [
      { role: 'system', content: system },
      { role: 'user', content: user },
    ],
    temperature: 0.7,
    max_tokens: 800,
  });

  const content = resp.choices[0]?.message?.content || '{}';
  try {
    return JSON.parse(content);
  } catch {
    // 尝试简单修复尾随字符
    const fixed = content.replace(/```json|```/g, '').trim();
    return JSON.parse(fixed);
  }
} 
