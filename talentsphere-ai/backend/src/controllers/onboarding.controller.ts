import { Response } from 'express';
import { AuthRequest } from '../middlewares/auth';
import { Onboarding, Employee } from '../models';

const DEFAULT_TASKS = [
  { title: 'Accept offer letter', completed: false },
  { title: 'Submit identity documents', completed: false },
  { title: 'Complete profile', completed: false },
  { title: 'IT equipment setup', completed: false },
  { title: 'Security training', completed: false },
];

export async function getOnboarding(req: AuthRequest, res: Response) {
  let onboarding = await Onboarding.findOne({ userId: req.user!._id });
  if (!onboarding) {
    const emp = await Employee.findOne({ userId: req.user!._id });
    if (emp) {
      onboarding = await Onboarding.create({
        employeeId: emp._id,
        userId: req.user!._id,
        tasks: DEFAULT_TASKS,
      });
    }
  }
  res.json({ success: true, data: onboarding });
}

export async function updateOnboarding(req: AuthRequest, res: Response) {
  const onboarding = await Onboarding.findOne({ userId: req.user!._id });
  if (!onboarding) {
    res.status(404).json({ success: false, message: 'Onboarding not found' });
    return;
  }

  if (req.body.offerAccepted !== undefined) onboarding.offerAccepted = req.body.offerAccepted;
  if (req.body.documentsSubmitted !== undefined) onboarding.documentsSubmitted = req.body.documentsSubmitted;
  if (req.body.profileCompleted !== undefined) onboarding.profileCompleted = req.body.profileCompleted;
  if (req.body.taskIndex !== undefined) {
    const idx = Number(req.body.taskIndex);
    if (onboarding.tasks[idx]) onboarding.tasks[idx].completed = true;
  }

  const completed = onboarding.tasks.filter((t) => t.completed).length;
  onboarding.progress = Math.round((completed / onboarding.tasks.length) * 100);
  if (onboarding.progress === 100) onboarding.status = 'completed';

  await onboarding.save();
  res.json({ success: true, data: onboarding });
}
