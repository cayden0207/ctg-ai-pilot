// CTG Mindset API using OpenAI Responses API
// Prompt ID configuration
const PROMPT_ID = 'pmpt_6911bddc52d8819495031148eefb4b9907f171754493354a';

// 对话消息类型
export interface CTGMessage {
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

// 发送消息到 CTG Mindset
export async function sendCTGMessage(
  message: string,
  conversationHistory: CTGMessage[] = []
): Promise<string> {
  try {
    // 统一构建对话历史（仅保留 role/content，避免 Date 直接序列化）
    const history = conversationHistory.map(msg => ({ role: msg.role, content: msg.content }));
    const fullMessages = [
      ...history,
      { role: 'user' as const, content: message },
    ];

    // 选择模型（对明显无效的值回退到 gpt-4o-mini）
    const envModel = (import.meta.env.VITE_OPENAI_MODEL as string | undefined) || 'gpt-4o-mini';
    const model = !envModel || /gpt-5|invalid|kp/i.test(envModel) ? 'gpt-4o-mini' : envModel;

    // 在生产环境通过 Vercel 函数代理，不在前端暴露 API Key
    const endpoint = import.meta.env.PROD ? '/api/responses' : 'https://api.openai.com/v1/responses';

    // 构建请求体：使用 Prompt ID，并同时提供常见变量名，方便 Prompt 取值
    const body: any = {
      model,
      prompt: { id: PROMPT_ID },
      input: {
        // 常见变量名覆盖（Prompt 可任选其一使用）
        question: message,
        query: message,
        latest: message,
        input: message,
        context: history,
        history,
        messages: fullMessages,
      },
    };

    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    if (!import.meta.env.PROD) {
      const apiKey = import.meta.env.VITE_OPENAI_API_KEY as string | undefined;
      if (!apiKey) throw new Error('OpenAI API 密钥未配置（开发环境）');
      headers['Authorization'] = `Bearer ${apiKey}`;
    }

    let resp = await fetch(endpoint, {
      method: 'POST',
      headers,
      body: JSON.stringify(body),
    });

    // 如果因为 Prompt 输入验证失败，尝试无 Prompt 的降级路径（直接将对话作为 input）
    if (!resp.ok && resp.status >= 400 && resp.status < 500) {
      try {
        const txt = await resp.text();
        // 简单判断：如果提示 input/variables 不匹配，则改用 messages 直连 Responses
        if (/input|variable|messages/i.test(txt)) {
          const fallbackBody: any = { model, input: fullMessages };
          resp = await fetch(endpoint, {
            method: 'POST',
            headers,
            body: JSON.stringify(fallbackBody),
          });
        } else {
          // 不是变量问题，直接抛出
          throw new Error(`API request failed: ${resp.status} ${txt}`);
        }
      } catch (e) {
        throw e;
      }
    }

    if (!resp.ok) {
      const errText = await resp.text().catch(() => '');
      throw new Error(`API request failed: ${resp.status} ${errText}`);
    }

    const data = await resp.json();
    // 兼容 Responses API 响应结构与旧 Chat Completions 结构
    let content = '';

    // Responses API: 优先使用 output_text 或 output 数组
    if (typeof data?.output_text === 'string' && data.output_text.trim()) {
      content = data.output_text;
    } else if (Array.isArray(data?.output) && data.output.length > 0) {
      // 寻找第一个文本类型的内容
      const first = data.output.find((o: any) => Array.isArray(o?.content) && o.content.length > 0) || data.output[0];
      const part = Array.isArray(first?.content) ? first.content.find((c: any) => typeof c?.text === 'string') : null;
      if (part?.text) content = part.text;
    }

    // Chat Completions 兼容
    if (!content && Array.isArray(data?.choices) && data.choices.length > 0) {
      const ch = data.choices[0];
      if (typeof ch?.message?.content === 'string') content = ch.message.content;
      else if (typeof ch?.text === 'string') content = ch.text;
    }

    if (!content && typeof data === 'string') content = data;
    if (!content) content = '抱歉，我暂时无法回答。请稍后再试。';
    return String(content);
  } catch (error) {
    console.error('CTG Mindset API 调用失败:', error);
    throw new Error('对话生成失败，请检查网络连接');
  }
}

// 清除对话历史（本地管理）
export function clearThread(): void {
  // 这个功能现在由前端组件管理对话历史
  // 保留这个函数以保持接口兼容性
}

// 获取历史消息（本地管理）
export async function getThreadMessages(): Promise<CTGMessage[]> {
  // 现在消息历史由前端组件管理
  // 返回空数组以保持接口兼容性
  return [];
}

// 预设问题示例
export const EXAMPLE_QUESTIONS = [
  {
    category: '战略定位',
    questions: [
      '我的产品如何找到差异化定位？',
      '如何确定我的第一目标客群？',
      '我应该聚焦哪个细分市场？'
    ]
  },
  {
    category: '利润结构',
    questions: [
      '如何提高产品毛利率到30%以上？',
      '我产品卖不动，该降价吗？',
      '如何设计合理的定价策略？'
    ]
  },
  {
    category: '系统经营',
    questions: [
      '如何把业务流程标准化？',
      '如何建立可复制的运营系统？',
      '团队扩张时如何保持效率？'
    ]
  },
  {
    category: '增长策略',
    questions: [
      '如何提高客户复购率？',
      '投放ROI低于1.5怎么办？',
      '如何突破增长瓶颈？'
    ]
  }
];
