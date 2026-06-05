import mongoose, { Schema, Document, Types } from 'mongoose';

export interface IJob extends Document {
  title: string;
  description: string;
  departmentId?: Types.ObjectId;
  requiredSkills: string[];
  experienceLevel: 'junior' | 'mid' | 'senior' | 'lead';
  location: string;
  salaryMin: number;
  salaryMax: number;
  status: 'open' | 'closed' | 'draft';
  createdBy: Types.ObjectId;
  applicantCount: number;
}

const jobSchema = new Schema<IJob>(
  {
    title: { type: String, required: true },
    description: { type: String, required: true },
    departmentId: { type: Schema.Types.ObjectId, ref: 'Department' },
    requiredSkills: [String],
    experienceLevel: {
      type: String,
      enum: ['junior', 'mid', 'senior', 'lead'],
      default: 'mid',
    },
    location: { type: String, default: 'Remote' },
    salaryMin: { type: Number, default: 0 },
    salaryMax: { type: Number, default: 0 },
    status: { type: String, enum: ['open', 'closed', 'draft'], default: 'open' },
    createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    applicantCount: { type: Number, default: 0 },
  },
  { timestamps: true }
);

jobSchema.index({ status: 1, createdAt: -1 });

export const Job = mongoose.model<IJob>('Job', jobSchema);
