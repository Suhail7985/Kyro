import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import rateLimit from 'express-rate-limit';
import RedisStore from 'rate-limit-redis';
import mongoSanitize from 'express-mongo-sanitize';
import path from 'path';
import { env } from './config/env';
import { connectDatabase } from './config/database';
import { connectRedis, redisClient } from './config/redis';
import { initCloudinary } from './utils/cloudinary';
import routes from './routes';
import { errorHandler, notFound } from './middlewares/errorHandler';

const app = express();

initCloudinary();

app.use(helmet({ crossOriginResourcePolicy: { policy: 'cross-origin' } }));
app.use(
  cors({
    origin: env.FRONTEND_URL,
    credentials: true,
  })
);
app.use(cookieParser());
app.use(express.json({ limit: '2mb' }));
app.use(mongoSanitize());

app.use(
  rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 500,
    message: { success: false, message: 'Too many requests' },
    store: new RedisStore({
      sendCommand: (...args: string[]) => redisClient.sendCommand(args),
    }),
  })
);

app.use('/uploads', express.static(path.join(process.cwd(), 'uploads')));
app.use('/api/v1', routes);
app.get('/api/health', (_req, res) => res.json({ success: true, status: 'ok' }));

app.use(notFound);
app.use(errorHandler);

async function bootstrap() {
  await connectDatabase();
  await connectRedis();
  app.listen(Number(env.PORT), () => {
    console.log(`TalentSphere API running on port ${env.PORT}`);
  });
}

bootstrap().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});

export default app;
