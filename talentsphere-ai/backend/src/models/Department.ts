import mongoose, { Schema, Document } from 'mongoose';

export interface IDepartment extends Document {
  name: string;
  code: string;
  description?: string;
  headId?: mongoose.Types.ObjectId;
  employeeCount: number;
}

const departmentSchema = new Schema<IDepartment>(
  {
    name: { type: String, required: true, unique: true },
    code: { type: String, required: true, unique: true, uppercase: true },
    description: String,
    headId: { type: Schema.Types.ObjectId, ref: 'User' },
    employeeCount: { type: Number, default: 0 },
  },
  { timestamps: true }
);

export const Department = mongoose.model<IDepartment>('Department', departmentSchema);
