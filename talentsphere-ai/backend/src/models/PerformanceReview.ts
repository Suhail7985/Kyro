import mongoose, { Schema, Document, Types } from 'mongoose';

export interface IPerformanceReview extends Document {
  employeeId: Types.ObjectId;
  userId: Types.ObjectId;
  reviewerId: Types.ObjectId;
  period: string;
  kpis: { name: string; target: number; achieved: number }[];
  attendanceScore: number;
  tasksCompleted: number;
  rating: number;
  aiSummary?: string;
  strengths: string[];
  improvements: string[];
  promotionRecommendation: string;
  trainingRecommendations: string[];
  status: 'draft' | 'submitted' | 'approved';
}

const performanceSchema = new Schema<IPerformanceReview>(
  {
    employeeId: { type: Schema.Types.ObjectId, ref: 'Employee', required: true },
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    reviewerId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    period: { type: String, required: true },
    kpis: [{ name: String, target: Number, achieved: Number }],
    attendanceScore: { type: Number, default: 0 },
    tasksCompleted: { type: Number, default: 0 },
    rating: { type: Number, min: 1, max: 5, required: true },
    aiSummary: String,
    strengths: [String],
    improvements: [String],
    promotionRecommendation: String,
    trainingRecommendations: [String],
    status: { type: String, enum: ['draft', 'submitted', 'approved'], default: 'submitted' },
  },
  { timestamps: true }
);

export const PerformanceReview = mongoose.model<IPerformanceReview>(
  'PerformanceReview',
  performanceSchema
);
