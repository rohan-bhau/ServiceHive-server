import { Request, Response } from 'express';
import ContactMessage from '../models/ContactMessage';

export const createContactMessage = async (req: Request, res: Response) => {
  try {
    const { name, email, subject, message } = req.body;

    if (!name || !email || !subject || !message) {
      return res.status(400).json({ message: 'All fields are required' });
    }

    const newMessage = await ContactMessage.create({
      name,
      email,
      subject,
      message,
    });

    res.status(201).json({ message: 'Message sent successfully!', contactMessage: newMessage });
  } catch (err) {
    console.error('createContactMessage error:', err);
    res.status(500).json({ message: 'Internal server error' });
  }
};
