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
  role: z.enum(['employee', 'hr_recruiter', 'applicant']).default('employee'),
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
      if (!existing) isUnique = true;
    }
    const employee = await Employee.create({
      userId: user._id,
      employeeId,
      lifecycleStage: 'onboarding',
      onboardingComplete: false,
      salary: 0,
      skills: [],
    });
    await LeaveBalance.create({ employeeId: employee._id, userId: user._id });
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
  } else if (user.role === 'applicant') {
    // Create a Candidate profile associated with this applicant user
    // Candidate requires name, email, and source as per Candidate.ts model
    // We import Candidate at the top if not already imported
    const mongoose = require('mongoose');
    const { Candidate } = require('../models');
    await Candidate.create({
      name: user.name,
      email: user.email,
      source: 'portal',
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
      user: { id: user._id, name: user.name, email: user.email, role: user.role, department: user.department },
    });
}

export async function me(req: AuthRequest, res: Response) {
  res.json({ success: true, user: req.user });
}

export async function logout(_req: AuthRequest, res: Response) {
  res.clearCookie('token').json({ success: true, message: 'Logged out' });
}

// ─── Admin-only User Management ───────────────────────────────────────────────

export async function listUsers(_req: AuthRequest, res: Response) {
  const users = await User.find({}).select('-passwordHash').sort({ createdAt: -1 });
  res.json({ success: true, data: users });
}

const createUserSchema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  password: z.string().min(8),
  department: z.string().optional(),
  managerId: z.string().optional(),
});

export async function createManager(req: AuthRequest, res: Response) {
  const body = createUserSchema.parse(req.body);
  const exists = await User.findOne({ email: body.email.toLowerCase() });
  if (exists) {
    res.status(409).json({ success: false, message: 'Email already registered' });
    return;
  }
  const user = await User.create({
    name: body.name,
    email: body.email.toLowerCase(),
    passwordHash: await bcrypt.hash(body.password, 12),
    role: 'senior_manager',
    department: body.department,
  });
  res.status(201).json({ success: true, user: { id: user._id, name: user.name, email: user.email, role: user.role } });
}

export async function createRecruiter(req: AuthRequest, res: Response) {
  const body = createUserSchema.parse(req.body);
  const exists = await User.findOne({ email: body.email.toLowerCase() });
  if (exists) {
    res.status(409).json({ success: false, message: 'Email already registered' });
    return;
  }
  const user = await User.create({
    name: body.name,
    email: body.email.toLowerCase(),
    passwordHash: await bcrypt.hash(body.password, 12),
    role: 'hr_recruiter',
    department: body.department,
  });
  res.status(201).json({ success: true, user: { id: user._id, name: user.name, email: user.email, role: user.role } });
}

export async function createEmployeeUser(req: AuthRequest, res: Response) {
  const body = createUserSchema.parse(req.body);
  const exists = await User.findOne({ email: body.email.toLowerCase() });
  if (exists) {
    res.status(409).json({ success: false, message: 'Email already registered' });
    return;
  }
  const user = await User.create({
    name: body.name,
    email: body.email.toLowerCase(),
    passwordHash: await bcrypt.hash(body.password, 12),
    role: 'employee',
    department: body.department,
  });
  let employeeId = '';
  let isUnique = false;
  while (!isUnique) {
    const count = await Employee.countDocuments();
    employeeId = `EMP-${String(count + Math.floor(Math.random() * 100) + 1).padStart(4, '0')}`;
    const existing = await Employee.findOne({ employeeId });
    if (!existing) isUnique = true;
  }
  const employee = await Employee.create({
    userId: user._id,
    employeeId,
    managerId: body.managerId,
    lifecycleStage: 'onboarding',
    onboardingComplete: false,
    salary: 0,
    skills: [],
  });
  await LeaveBalance.create({ employeeId: employee._id, userId: user._id });
  res.status(201).json({ success: true, user: { id: user._id, name: user.name, email: user.email, role: user.role }, employeeId });
}

export async function updateUser(req: AuthRequest, res: Response) {
  const { id } = req.params;
  const { name, email, isActive, department, role } = req.body;
  const user = await User.findByIdAndUpdate(id, { name, email, isActive, department, role }, { new: true }).select('-passwordHash');
  if (!user) {
    res.status(404).json({ success: false, message: 'User not found' });
    return;
  }
  res.json({ success: true, data: user });
}

export async function deleteUser(req: AuthRequest, res: Response) {
  const { id } = req.params;
  const user = await User.findByIdAndUpdate(id, { isActive: false }, { new: true });
  if (!user) {
    res.status(404).json({ success: false, message: 'User not found' });
    return;
  }
  res.json({ success: true, message: 'User deactivated successfully' });
}
