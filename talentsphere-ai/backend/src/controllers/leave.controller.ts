import { Response } from 'express';
import { AuthRequest } from '../middlewares/auth';
import { Leave, LeaveBalance, Employee, Notification } from '../models';

export async function applyLeave(req: AuthRequest, res: Response) {
  const emp = await Employee.findOne({ userId: req.user!._id });
  if (!emp) {
    res.status(400).json({ success: false, message: 'Employee profile required' });
    return;
  }
  const { type, startDate, endDate, reason } = req.body;
  const start = new Date(startDate);
  const end = new Date(endDate);
  const days = Math.ceil((end.getTime() - start.getTime()) / 86400000) + 1;

  const leave = await Leave.create({
    employeeId: emp._id,
    userId: req.user!._id,
    type,
    startDate: start,
    endDate: end,
    days,
    reason,
    status: 'pending',
  });
  res.status(201).json({ success: true, data: leave });
}

export async function approveLeave(req: AuthRequest, res: Response) {
  const leave = await Leave.findByIdAndUpdate(
    req.params.id,
    { status: 'approved', approvedBy: req.user!._id },
    { new: true }
  );
  if (!leave) {
    res.status(404).json({ success: false, message: 'Leave not found' });
    return;
  }
  const bal = await LeaveBalance.findOne({ userId: leave.userId });
  if (bal) {
    if (leave.type === 'annual') bal.usedAnnual += leave.days;
    if (leave.type === 'sick') bal.usedSick += leave.days;
    if (leave.type === 'personal') bal.usedPersonal += leave.days;
    await bal.save();
  }
  await Notification.create({
    userId: leave.userId,
    title: 'Leave Approved',
    message: `Your ${leave.type} leave was approved.`,
    type: 'success',
  });
  res.json({ success: true, data: leave });
}

export async function rejectLeave(req: AuthRequest, res: Response) {
  const leave = await Leave.findByIdAndUpdate(
    req.params.id,
    { status: 'rejected', approvedBy: req.user!._id, rejectionReason: req.body.reason },
    { new: true }
  );
  res.json({ success: true, data: leave });
}

export async function myLeaves(req: AuthRequest, res: Response) {
  const leaves = await Leave.find({ userId: req.user!._id }).sort({ createdAt: -1 });
  res.json({ success: true, data: leaves });
}

export async function pendingLeaves(_req: AuthRequest, res: Response) {
  const leaves = await Leave.find({ status: 'pending' }).populate('userId', 'name email');
  res.json({ success: true, data: leaves });
}

export async function leaveBalance(req: AuthRequest, res: Response) {
  let bal = await LeaveBalance.findOne({ userId: req.user!._id });
  if (!bal) {
    const emp = await Employee.findOne({ userId: req.user!._id });
    if (emp) {
      bal = await LeaveBalance.create({ employeeId: emp._id, userId: req.user!._id });
    }
  }
  res.json({ success: true, data: bal });
}
