import mongoose, { Schema, Document } from 'mongoose';

export interface ICandidate extends Document {
  name: string;
  email: string;
  phone?: string;
  source: string;
  skills: string[];
  experienceYears: number;
  education: string;
  certifications: string[];
  projects: string[];
}

const candidateSchema = new Schema<ICandidate>(
  {
    name: { type: String, required: true },
    email: { type: String, required: true, lowercase: true },
    phone: String,
    source: { type: String, default: 'direct' },
    skills: [String],
    experienceYears: { type: Number, default: 0 },
    education: String,
    certifications: [String],
    projects: [String],
  },
  { timestamps: true }
);

candidateSchema.index({ email: 1 });

export const Candidate = mongoose.model<ICandidate>('Candidate', candidateSchema);
