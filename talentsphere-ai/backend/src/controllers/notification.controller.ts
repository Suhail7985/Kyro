import { Response } from 'express';
import { AuthRequest } from '../middlewares/auth';
import { Notification } from '../models';

export async function listNotifications(req: AuthRequest, res: Response) {
  try {
    const notifications = await Notification.find({ userId: req.user!._id })
      .sort({ createdAt: -1 })
      .limit(50);
    res.json({ success: true, data: notifications });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
}

export async function markAsRead(req: AuthRequest, res: Response) {
  try {
    const notification = await Notification.findOneAndUpdate(
      { _id: req.params.id, userId: req.user!._id },
      { read: true },
      { new: true }
    );
    if (!notification) {
      res.status(404).json({ success: false, message: 'Notification not found' });
      return;
    }
    res.json({ success: true, data: notification });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
}

export async function markAllAsRead(req: AuthRequest, res: Response) {
  try {
    await Notification.updateMany({ userId: req.user!._id, read: false }, { read: true });
    res.json({ success: true, message: 'All notifications marked as read' });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
}
