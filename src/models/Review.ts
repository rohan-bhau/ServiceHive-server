import mongoose, { Document, Schema } from 'mongoose';

export interface IReview extends Document {
  serviceId: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  rating: number;
  comment: string;
  createdAt: Date;
  updatedAt: Date;
}

const ReviewSchema = new Schema<IReview>(
  {
    serviceId: { type: Schema.Types.ObjectId, ref: 'Service', required: true, index: true },
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    rating: { type: Number, required: true, min: 1, max: 5 },
    comment: { type: String, required: true, trim: true },
  },
  { timestamps: true }
);

async function updateServiceStats(serviceId: any) {
  const stats = await mongoose.model('Review').aggregate([
    { $match: { serviceId } },
    {
      $group: {
        _id: '$serviceId',
        reviewCount: { $sum: 1 },
        avgRating: { $avg: '$rating' },
      },
    },
  ]);

  const Service = mongoose.model('Service');
  if (stats.length > 0) {
    await Service.findByIdAndUpdate(serviceId, {
      reviewCount: stats[0].reviewCount,
      avgRating: Math.round(stats[0].avgRating * 10) / 10,
    });
  } else {
    await Service.findByIdAndUpdate(serviceId, {
      reviewCount: 0,
      avgRating: 0,
    });
  }
}

ReviewSchema.post('save', function (doc) {
  updateServiceStats(doc.serviceId);
});

ReviewSchema.post('deleteOne', { document: true, query: false }, function (doc) {
  updateServiceStats(doc.serviceId);
});

export default mongoose.model<IReview>('Review', ReviewSchema);
