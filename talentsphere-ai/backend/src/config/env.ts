import dotenv from 'dotenv';
import { z } from 'zod';

dotenv.config();

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.string().default('5000'),
  MONGODB_URI: z.string().min(1).default('mongodb://localhost:27017/talentsphere-ai'),
  JWT_SECRET: z.string().min(32).default('dev-only-secret-minimum-32-characters-long!!'),
  JWT_EXPIRES_IN: z.string().default('7d'),
  FRONTEND_URL: z.string().default('http://localhost:3000'),
  GEMINI_API_KEY: z.string().optional(),
  OPENAI_API_KEY: z.string().optional(),
  AI_PROVIDER: z.enum(['gemini', 'openai']).default('gemini'),
  CLOUDINARY_CLOUD_NAME: z.string().optional(),
  CLOUDINARY_API_KEY: z.string().optional(),
  CLOUDINARY_API_SECRET: z.string().optional(),
  ADMIN_EMAIL: z.string().email().default('admin@talentsphere.ai'),
  ADMIN_PASSWORD: z.string().min(8).default('Admin@123456'),
  REDIS_URL: z.string().optional(),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  console.error('Invalid environment variables:', parsed.error.flatten().fieldErrors);
  if (process.env.NODE_ENV !== 'test') {
    throw new Error('Environment validation failed. Check .env against .env.example');
  }
}

export const env = parsed.success
  ? parsed.data
  : ({
      NODE_ENV: 'development',
      PORT: '5000',
      MONGODB_URI: process.env.MONGODB_URI || 'mongodb://localhost:27017/talentsphere-ai',
      JWT_SECRET: process.env.JWT_SECRET || 'dev-only-secret-minimum-32-characters-long',
      JWT_EXPIRES_IN: '7d',
      FRONTEND_URL: 'http://localhost:3000',
      AI_PROVIDER: 'gemini' as const,
      ADMIN_EMAIL: 'admin@talentsphere.ai',
      ADMIN_PASSWORD: 'Admin@123456',
      REDIS_URL: process.env.REDIS_URL,
    } as z.infer<typeof envSchema>);
