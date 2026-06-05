import mongoose, { Schema, Document } from 'mongoose';

export interface IDesignation extends Document {
  title: string;
  level: number;
  departmentId?: mongoose.Types.ObjectId;
}

const designationSchema = new Schema<IDesignation>(
  {
    title: { type: String, required: true },
    level: { type: Number, default: 1 },
    departmentId: { type: Schema.Types.ObjectId, ref: 'Department' },
  },
  { timestamps: true }
);

export const Designation = mongoose.model<IDesignation>('Designation', designationSchema);
