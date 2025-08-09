import OpenAI from 'openai';

// 初始化 OpenAI 客户端
const openai = new OpenAI({
  apiKey: import.meta.env.VITE_OPENAI_API_KEY,
  dangerouslyAllowBrowser: true
});

// 内容类型定义
export interface ContentType {
  position: number;
  type: string;
  formula: string;
  icon: string;
  color: string;
}

// 选题评分
export interface TopicScores {
  viral: number;      // 爆款潜力 1-5
  engagement: number; // 互动潜力 1-5
  spread: number;     // 传播潜力 1-5
}

// 生成的选题
export interface GridTopic {
  content: string;
  formula: string;
  scores?: TopicScores;
  visualHook?: string;
  interaction?: string;
}

// 九宫格公式定义
const FORMULAS = {
  reveal: {
    name: '揭秘型',
    pattern: '[行业秘密]+[震撼真相]+[强对比视觉]+[立即验证]',
    example: '99%的人都不知道...',
    hooks: ['原来', '竟然', '秘密', '真相', '揭秘', '内幕']
  },
  tutorial: {
    name: '教学型',
    pattern: '[生活场景]+[神技巧]+[惊人效果]+[病毒挑战]',
    example: '30秒学会...',
    hooks: ['教你', '学会', '技巧', '方法', '秒懂', '轻松']
  },
  story: {
    name: '故事型',
    pattern: '[意外事件]+[过程揭秘]+[惊人反转]+[强烈好奇]',
    example: '我连续7天...',
    hooks: ['故事', '经历', '发生', '结果', '反转', '意外']
  },
  comparison: {
    name: '对比型',
    pattern: '[A选项]+[B选项]+[数据对比]+[意外结论]',
    example: 'A vs B，结果惊人...',
    hooks: ['对比', 'VS', '区别', '不同', '选择', 'PK']
  },
  challenge: {
    name: '挑战型',
    pattern: '[挑战内容]+[难度等级]+[奖励机制]+[参与方式]',
    example: '挑战：不花一分钱...',
    hooks: ['挑战', '敢不敢', '试试', '测试', '能不能', '挑战']
  },
  data: {
    name: '数据型',
    pattern: '[测试实验]+[震撼数据]+[意外结果]+[权威解读]',
    example: '测试了100个...',
    hooks: ['数据', '测试', '统计', '分析', '研究', '实验']
  },
  trending: {
    name: '热点型',
    pattern: '[网络热梗]+[本土化改编]+[创意融合]+[模仿跟风]',
    example: '最新热梗...',
    hooks: ['热点', '热门', '火爆', '刷屏', '爆红', '病毒']
  },
  ugc: {
    name: 'UGC型',
    pattern: '[热门痛点]+[群体共鸣]+[高价值奖励]+[病毒传播]',
    example: '征集最佳...',
    hooks: ['征集', '分享', '评论', '投票', '互动', '参与']
  },
  core: {
    name: '核心主题',
    pattern: '[主题概述]',
    example: '关于...',
    hooks: []
  }
};

// 检测是否为中文输入
function isChineseInput(text: string): boolean {
  const chineseRegex = /[\u4e00-\u9fff]/;
  return chineseRegex.test(text);
}

// 生成简化的系统提示
function createSystemPrompt(isChinese: boolean): string {
  const language = isChinese ? '使用简体中文' : 'Use English';
  
  return `你是一位专业的短视频爆款内容创作专家，专门为 IG Reels、TikTok、YouTube Shorts 创作病毒式传播内容。${language}。

核心要求：
1. 每个选题必须在前3秒内有强烈钩子
2. 长度控制在15-40字
3. 必须包含视觉提示（用括号标注）
4. 结尾要有互动指令
5. 避免重复和模板化

内容公式：
- 揭秘型：颠覆认知的行业秘密或真相
- 教学型：简单实用的技巧或方法
- 故事型：有反转和悬念的真实故事
- 对比型：出人意料的对比结果
- 挑战型：激发参与欲的挑战活动
- 数据型：震撼的数据和实验结果
- 热点型：结合当下热门话题
- UGC型：征集用户参与和分享

评分标准（1-5分）：
- 爆款潜力：标题吸引力、话题性
- 互动潜力：能否引发评论和讨论
- 传播潜力：用户分享意愿

请根据用户提供的主题和指定的内容类型，生成相应的爆款选题。`;
}

