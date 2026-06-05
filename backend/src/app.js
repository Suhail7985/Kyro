require('dotenv').config();
const express = require('express');
const http = require('http');
const mongoose = require('mongoose');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const path = require('path');

const authRoutes = require('./routes/authRoutes');
const applicantAuthRoutes = require('./routes/applicantAuthRoutes');
const userRoutes = require('./routes/userRoutes');
const adminUserRoutes = require('./routes/adminUserRoutes');
const jobRoutes = require('./routes/jobRoutes');
const applicationRoutes = require('./routes/applicationRoutes');
const recruitmentRoutes = require('./routes/recruitmentRoutes');
const videoInterviewRoutes = require('./routes/videoInterviewRoutes');
const statsRoutes = require('./routes/statsRoutes');
const hrRoutes = require('./routes/hrRoutes');
const aiRoutes = require('./routes/aiRoutes');
const mediaRoutes = require('./routes/mediaRoutes');
const cookieParser = require('cookie-parser');
const { initSocket } = require('./utils/socket');
const { initRedis } = require('./utils/redisClient');
const app = express();
const server = http.createServer(app);
const io = initSocket(server);
initRedis();
const PORT = process.env.PORT || 5000;

app.use(helmet({ crossOriginResourcePolicy: { policy: 'cross-origin' } }));
app.use(
  cors({
    origin: process.env.FRONTEND_URL || 'http://localhost:5173',
    credentials: true,
  })
);
app.use(cookieParser());
app.use(express.json({ limit: '2mb' }));
app.use(express.urlencoded({ extended: true }));

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 200,
  message: { message: 'Too many requests, please try again later' },
});
app.use('/api/', limiter);

// Inject socket.io instance into req
app.use((req, res, next) => {
  req.io = io;
  next();
});

app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.use('/api/auth', authRoutes);
app.use('/api/applicants/auth', applicantAuthRoutes);
app.use('/api/users', userRoutes);
app.use('/api/admin/users', adminUserRoutes);
app.use('/api/jobs', jobRoutes);
app.use('/api/applications', applicationRoutes);
app.use('/api/recruitment', recruitmentRoutes);
app.use('/api/interviews', videoInterviewRoutes);
app.use('/api/statistics', statsRoutes);
app.use('/api/hr', hrRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api/media', mediaRoutes);

app.use((err, _req, res, _next) => {
  console.error(err);
  res.status(err.status || 500).json({ message: err.message || 'Internal server error' });
});

async function seedAdmin() {
  const bcrypt = require('bcryptjs');
  const User = require('./models/User');
  const adminEmail = process.env.ADMIN_EMAIL || 'admin@kyro.com';
  const exists = await User.findOne({ email: adminEmail });
  if (!exists && process.env.ADMIN_PASSWORD) {
    await User.create({
      name: 'Platform Admin',
      email: adminEmail,
      passwordHash: await bcrypt.hash(process.env.ADMIN_PASSWORD, 12),
      role: 'admin',
      accountStatus: 'active',
      profile: { onboardingComplete: true },
    });
    console.log('Admin user seeded:', adminEmail);
  }
}

async function runSeeds() {
  await seedAdmin();
  const { runAllSeeds } = require('./utils/seedData');
  await runAllSeeds();
}

mongoose
  .connect(process.env.MONGO_URI || 'mongodb://localhost:27017/hiring-platform')
  .then(async () => {
    console.log('MongoDB connected');
    await runSeeds();
    server.listen(PORT, () => console.log(`Server running on port ${PORT}`));
    server.on('error', (err) => {
      if (err.code === 'EADDRINUSE') {
        console.error(`Port ${PORT} is already in use. Please stop the other process or change the PORT value.`);
        process.exit(1);
      }
      console.error('Server error:', err);
      process.exit(1);
    });
  })
  .catch((err) => {
    console.error('MongoDB connection error:', err.message);
    process.exit(1);
  });

module.exports = app;
