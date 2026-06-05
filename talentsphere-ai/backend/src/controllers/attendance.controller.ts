import { Response } from 'express';
import { AuthRequest } from '../middlewares/auth';
import { Attendance, Employee } from '../models';

export async function clockIn(req: AuthRequest, res: Response) {
  const emp = await Employee.findOne({ userId: req.user!._id });
  if (!emp) {
    res.status(400).json({ success: false, message: 'Employee profile required' });
    return;
  }
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const now = new Date();
  const isLate = now.getHours() > 9 || (now.getHours() === 9 && now.getMinutes() > 15);

  const record = await Attendance.findOneAndUpdate(
    { userId: req.user!._id, date: today },
    {
      employeeId: emp._id,
      userId: req.user!._id,
      date: today,
      checkIn: now,
      status: req.body.remote ? 'remote' : isLate ? 'late' : 'present',
      isLate,
    },
    { upsert: true, new: true }
  );
  res.json({ success: true, data: record });
}

export async function clockOut(req: AuthRequest, res: Response) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const record = await Attendance.findOne({ userId: req.user!._id, date: today });
  if (!record?.checkIn) {
    res.status(400).json({ success: false, message: 'Check in first' });
    return;
  }
  record.checkOut = new Date();
  const ms = record.checkOut.getTime() - record.checkIn!.getTime();
  record.hoursWorked = Math.round((ms / 3600000) * 100) / 100;
  await record.save();
  res.json({ success: true, data: record });
}

export async function history(req: AuthRequest, res: Response) {
  const userId = (req.query.userId as string) || req.user!._id.toString();
  const records = await Attendance.find({ userId }).sort({ date: -1 }).limit(90);
  res.json({ success: true, data: records });
}

export async function monthlyReport(req: AuthRequest, res: Response) {
  const month = (req.query.month as string) || new Date().toISOString().slice(0, 7);
  const start = new Date(`${month}-01`);
  const end = new Date(start);
  end.setMonth(end.getMonth() + 1);

  const records = await Attendance.find({ date: { $gte: start, $lt: end } });
  const summary = {
    present: records.filter((r) => r.status === 'present').length,
    late: records.filter((r) => r.isLate).length,
    absent: records.filter((r) => r.status === 'absent').length,
    remote: records.filter((r) => r.status === 'remote').length,
    totalHours: records.reduce((s, r) => s + r.hoursWorked, 0),
  };
  res.json({ success: true, data: { records, summary } });
}
