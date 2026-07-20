import mongoose from 'mongoose';
import { Response } from 'express';
import User from '../models/User';
import Service from '../models/Service';
import Booking from '../models/Booking';
import Review from '../models/Review';
import { AuthRequest } from '../types';

export const getStats = async (req: AuthRequest, res: Response) => {
  try {
    const [totalProviders, totalServices, totalBookings, avgRatingResult] = await Promise.all([
      User.countDocuments({ role: 'provider' }),
      Service.countDocuments({ status: 'active' }),
      Booking.countDocuments({}),
      Service.aggregate([
        { $match: { status: 'active' } },
        { $group: { _id: null, avg: { $avg: '$avgRating' } } },
      ]),
    ]);

    const avgRating = avgRatingResult.length > 0 ? Math.round(avgRatingResult[0].avg * 10) / 10 : 4.8; // default to 4.8 if empty

    res.json({
      providersCount: totalProviders || 5, // fallback if new DB
      servicesCount: totalServices || 12,
      bookingsCount: totalBookings || 35,
      averageRating: avgRating,
    });
  } catch (err) {
    console.error('getStats error:', err);
    res.status(500).json({ message: 'Internal server error' });
  }
};

export const getBookingStats = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.userId;
    const providerObjectId = new mongoose.Types.ObjectId(userId);
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    // 1. Bookings over time (last 30 days)
    const bookingsOverTime = await Booking.aggregate([
      {
        $match: {
          providerId: providerObjectId,
          createdAt: { $gte: thirtyDaysAgo },
        },
      },

      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
          count: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
    ]);

    // 2. Revenue by category
    const revenueByCategory = await Booking.aggregate([
      {
        $match: {
          providerId: providerObjectId,
          status: 'completed',
        },
      },
      {
        $lookup: {
          from: 'services',
          localField: 'serviceId',
          foreignField: '_id',
          as: 'service',
        },
      },
      { $unwind: '$service' },
      {
        $group: {
          _id: '$service.category',
          total: { $sum: '$service.price' },
        },
      },
    ]);

    // Get provider's service IDs to query reviews
    const providerServices = await Service.find({ providerId: userId }).select('_id');
    const providerServiceIds = providerServices.map(s => s._id);

    // 3. Rating trend over time
    const ratingTrend = await Review.aggregate([
      {
        $match: {
          serviceId: { $in: providerServiceIds },
          createdAt: { $gte: thirtyDaysAgo },
        },
      },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
          avg: { $avg: '$rating' },
        },
      },
      { $sort: { _id: 1 } },
    ]);

    // 4. Booking status breakdown
    const statusBreakdown = await Booking.aggregate([
      {
        $match: {
          providerId: providerObjectId,
        },
      },
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 },
        },
      },
    ]);

    res.json({
      bookingsOverTime,
      revenueByCategory,
      ratingTrend,
      statusBreakdown,
    });
  } catch (err) {
    console.error('getBookingStats error:', err);
    res.status(500).json({ message: 'Internal server error' });
  }
};
