import { Response } from 'express';
import bcrypt from 'bcryptjs';
import { AuthRequest, signToken } from '../middlewares/auth';
import { User, Employee, LeaveBalance, Onboarding } from '../models';
import { env } from '../config/env';
import { z } from 'zod';

const registerSchema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  password: z.string().min(8),
  role: z.enum(['employee', 'hr_recruiter']).default('employee'),
});

export async function register(req: AuthRequest, res: Response) {
  const body = registerSchema.parse(req.body);
  const exists = await User.findOne({ email: body.email.toLowerCase() });
  if (exists) {
    res.status(409).json({ success: false, message: 'Email already registered' });
    return;
  }
  const user = await User.create({
    name: body.name,
    email: body.email.toLowerCase(),
    passwordHash: await bcrypt.hash(body.password, 12),
    role: body.role,
  });

  if (user.role === 'employee') {
    let employeeId = '';
    let isUnique = false;
    while (!isUnique) {
      const count = await Employee.countDocuments();
      employeeId = `EMP-${String(count + Math.floor(Math.random() * 100) + 1).padStart(4, '0')}`;
      const existing = await Employee.findOne({ employeeId });
      if (!existing) {
        isUnique = true;
      }
    }

    const employee = await Employee.create({
      userId: user._id,
      employeeId,
      lifecycleStage: 'onboarding',
      onboardingComplete: false,
      salary: 0,
      skills: [],
    });

    await LeaveBalance.create({
      employeeId: employee._id,
      userId: user._id,
    });

    await Onboarding.create({
      employeeId: employee._id,
      userId: user._id,
      offerAccepted: false,
      documentsSubmitted: false,
      profileCompleted: false,
      tasks: [
        { title: 'Sign offer letter', completed: false },
        { title: 'Submit personal documents', completed: false },
        { title: 'Complete employee profile', completed: false },
        { title: 'Meet your manager', completed: false },
      ],
      progress: 0,
      status: 'in_progress',
    });
  }

  const token = signToken(user._id.toString(), user.role);
  res
    .cookie('token', token, { httpOnly: true, secure: env.NODE_ENV === 'production', sameSite: 'lax', maxAge: 7 * 86400000 })
    .status(201)
    .json({
      success: true,
      token,
      user: { id: user._id, name: user.name, email: user.email, role: user.role },
    });
}

export async function login(req: AuthRequest, res: Response) {
  const { email, password } = z.object({ email: z.string().email(), password: z.string() }).parse(req.body);
  const user = await User.findOne({ email: email.toLowerCase() }).select('+passwordHash');
  if (!user || !(await bcrypt.compare(password, user.passwordHash!))) {
    res.status(401).json({ success: false, message: 'Invalid credentials' });
    return;
  }
  user.lastLogin = new Date();
  await user.save();
  const token = signToken(user._id.toString(), user.role);
  res
    .cookie('token', token, { httpOnly: true, secure: env.NODE_ENV === 'production', sameSite: 'lax', maxAge: 7 * 86400000 })
    .json({
      success: true,
      token,
      user: { id: user._id, name: user.name, email: user.email, role: user.role },
    });
}

export async function me(req: AuthRequest, res: Response) {
  res.json({ success: true, user: req.user });
}

export async function logout(_req: AuthRequest, res: Response) {
  res.clearCookie('token').json({ success: true, message: 'Logged out' });
}
