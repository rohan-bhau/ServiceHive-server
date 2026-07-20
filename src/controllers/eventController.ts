import { Response } from 'express';
import UserEvent from '../models/UserEvent';
import { AuthRequest } from '../types';

export const trackView = async (req: AuthRequest, res: Response) => {
  try {
    const { serviceId } = req.body;
    if (!serviceId) {
      return res.status(400).json({ message: 'Service ID is required' });
    }

    await UserEvent.create({
      userId: req.user!.userId,
      type: 'view',
      serviceId,
    });

    res.status(201).json({ message: 'View event tracked successfully' });
  } catch (err) {
    console.error('trackView error:', err);
    res.status(500).json({ message: 'Internal server error' });
  }
};

export const trackSave = async (req: AuthRequest, res: Response) => {
  try {
    const { serviceId } = req.body;
    if (!serviceId) {
      return res.status(400).json({ message: 'Service ID is required' });
    }

    await UserEvent.create({
      userId: req.user!.userId,
      type: 'save',
      serviceId,
    });

    res.status(201).json({ message: 'Save event tracked successfully' });
  } catch (err) {
    console.error('trackSave error:', err);
    res.status(500).json({ message: 'Internal server error' });
  }
};
