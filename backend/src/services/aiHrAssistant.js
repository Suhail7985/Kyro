const OpenAI = require('openai');

const FALLBACK_RESPONSES = [
  {
    keywords: ['leave', 'pto', 'vacation'],
    reply:
      'Leave requests can be submitted through your Employee dashboard. Standard policy: 18 days annual leave after probation.',
  },
  {
    keywords: ['payroll', 'salary', 'payslip'],
    reply: 'View payslips under Payroll on your dashboard. Payroll is processed on the last business day of each month.',
  },
  {
    keywords: ['interview', 'video', 'screening'],
    reply:
      'Complete your video interview from Applications → Record Interview. AI scores resumes automatically after upload.',
  },
  {
    keywords: ['attendance', 'check in', 'checkin'],
    reply: 'Use Check In / Check Out on the Employee dashboard. Remote work should be marked as remote status.',
  },
];

async function callLLM(systemPrompt, userMessage) {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) return null;
  try {
    const openai = new OpenAI({ apiKey });
    const res = await openai.chat.completions.create({
      model: process.env.OPENAI_MODEL || 'gpt-4o-mini',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userMessage },
      ],
      temperature: 0.5,
      max_tokens: 400,
    });
    return res.choices[0]?.message?.content?.trim() || null;
  } catch (e) {
    console.error('AI HR chat error:', e.message);
    return null;
  }
}

async function hrChatReply(message, userContext = {}) {
  const system = `You are Kyro HR Assistant for FWC IT Services. Answer briefly about HR, recruitment, attendance, payroll, and performance. User role: ${userContext.role || 'employee'}. Be professional and helpful.`;
  const llm = await callLLM(system, message);
  if (llm) return { reply: llm, source: 'ai' };

  const lower = message.toLowerCase();
  for (const item of FALLBACK_RESPONSES) {
    if (item.keywords.some((k) => lower.includes(k))) {
      return { reply: item.reply, source: 'rules' };
    }
  }
  return {
    reply:
      'I can help with leave, payroll, attendance, interviews, and applications. Try asking about one of these topics.',
    source: 'rules',
  };
}

module.exports = { hrChatReply };
