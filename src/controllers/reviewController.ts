import mongoose from 'mongoose';
import { Response } from 'express';
import Review from '../models/Review';
import Service from '../models/Service';
import { AuthRequest } from '../types';

export const createReview = async (req: AuthRequest, res: Response) => {
  try {
    const { id: serviceId } = req.params;
    const { rating, comment } = req.body;

    if (!rating || !comment) {
      return res.status(400).json({ message: 'Rating and comment are required' });
    }

    const service = await Service.findById(serviceId);
    if (!service) {
      return res.status(404).json({ message: 'Service not found' });
    }

    // Check if the user is the provider of this service (they cannot review themselves)
    if (service.providerId.toString() === req.user!.userId) {
      return res.status(400).json({ message: 'You cannot review your own service' });
    }

    // Create review
    const review = await Review.create({
      serviceId: new mongoose.Types.ObjectId(serviceId as string),
      userId: new mongoose.Types.ObjectId(req.user!.userId),
      rating: parseInt(rating),
      comment,
    } as any);

    const populatedReview = await (review as any).populate('userId', 'name avatarUrl');

    res.status(201).json({ review: populatedReview });
  } catch (err) {
    console.error('createReview error:', err);
    res.status(500).json({ message: 'Internal server error' });
  }
};

export const getServiceReviews = async (req: AuthRequest, res: Response) => {
  try {
    const { id: serviceId } = req.params;

    const reviews = await Review.find({ serviceId })
      .sort({ createdAt: -1 })
      .populate('userId', 'name avatarUrl')
      .lean();

    res.json({ reviews });
  } catch (err) {
    console.error('getServiceReviews error:', err);
    res.status(500).json({ message: 'Internal server error' });
  }
};
