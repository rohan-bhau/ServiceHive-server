import mongoose from 'mongoose';
import { Response } from 'express';
import ChatConversation from '../models/ChatConversation';
import Recommendation from '../models/Recommendation';
import { AuthRequest } from '../types';
import { generateListingDraft, generateChatResponse, generateTitle } from '../services/openai.service';
import { generateRecommendations } from '../services/recommendation.service';

export const generateListing = async (req: AuthRequest, res: Response) => {
  try {
    const { bullets, tone = 'professional', length = 'medium' } = req.body;

    if (!bullets) {
      return res.status(400).json({ message: 'Bullet points are required' });
    }

    const draft = await generateListingDraft(bullets, tone, length);
    res.json(draft);
  } catch (err) {
    console.error('generateListing error:', err);
    res.status(500).json({ message: 'Internal server error' });
  }
};

export const getRecommendations = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.userId;

    let recommendations = await Recommendation.find({ userId })
      .populate({
        path: 'serviceId',
        populate: { path: 'providerId', select: 'name avatarUrl location' },
      })
      .lean();

    // If cache is empty, compile suggestions synchronously once
    if (recommendations.length === 0) {
      await generateRecommendations(userId);
      recommendations = await Recommendation.find({ userId })
        .populate({
          path: 'serviceId',
          populate: { path: 'providerId', select: 'name avatarUrl location' },
        })
        .lean();
    }

    res.json({ recommendations });
  } catch (err) {
    console.error('getRecommendations error:', err);
    res.status(500).json({ message: 'Internal server error' });
  }
};

export const chat = async (req: AuthRequest, res: Response) => {
  try {
    const { conversationId, message } = req.body;
    const userId = req.user?.userId;

    if (!message) {
      return res.status(400).json({ message: 'Message is required' });
    }

    let conversation;
    if (conversationId) {
      const query: any = { _id: conversationId };
      if (userId) {
        query.userId = userId;
      } else {
        query.userId = { $exists: false };
      }
      conversation = await ChatConversation.findOne(query);
      if (!conversation) {
        return res.status(404).json({ message: 'Conversation not found' });
      }
    } else {
      let title = 'New Conversation';
      try {
        title = await generateTitle(message);
      } catch {
        // fallback
      }
      conversation = await ChatConversation.create({
        userId: userId ? new mongoose.Types.ObjectId(userId) : undefined,
        title,
        messages: [],
      });
    }

    // Record user message
    conversation.messages.push({
      role: 'user',
      content: message,
      createdAt: new Date(),
    });
    await conversation.save();

    // Set headers for SSE streaming
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');

    // Build conversation history (limit to last 15 to fit context limits)
    const history = conversation.messages.slice(-15).map((m) => ({
      role: m.role,
      content: m.content,
    }));

    const streamCallback = (chunk: string) => {
      res.write(`data: ${JSON.stringify({ chunk })}\n\n`);
    };

    const { content, suggestions } = await generateChatResponse(userId || '', history, streamCallback);

    // Save assistant reply
    conversation.messages.push({
      role: 'assistant',
      content,
      createdAt: new Date(),
    });
    await conversation.save();

    // End stream with summary metadata
    res.write(`data: ${JSON.stringify({ done: true, conversationId: conversation._id, suggestions })}\n\n`);
    res.end();
  } catch (err) {
    console.error('SSE chat error:', err);
    res.write(`data: ${JSON.stringify({ error: 'Failed to generate chat response' })}\n\n`);
    res.end();
  }
};

export const getConversations = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.userId;

    const conversations = await ChatConversation.find({ userId })
      .select('title updatedAt')
      .sort({ updatedAt: -1 })
      .lean();

    res.json({ conversations });
  } catch (err) {
    console.error('getConversations error:', err);
    res.status(500).json({ message: 'Internal server error' });
  }
};

export const getConversationById = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.userId;
    const { id } = req.params;

    const conversation = await ChatConversation.findOne({ _id: id, userId }).lean();
    if (!conversation) {
      return res.status(404).json({ message: 'Conversation not found' });
    }

    res.json({ conversation });
  } catch (err) {
    console.error('getConversationById error:', err);
    res.status(500).json({ message: 'Internal server error' });
  }
};
