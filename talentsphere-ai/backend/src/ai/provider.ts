import { env } from '../config/env';

export interface AICompletionOptions {
  system: string;
  user: string;
  json?: boolean;
}

export async function complete({ system, user, json }: AICompletionOptions): Promise<string | null> {
  if (env.AI_PROVIDER === 'openai' && env.OPENAI_API_KEY) {
    return openaiComplete(system, user, json);
  }
  if (env.GEMINI_API_KEY) {
    return geminiComplete(system, user, json);
  }
  if (env.OPENAI_API_KEY) {
    return openaiComplete(system, user, json);
  }
  return null;
}

async function geminiComplete(system: string, user: string, json?: boolean): Promise<string | null> {
  try {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${env.GEMINI_API_KEY}`;
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: `${system}\n\n${user}` }] }],
        generationConfig: json ? { responseMimeType: 'application/json' } : undefined,
      }),
    });
    const data = (await res.json()) as {
      candidates?: { content?: { parts?: { text?: string }[] } }[];
    };
    return data.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || null;
  } catch (e) {
    console.error('Gemini error:', e);
    return null;
  }
}

async function openaiComplete(system: string, user: string, json?: boolean): Promise<string | null> {
  try {
    const OpenAI = (await import('openai')).default;
    const client = new OpenAI({ apiKey: env.OPENAI_API_KEY! });
    const res = await client.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: system },
        { role: 'user', content: user },
      ],
      temperature: 0.3,
      response_format: json ? { type: 'json_object' } : undefined,
    });
    return res.choices[0]?.message?.content?.trim() || null;
  } catch (e) {
    console.error('OpenAI error:', e);
    return null;
  }
}
