import { Response } from 'express';
import Service from '../models/Service';
import { AuthRequest } from '../types';
import { createServiceSchema, updateServiceSchema } from '../utils/validations';

export const getServices = async (req: AuthRequest, res: Response) => {
  try {
    const {
      search,
      category,
      minPrice,
      maxPrice,
      minRating,
      city,
      sort,
      providerId,
      page = '1',
      limit = '12',
    } = req.query as Record<string, string>;

    const filter: any = {};
    if (providerId) {
      filter.providerId = providerId;
    } else {
      filter.status = 'active';
    }

    if (search) {
      filter.$text = { $search: search };
    }
    if (category) {
      filter.category = category;
    }
    if (minPrice || maxPrice) {
      filter.price = {};
      if (minPrice) filter.price.$gte = parseFloat(minPrice);
      if (maxPrice) filter.price.$lte = parseFloat(maxPrice);
    }
    if (minRating) {
      filter.avgRating = { $gte: parseFloat(minRating) };
    }
    if (city) {
      filter.city = { $regex: city, $options: 'i' };
    }

    let sortOption: any = { createdAt: -1 };
    switch (sort) {
      case 'price_asc':
        sortOption = { price: 1 };
        break;
      case 'price_desc':
        sortOption = { price: -1 };
        break;
      case 'rating':
        sortOption = { avgRating: -1 };
        break;
      case 'oldest':
        sortOption = { createdAt: 1 };
        break;
      default:
        sortOption = { createdAt: -1 };
    }

    const pageNum = Math.max(1, parseInt(page));
    const limitNum = Math.min(50, Math.max(1, parseInt(limit)));
    const skip = (pageNum - 1) * limitNum;

    const [services, total] = await Promise.all([
      Service.find(filter)
        .sort(sortOption)
        .skip(skip)
        .limit(limitNum)
        .populate('providerId', 'name avatarUrl')
        .lean(),
      Service.countDocuments(filter),
    ]);

    res.json({
      services,
      total,
      page: pageNum,
      totalPages: Math.ceil(total / limitNum),
    });
  } catch (err) {
    console.error('getServices error:', err);
    res.status(500).json({ message: 'Internal server error' });
  }
};

export const getServiceById = async (req: AuthRequest, res: Response) => {
  try {
    const service = await Service.findById(req.params.id)
      .populate('providerId', 'name avatarUrl bio location createdAt')
      .lean();

    if (!service) {
      return res.status(404).json({ message: 'Service not found' });
    }

    res.json({ service });
  } catch (err) {
    console.error('getServiceById error:', err);
    res.status(500).json({ message: 'Internal server error' });
  }
};

export const createService = async (req: AuthRequest, res: Response) => {
  try {
    const parsed = createServiceSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ message: parsed.error.issues[0].message });
    }

    const service = await Service.create({
      ...parsed.data,
      providerId: req.user!.userId,
    });

    res.status(201).json({ service });
  } catch (err) {
    console.error('createService error:', err);
    res.status(500).json({ message: 'Internal server error' });
  }
};

export const updateService = async (req: AuthRequest, res: Response) => {
  try {
    const service = await Service.findById(req.params.id);
    if (!service) {
      return res.status(404).json({ message: 'Service not found' });
    }

    if (service.providerId.toString() !== req.user!.userId) {
      return res.status(403).json({ message: 'Not authorized to update this service' });
    }

    const parsed = updateServiceSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ message: parsed.error.issues[0].message });
    }

    Object.assign(service, parsed.data);
    await service.save();

    res.json({ service });
  } catch (err) {
    console.error('updateService error:', err);
    res.status(500).json({ message: 'Internal server error' });
  }
};

export const deleteService = async (req: AuthRequest, res: Response) => {
  try {
    const service = await Service.findById(req.params.id);
    if (!service) {
      return res.status(404).json({ message: 'Service not found' });
    }

    if (service.providerId.toString() !== req.user!.userId) {
      return res.status(403).json({ message: 'Not authorized to delete this service' });
    }

    await service.deleteOne();

    res.json({ message: 'Service deleted successfully' });
  } catch (err) {
    console.error('deleteService error:', err);
    res.status(500).json({ message: 'Internal server error' });
  }
};

export const relatedServices = async (req: AuthRequest, res: Response) => {
  try {
    const service = await Service.findById(req.params.id);
    if (!service) {
      return res.status(404).json({ message: 'Service not found' });
    }

    const related = await Service.find({
      _id: { $ne: service._id },
      category: service.category,
      status: 'active',
    })
      .sort({ avgRating: -1 })
      .limit(4)
      .populate('providerId', 'name avatarUrl')
      .lean();

    res.json({ services: related });
  } catch (err) {
    console.error('relatedServices error:', err);
    res.status(500).json({ message: 'Internal server error' });
  }
};
