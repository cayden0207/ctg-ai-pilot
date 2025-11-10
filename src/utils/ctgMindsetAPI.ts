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
    const apiKey = import.meta.env.VITE_OPENAI_API_KEY;

    // 构建对话历史
    const messages = [
      ...conversationHistory.map(msg => ({
        role: msg.role,
        content: msg.content
      })),
      {
        role: 'user' as const,
        content: message
      }
    ];

    // 构建请求体 - 使用最新的 Responses API 格式
    const requestBody = {
      prompt: {
        id: PROMPT_ID,
        version: "4"
      },
      input: messages  // 使用 input 参数而不是 messages
    };

    // 直接调用 OpenAI Responses API
    const response = await fetch('https://api.openai.com/v1/responses', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify(requestBody)
    });

    if (!response.ok) {
      const errorData = await response.text();
      console.error('API Error:', errorData);
      throw new Error(`API request failed: ${response.status}`);
    }

    const data = await response.json();

    // 提取回复内容
    const content = data.choices?.[0]?.message?.content ||
                   data.choices?.[0]?.text ||
                   data.output ||
                   '抱歉，我暂时无法回答。请稍后再试。';

    return content;
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