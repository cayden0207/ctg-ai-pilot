export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  try {
    const apiKey = process.env.DEEPSEEK_API_KEY || process.env.VITE_DEEPSEEK_API_KEY;
    if (!apiKey) {
      return res.status(500).json({ error: 'DEEPSEEK_API_KEY not configured' });
    }

    const {
      model = 'deepseek-chat',
      messages = [],
      max_tokens = 800,
      temperature = 0.7,
      stream = false,
    } = req.body || {};

    // 验证模型名称 - DeepSeek 官方支持的模型
    const validModels = ['deepseek-chat', 'deepseek-reasoner'];
    if (!validModels.includes(model)) {
      console.warn(`警告: 使用的模型 '${model}' 可能无效。有效模型: ${validModels.join(', ')}`);
    }

    const upstream = await fetch('https://api.deepseek.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({ model, messages, max_tokens, temperature, stream }),
    });

    const text = await upstream.text();
    let data: any = null;
    try { data = JSON.parse(text); } catch { /* keep text */ }

    if (!upstream.ok) {
      return res.status(upstream.status).send(data || text);
    }
    return res.status(200).send(data || text);
  } catch (err: any) {
    return res.status(500).json({ error: 'Proxy error', detail: String(err?.message || err || 'unknown') });
  }
}

