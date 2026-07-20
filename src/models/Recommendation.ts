import mongoose, { Document, Schema } from 'mongoose';

export interface IRecommendation extends Document {
  userId: mongoose.Types.ObjectId;
  serviceId: mongoose.Types.ObjectId;
  score: number;
  reason: string;
  generatedAt: Date;
}

const RecommendationSchema = new Schema<IRecommendation>({
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  serviceId: { type: Schema.Types.ObjectId, ref: 'Service', required: true },
  score: { type: Number, required: true },
  reason: { type: String, required: true },
  generatedAt: { type: Date, default: Date.now },
});

export default mongoose.model<IRecommendation>('Recommendation', RecommendationSchema);
