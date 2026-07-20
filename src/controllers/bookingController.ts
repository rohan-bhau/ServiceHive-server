import { Response } from 'express';
import Booking from '../models/Booking';
import Service from '../models/Service';
import UserEvent from '../models/UserEvent';
import { AuthRequest } from '../types';
import { AppError } from '../middleware/errorHandler';

export const createBooking = async (req: AuthRequest, res: Response) => {
  try {
    const { serviceId, date, notes } = req.body;

    if (!serviceId || !date) {
      return res.status(400).json({ message: 'Service ID and date are required' });
    }

    const service = await Service.findById(serviceId);
    if (!service) {
      return res.status(404).json({ message: 'Service not found' });
    }

    if (service.providerId.toString() === req.user!.userId) {
      return res.status(400).json({ message: 'You cannot book your own service' });
    }

    if (req.user?.role === 'provider') {
      return res.status(400).json({
        message: 'Booking services requires a customer account. Please sign in with a customer account.'
      });
    }

    const booking = await Booking.create({
      serviceId,
      customerId: req.user!.userId,
      providerId: service.providerId,
      date: new Date(date),
      notes,
      status: 'pending',
    });

    // Record event log for similarity suggestions
    await UserEvent.create({
      userId: req.user!.userId,
      type: 'book',
      serviceId: service._id,
    });

    res.status(201).json({ booking });
  } catch (err) {
    console.error('createBooking error:', err);
    res.status(500).json({ message: 'Internal server error' });
  }
};

export const getMyBookings = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.userId;

    const bookings = await Booking.find({
      $or: [{ customerId: userId }, { providerId: userId }],
    })
      .sort({ createdAt: -1 })
      .populate('serviceId', 'title category price priceUnit images location city')
      .populate('customerId', 'name email avatarUrl')
      .populate('providerId', 'name email avatarUrl')
      .lean();

    res.json({ bookings });
  } catch (err) {
    console.error('getMyBookings error:', err);
    res.status(500).json({ message: 'Internal server error' });
  }
};

export const updateBookingStatus = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!['pending', 'confirmed', 'completed', 'cancelled'].includes(status)) {
      return res.status(400).json({ message: 'Invalid booking status' });
    }

    const booking = await Booking.findById(id);
    if (!booking) {
      return res.status(404).json({ message: 'Booking not found' });
    }

    const isCustomer = booking.customerId.toString() === req.user!.userId;
    const isProvider = booking.providerId.toString() === req.user!.userId;

    if (!isCustomer && !isProvider) {
      return res.status(403).json({ message: 'Not authorized to manage this booking' });
    }

    // Business Rules validation
    if (status === 'confirmed' && !isProvider) {
      return res.status(400).json({ message: 'Only providers can confirm bookings' });
    }
    if (status === 'completed' && !isProvider) {
      return res.status(400).json({ message: 'Only providers can complete bookings' });
    }
    if (status === 'cancelled' && isCustomer && booking.status === 'completed') {
      return res.status(400).json({ message: 'Cannot cancel a completed booking' });
    }

    booking.status = status;
    await booking.save();

    res.json({ booking });
  } catch (err) {
    console.error('updateBookingStatus error:', err);
    res.status(500).json({ message: 'Internal server error' });
  }
};