// 解析AI响应
function parseAIResponse(content: string, formula: string): GridTopic[] {
  const lines = content.split('\n').filter(line => line.trim());
  const topics: GridTopic[] = [];
  
  for (const line of lines) {
    // 移除可能的编号和标记
    let cleanContent = line
      .replace(/^\d+[\.\、]\s*/, '')
      .replace(/^[-\*]\s*/, '')
      .replace(/^【.*?】\s*/, '')
      .trim();
    
    if (cleanContent.length > 10) {
      // 提取视觉钩子（括号内容）
      const visualMatch = cleanContent.match(/（([^）]+)）/);
      const visualHook = visualMatch ? visualMatch[1] : '';
      
      // 简单评分逻辑
      const scores: TopicScores = {
        viral: Math.floor(Math.random() * 2) + 3,      // 3-5
        engagement: Math.floor(Math.random() * 2) + 3, // 3-5
        spread: Math.floor(Math.random() * 2) + 3      // 3-5
      };
      
      // 根据内容特征调整分数
      if (cleanContent.includes('99%') || cleanContent.includes('秘密')) scores.viral = 5;
      if (cleanContent.includes('评论') || cleanContent.includes('你呢')) scores.engagement = 5;
      if (cleanContent.includes('分享') || cleanContent.includes('@')) scores.spread = 5;
      
      topics.push({
        content: cleanContent,
        formula,
        scores,
        visualHook,
        interaction: cleanContent.split(/[！？。]/).pop() || ''
      });
    }
  }
  
  return topics;
}

// 生成九宫格内容
export async function generateNineGridTopics(
  mainTopic: string,
  contentTypes: ContentType[],
  countPerType: number = 1
): Promise<(GridTopic | null)[]> {
  try {
    // 检查 API 密钥
    if (!import.meta.env.VITE_OPENAI_API_KEY) {
      throw new Error('OpenAI API 密钥未配置');
    }

    const isChinese = isChineseInput(mainTopic);
    const systemPrompt = createSystemPrompt(isChinese);
    
    // 为每个内容类型生成提示
    const prompts = contentTypes.map(ct => {
      if (ct.formula === 'core') {
        return null; // 核心主题格不需要生成
      }
      
      const formula = FORMULAS[ct.formula as keyof typeof FORMULAS];
      const prompt = isChinese
        ? `主题：${mainTopic}
类型：${formula.name}
模式：${formula.pattern}
示例风格：${formula.example}
关键词：${formula.hooks.join('、')}

请生成${countPerType}个${formula.name}的爆款选题，每行一个。`
        : `Topic: ${mainTopic}
Type: ${formula.name}
Pattern: ${formula.pattern}
Example style: ${formula.example}
Keywords: ${formula.hooks.join(', ')}

Generate ${countPerType} viral topics of ${formula.name} type, one per line.`;
      
      return prompt;
    });

    // 批量调用API
    const results = await Promise.all(
      prompts.map(async (prompt, index) => {
        if (!prompt) return null; // 核心主题格
        
        try {
          const response = await openai.chat.completions.create({
            model: import.meta.env.VITE_OPENAI_MODEL || 'gpt-5',
            messages: [
              { role: 'system', content: systemPrompt },
              { role: 'user', content: prompt }
            ],
            max_tokens: 200,
            temperature: 0.8
          });
          
          const content = response.choices[0]?.message?.content || '';
          const topics = parseAIResponse(content, contentTypes[index].formula);
          return topics[0] || null; // 返回第一个生成的选题
        } catch (error) {
          console.error(`生成${contentTypes[index].type}失败:`, error);
          return null;
        }
      })
    );
    
    return results;
  } catch (error) {
    console.error('生成九宫格内容失败:', error);
    throw error;
  }
}

// 生成单个格子的内容
export async function generateSingleGridTopic(
  mainTopic: string,
  contentType: ContentType,
  count: number = 1
): Promise<GridTopic[]> {
  try {
    const results = await generateNineGridTopics(mainTopic, [contentType], count);
    return results.filter(r => r !== null) as GridTopic[];
  } catch (error) {
    console.error('生成单个内容失败:', error);
    throw error;
  }
}

// 导出内容到不同格式
export function exportTopics(
  topics: (GridTopic | null)[],
  format: 'txt' | 'json' | 'csv' = 'txt'
): string {
  const validTopics = topics.filter(t => t !== null) as GridTopic[];
  
  switch (format) {
    case 'json':
      return JSON.stringify(validTopics, null, 2);
      
    case 'csv':
      const headers = '类型,内容,爆款潜力,互动潜力,传播潜力\n';
      const rows = validTopics.map(t => 
        `"${t.formula}","${t.content}",${t.scores?.viral || 0},${t.scores?.engagement || 0},${t.scores?.spread || 0}`
      ).join('\n');
      return headers + rows;
      
    case 'txt':
    default:
      return validTopics.map((t, i) => 
        `【${FORMULAS[t.formula as keyof typeof FORMULAS]?.name || t.formula}】\n${t.content}\n`
      ).join('\n');
  }
}