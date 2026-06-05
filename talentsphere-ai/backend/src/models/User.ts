import mongoose, { Schema, Document, Types } from 'mongoose';
import { UserRole } from '../types/roles';

export interface IUser extends Document {
  name: string;
  email: string;
  passwordHash: string;
  role: UserRole;
  avatar?: string;
  isActive: boolean;
  lastLogin?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const userSchema = new Schema<IUser>(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    passwordHash: { type: String, required: true, select: false },
    role: {
      type: String,
      enum: ['admin', 'senior_manager', 'hr_recruiter', 'employee'],
      required: true,
    },
    avatar: String,
    isActive: { type: Boolean, default: true },
    lastLogin: Date,
  },
  { timestamps: true }
);

userSchema.index({ role: 1 });
userSchema.index({ email: 1 });

export const User = mongoose.model<IUser>('User', userSchema);

export interface IEmployee extends Document {
  userId: Types.ObjectId;
  employeeId: string;
  departmentId?: Types.ObjectId;
  designationId?: Types.ObjectId;
  managerId?: Types.ObjectId;
  joinDate: Date;
  salary: number;
  skills: string[];
  phone?: string;
  location?: string;
  bio?: string;
  documents: { name: string; url: string; uploadedAt: Date }[];
  lifecycleStage: 'onboarding' | 'active' | 'offboarding' | 'terminated';
  attritionRisk: 'low' | 'medium' | 'high';
  attritionScore: number;
  attritionFactors: string[];
  onboardingComplete: boolean;
}

const employeeSchema = new Schema<IEmployee>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
    employeeId: { type: String, required: true, unique: true },
    departmentId: { type: Schema.Types.ObjectId, ref: 'Department' },
    designationId: { type: Schema.Types.ObjectId, ref: 'Designation' },
    managerId: { type: Schema.Types.ObjectId, ref: 'User' },
    joinDate: { type: Date, default: Date.now },
    salary: { type: Number, default: 0 },
    skills: [String],
    phone: String,
    location: String,
    bio: String,
    documents: [{ name: String, url: String, uploadedAt: { type: Date, default: Date.now } }],
    lifecycleStage: {
      type: String,
      enum: ['onboarding', 'active', 'offboarding', 'terminated'],
      default: 'onboarding',
    },
    attritionRisk: { type: String, enum: ['low', 'medium', 'high'], default: 'low' },
    attritionScore: { type: Number, default: 0 },
    attritionFactors: [String],
    onboardingComplete: { type: Boolean, default: false },
  },
  { timestamps: true }
);

employeeSchema.index({ departmentId: 1 });
employeeSchema.index({ employeeId: 1 });

export const Employee = mongoose.model<IEmployee>('Employee', employeeSchema);
