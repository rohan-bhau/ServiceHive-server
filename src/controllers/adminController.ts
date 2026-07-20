import { Response } from 'express';
import User from '../models/User';
import Service from '../models/Service';
import Booking from '../models/Booking';
import { AuthRequest } from '../types';

export const getAdminStats = async (req: AuthRequest, res: Response) => {
  try {
    const [totalCustomers, totalProviders, totalServices, totalBookings, pendingServices] = await Promise.all([
      User.countDocuments({ role: 'customer' }),
      User.countDocuments({ role: 'provider' }),
      Service.countDocuments({}),
      Booking.countDocuments({}),
      Service.countDocuments({ isApproved: false }),
    ]);
    res.json({ totalCustomers, totalProviders, totalServices, totalBookings, pendingServices });
  } catch (err) {
    console.error('getAdminStats error:', err);
    res.status(500).json({ message: 'Internal server error' });
  }
};

export const getUsers = async (req: AuthRequest, res: Response) => {
  try {
    const users = await User.find().select('-passwordHash -refreshToken').sort({ createdAt: -1 });
    res.json({ users });
  } catch (err) {
    console.error('getUsers error:', err);
    res.status(500).json({ message: 'Internal server error' });
  }
};

export const updateUserRole = async (req: AuthRequest, res: Response) => {
  try {
    const { role } = req.body;
    if (!['customer', 'provider', 'admin'].includes(role)) {
      return res.status(400).json({ message: 'Invalid role' });
    }
    const user = await User.findByIdAndUpdate(req.params.id, { role }, { new: true })
      .select('-passwordHash -refreshToken');
    if (!user) return res.status(404).json({ message: 'User not found' });
    res.json({ user });
  } catch (err) {
    console.error('updateUserRole error:', err);
    res.status(500).json({ message: 'Internal server error' });
  }
};

export const deleteUser = async (req: AuthRequest, res: Response) => {
  try {
    const user = await User.findByIdAndDelete(req.params.id);
    if (!user) return res.status(404).json({ message: 'User not found' });
    res.json({ message: 'User deleted successfully' });
  } catch (err) {
    console.error('deleteUser error:', err);
    res.status(500).json({ message: 'Internal server error' });
  }
};

export const getPendingServices = async (req: AuthRequest, res: Response) => {
  try {
    const services = await Service.find({ isApproved: false })
      .populate('providerId', 'name email')
      .sort({ createdAt: -1 });
    res.json({ services });
  } catch (err) {
    console.error('getPendingServices error:', err);
    res.status(500).json({ message: 'Internal server error' });
  }
};

export const approveService = async (req: AuthRequest, res: Response) => {
  try {
    const service = await Service.findByIdAndUpdate(
      req.params.id,
      { isApproved: true, status: 'active' },
      { new: true }
    );
    if (!service) return res.status(404).json({ message: 'Service not found' });
    res.json({ service });
  } catch (err) {
    console.error('approveService error:', err);
    res.status(500).json({ message: 'Internal server error' });
  }
};

export const deleteService = async (req: AuthRequest, res: Response) => {
  try {
    const service = await Service.findByIdAndDelete(req.params.id);
    if (!service) return res.status(404).json({ message: 'Service not found' });
    res.json({ message: 'Service deleted successfully' });
  } catch (err) {
    console.error('deleteService error:', err);
    res.status(500).json({ message: 'Internal server error' });
  }
};
