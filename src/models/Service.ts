import mongoose, { Document, Schema } from 'mongoose';

export interface IService extends Document {
  providerId: mongoose.Types.ObjectId;
  title: string;
  shortDescription: string;
  fullDescription: string;
  category: string;
  price: number;
  priceUnit: 'per_hour' | 'fixed';
  location: string;
  city: string;
  images: string[];
  tags: string[];
  availability: string;
  status: 'active' | 'paused';
  isApproved: boolean;
  avgRating: number;
  reviewCount: number;
  embedding?: number[];
  createdAt: Date;
  updatedAt: Date;
}

const ServiceSchema = new Schema<IService>(
  {
    providerId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    title: { type: String, required: true, trim: true },
    shortDescription: { type: String, required: true, trim: true },
    fullDescription: { type: String, required: true },
    category: { type: String, required: true, index: true },
    price: { type: Number, required: true, min: 0 },
    priceUnit: { type: String, enum: ['per_hour', 'fixed'], default: 'fixed' },
    location: { type: String, trim: true },
    city: { type: String, trim: true, index: true },
    images: [{ type: String }],
    tags: [{ type: String }],
    availability: { type: String },
    status: { type: String, enum: ['active', 'paused'], default: 'active' },
    isApproved: { type: Boolean, default: false },
    avgRating: { type: Number, default: 0, min: 0, max: 5 },
    reviewCount: { type: Number, default: 0 },
    embedding: [{ type: Number }],
  },
  { timestamps: true }
);

ServiceSchema.index({ title: 'text', shortDescription: 'text', fullDescription: 'text', category: 'text' });

export default mongoose.model<IService>('Service', ServiceSchema);
