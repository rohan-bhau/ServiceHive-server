import mongoose, { Document, Schema } from 'mongoose';

export interface IUserEvent extends Document {
  userId: mongoose.Types.ObjectId;
  type: 'view' | 'book' | 'save' | 'search';
  serviceId?: mongoose.Types.ObjectId;
  searchQuery?: string;
  metadata?: Record<string, any>;
  createdAt: Date;
}

const UserEventSchema = new Schema<IUserEvent>({
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  type: { type: String, enum: ['view', 'book', 'save', 'search'], required: true },
  serviceId: { type: Schema.Types.ObjectId, ref: 'Service' },
  searchQuery: { type: String },
  metadata: { type: Schema.Types.Mixed },
  createdAt: { type: Date, default: Date.now },
});

UserEventSchema.index({ userId: 1, type: 1 });

export default mongoose.model<IUserEvent>('UserEvent', UserEventSchema);
