import mongoose, { Schema, Document, Types } from 'mongoose';

export interface IInterview extends Document {
  applicationId: Types.ObjectId;
  jobId: Types.ObjectId;
  candidateId: Types.ObjectId;
  scheduledAt?: Date;
  status: 'scheduled' | 'completed' | 'cancelled';
  technicalQuestions: string[];
  behavioralQuestions: string[];
  hrQuestions: string[];
  followUpQuestions: string[];
  generatedBy: 'ai' | 'manual';
  notes?: string;
}

const interviewSchema = new Schema<IInterview>(
  {
    applicationId: { type: Schema.Types.ObjectId, ref: 'Application', required: true },
    jobId: { type: Schema.Types.ObjectId, ref: 'Job', required: true },
    candidateId: { type: Schema.Types.ObjectId, ref: 'Candidate', required: true },
    scheduledAt: Date,
    status: { type: String, enum: ['scheduled', 'completed', 'cancelled'], default: 'scheduled' },
    technicalQuestions: [String],
    behavioralQuestions: [String],
    hrQuestions: [String],
    followUpQuestions: [String],
    generatedBy: { type: String, enum: ['ai', 'manual'], default: 'ai' },
    notes: String,
  },
  { timestamps: true }
);

export const Interview = mongoose.model<IInterview>('Interview', interviewSchema);
