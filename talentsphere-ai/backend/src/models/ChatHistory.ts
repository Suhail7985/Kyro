import mongoose, { Schema, Document, Types } from 'mongoose';

export interface IChatMessage {
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

export interface IChatHistory extends Document {
  userId: Types.ObjectId;
  sessionId: string;
  messages: IChatMessage[];
}

const chatHistorySchema = new Schema<IChatHistory>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    sessionId: { type: String, required: true },
    messages: [
      {
        role: { type: String, enum: ['user', 'assistant'], required: true },
        content: { type: String, required: true },
        timestamp: { type: Date, default: Date.now },
      },
    ],
  },
  { timestamps: true }
);

chatHistorySchema.index({ userId: 1, sessionId: 1 });

export const ChatHistory = mongoose.model<IChatHistory>('ChatHistory', chatHistorySchema);
