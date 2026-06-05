import { complete } from './provider';
import { ChatHistory } from '../models';
import { Types } from 'mongoose';
import { redisClient } from '../config/redis';

export async function hrAssistantReply(
  userId: Types.ObjectId,
  sessionId: string,
  message: string,
  context: { role: string; name: string }
): Promise<string> {
  const cacheKey = `chat_history:${userId.toString()}:${sessionId}`;
  
  let historyMessages: any[] = [];
  
  // Try to get from Redis cache first
  try {
    const cached = await redisClient.get(cacheKey);
    if (cached) {
      historyMessages = JSON.parse(cached);
    }
  } catch (err) {
    console.error('Redis read error:', err);
  }

  // If not in cache, fallback to MongoDB
  if (historyMessages.length === 0) {
    let history = await ChatHistory.findOne({ userId, sessionId });
    if (!history) {
      history = await ChatHistory.create({ userId, sessionId, messages: [] });
    }
    historyMessages = history.messages;
  }

  const recent = historyMessages.slice(-10);
  const memory = recent.map((m: any) => `${m.role}: ${m.content}`).join('\n');

  const system = `You are TalentSphere AI, enterprise HR assistant for FWC. User: ${context.name}, role: ${context.role}. Answer concisely about HR, recruitment, attendance, leave, payroll, performance. Use data-driven tone.`;

  const userPrompt = `Conversation history:\n${memory}\n\nUser: ${message}`;

  const reply =
    (await complete({ system, user: userPrompt })) ||
    ruleBasedReply(message, context.role);

  historyMessages.push({ role: 'user', content: message, timestamp: new Date() });
  historyMessages.push({ role: 'assistant', content: reply, timestamp: new Date() });
  if (historyMessages.length > 50) historyMessages = historyMessages.slice(-50);
  
  // Asynchronously save to MongoDB (Write-behind)
  ChatHistory.findOneAndUpdate(
    { userId, sessionId },
    { $set: { messages: historyMessages } },
    { upsert: true }
  ).catch((err) => console.error('MongoDB async save error:', err));

  // Update Redis cache immediately (24 hours expiry)
  try {
    await redisClient.setEx(cacheKey, 60 * 60 * 24, JSON.stringify(historyMessages));
  } catch (err) {
    console.error('Redis write error:', err);
  }

  return reply;
}

function ruleBasedReply(message: string, role: string): string {
  const m = message.toLowerCase();
  if (m.includes('leave balance')) return 'Check Leave tab on your dashboard for annual, sick, and personal balances.';
  if (m.includes('payroll')) return 'Payslips are available under Payroll with net pay, tax, and bonus breakdown.';
  if (m.includes('top') && m.includes('react')) return 'Use Recruiter → Rankings to see AI-sorted React developers by match score.';
  if (m.includes('attendance') && role.includes('manager'))
    return 'Manager dashboard shows team attendance reports and late arrival trends.';
  if (m.includes('performance')) return 'Performance reviews include AI-generated summaries and training recommendations.';
  return 'I can help with leave, payroll, attendance, recruitment rankings, and performance. What would you like to know?';
}
