import mongoose, { Schema, Document, Types } from 'mongoose';

export interface IOnboarding extends Document {
  employeeId: Types.ObjectId;
  userId: Types.ObjectId;
  offerAccepted: boolean;
  documentsSubmitted: boolean;
  profileCompleted: boolean;
  tasks: { title: string; completed: boolean; dueDate?: Date }[];
  progress: number;
  status: 'in_progress' | 'completed';
}

const onboardingSchema = new Schema<IOnboarding>(
  {
    employeeId: { type: Schema.Types.ObjectId, ref: 'Employee', required: true, unique: true },
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
    offerAccepted: { type: Boolean, default: false },
    documentsSubmitted: { type: Boolean, default: false },
    profileCompleted: { type: Boolean, default: false },
    tasks: [
      {
        title: String,
        completed: { type: Boolean, default: false },
        dueDate: Date,
      },
    ],
    progress: { type: Number, default: 0 },
    status: { type: String, enum: ['in_progress', 'completed'], default: 'in_progress' },
  },
  { timestamps: true }
);

export const Onboarding = mongoose.model<IOnboarding>('Onboarding', onboardingSchema);
