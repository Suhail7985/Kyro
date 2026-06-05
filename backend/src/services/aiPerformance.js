const OpenAI = require('openai');

async function generatePerformanceInsights(review) {
  const apiKey = process.env.OPENAI_API_KEY;
  const text = `Goals: ${(review.goals || []).join('; ')}
Achievements: ${review.achievements || 'N/A'}
Rating: ${review.rating || 'N/A'}/5
Feedback: ${review.feedback || 'N/A'}`;

  if (apiKey) {
    try {
      const openai = new OpenAI({ apiKey });
      const res = await openai.chat.completions.create({
        model: process.env.OPENAI_MODEL || 'gpt-4o-mini',
        messages: [
          {
            role: 'user',
            content: `Analyze this performance review and respond JSON only: {"summary":"2-3 sentences","recommendations":["tip1","tip2","tip3"]}\n${text}`,
          },
        ],
        response_format: { type: 'json_object' },
        temperature: 0.4,
      });
      return JSON.parse(res.choices[0]?.message?.content || '{}');
    } catch (e) {
      console.error('AI performance error:', e.message);
    }
  }

  const rating = review.rating || 3;
  return {
    summary: `Performance rated ${rating}/5. ${rating >= 4 ? 'Strong contributor with consistent goal achievement.' : 'Room for growth; focus on defined goals next period.'}`,
    recommendations: [
      'Schedule monthly 1:1 with manager',
      rating < 4 ? 'Complete skills training in Q next quarter' : 'Mentor junior team members',
      'Document achievements for next review cycle',
    ],
  };
}

module.exports = { generatePerformanceInsights };
