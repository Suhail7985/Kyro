import mongoose, { Schema, Document, Types } from 'mongoose';

export interface IResumeAnalysis {
  name: string;
  skills: string[];
  experience: string;
  education: string;
  certifications: string[];
  projects: string[];
  matchPercentage: number;
  missingSkills: string[];
  strengths: string[];
  weaknesses: string[];
  hiringRecommendation: 'strong_hire' | 'hire' | 'maybe' | 'no_hire';
  aiFeedback: string;
}

export interface IApplication extends Document {
  jobId: Types.ObjectId;
  candidateId: Types.ObjectId;
  userId?: Types.ObjectId;
  resumeUrl?: string;
  resumeText?: string;
  analysis: IResumeAnalysis;
  aiScore: number;
  rank?: number;
  status: 'applied' | 'screening' | 'shortlisted' | 'interview' | 'offered' | 'rejected' | 'hired';
  videoUrl?: string;
}

const resumeAnalysisSchema = new Schema<IResumeAnalysis>(
  {
    name: String,
    skills: [String],
    experience: String,
    education: String,
    certifications: [String],
    projects: [String],
    matchPercentage: { type: Number, default: 0 },
    missingSkills: [String],
    strengths: [String],
    weaknesses: [String],
    hiringRecommendation: {
      type: String,
      enum: ['strong_hire', 'hire', 'maybe', 'no_hire'],
      default: 'maybe',
    },
    aiFeedback: String,
  },
  { _id: false }
);

const applicationSchema = new Schema<IApplication>(
  {
    jobId: { type: Schema.Types.ObjectId, ref: 'Job', required: true },
    candidateId: { type: Schema.Types.ObjectId, ref: 'Candidate', required: true },
    userId: { type: Schema.Types.ObjectId, ref: 'User' },
    resumeUrl: String,
    resumeText: String,
    analysis: { type: resumeAnalysisSchema, default: {} },
    aiScore: { type: Number, default: 0 },
    rank: Number,
    status: {
      type: String,
      enum: ['applied', 'screening', 'shortlisted', 'interview', 'offered', 'rejected', 'hired'],
      default: 'applied',
    },
    videoUrl: String,
  },
  { timestamps: true }
);

applicationSchema.index({ jobId: 1, aiScore: -1 });
applicationSchema.index({ candidateId: 1, jobId: 1 }, { unique: true });

export const Application = mongoose.model<IApplication>('Application', applicationSchema);
