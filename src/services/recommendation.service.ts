import UserEvent from '../models/UserEvent';
import Service from '../models/Service';
import Recommendation from '../models/Recommendation';
import { generateServiceEmbedding } from './openai.service';
import OpenAI from 'openai';

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

function cosineSimilarity(a: number[], b: number[]): number {
  const dotProduct = a.reduce((sum, val, i) => sum + val * b[i], 0);
  const magnitudeA = Math.sqrt(a.reduce((sum, val) => sum + val * val, 0));
  const magnitudeB = Math.sqrt(b.reduce((sum, val) => sum + val * val, 0));
  if (magnitudeA === 0 || magnitudeB === 0) return 0;
  return dotProduct / (magnitudeA * magnitudeB);
}

export const generateRecommendations = async (userId: string): Promise<void> => {
  // 1. Get user's interaction history (views, bookings, bookmarks)
  const events = await UserEvent.find({ userId }).sort({ createdAt: -1 }).limit(50).lean();
  
  const viewedServiceIds = events.filter(e => e.type === 'view').map(e => e.serviceId);
  const bookedServiceIds = events.filter(e => e.type === 'book').map(e => e.serviceId);
  const savedServiceIds = events.filter(e => e.type === 'save').map(e => e.serviceId);

  const allInteractedIds = Array.from(
    new Set([...viewedServiceIds, ...bookedServiceIds, ...savedServiceIds].map(id => id?.toString()))
  ).filter((id): id is string => !!id);

  // 2. Fetch interacted services and extract preferred categories
  const interactedServices = await Service.find({ _id: { $in: allInteractedIds } } as any).lean();
  const preferredCategories = Array.from(new Set(interactedServices.map(s => s.category)));

  let candidates: any[] = [];

  if (preferredCategories.length > 0) {
    // Candidates are services in preferred categories, excluding already interacted ones
    candidates = await Service.find({
      category: { $in: preferredCategories },
      _id: { $nin: allInteractedIds },
      status: 'active',
    } as any).limit(20);
  }

  // Fallback: If no candidate list, fetch top 10 popular/highest-rated active services
  if (candidates.length === 0) {
    candidates = await Service.find({
      status: 'active',
      _id: { $nin: allInteractedIds },
    } as any)
      .sort({ avgRating: -1, reviewCount: -1 })
      .limit(10);
  }

  if (candidates.length === 0) {
    return; // No listings available to recommend
  }

  // 3. Ensure all candidates have embeddings
  for (const candidate of candidates) {
    if (!candidate.embedding || candidate.embedding.length === 0) {
      const text = `${candidate.title} ${candidate.shortDescription} ${candidate.fullDescription} ${candidate.category}`;
      try {
        candidate.embedding = await generateServiceEmbedding(text);
        // Save back to db so we don't recalculate next time
        await Service.findByIdAndUpdate(candidate._id, { embedding: candidate.embedding });
      } catch (err) {
        console.error(`Failed to generate embedding for service ${candidate._id}:`, err);
      }
    }
  }

  // Ensure all interacted services have embeddings as well
  for (const service of interactedServices) {
    if (!service.embedding || service.embedding.length === 0) {
      const text = `${service.title} ${service.shortDescription} ${service.fullDescription} ${service.category}`;
      try {
        const embedding = await generateServiceEmbedding(text);
        await Service.findByIdAndUpdate(service._id, { embedding });
        service.embedding = embedding;
      } catch (err) {
        console.error(`Failed to generate embedding for interacted service ${service._id}:`, err);
      }
    }
  }

  let userEmbedding: number[] | null = null;
  const validInteractedEmbeddings = interactedServices.filter(s => s.embedding && s.embedding.length > 0).map(s => s.embedding!);

  if (validInteractedEmbeddings.length > 0) {
    // 4. Calculate user preference profile embedding (average of historical interactions)
    const embeddingLength = validInteractedEmbeddings[0].length;
    userEmbedding = new Array(embeddingLength).fill(0);
    for (let i = 0; i < embeddingLength; i++) {
      const sum = validInteractedEmbeddings.reduce((acc, emb) => acc + emb[i], 0);
      userEmbedding[i] = sum / validInteractedEmbeddings.length;
    }
  }

  let ranked: { service: any; score: number }[] = [];

  if (userEmbedding) {
    // Rank candidates by cosine similarity to user preference profile
    ranked = candidates
      .filter(s => s.embedding && s.embedding.length > 0)
      .map(service => ({
        service,
        score: cosineSimilarity(userEmbedding!, service.embedding!),
      }))
      .sort((a, b) => b.score - a.score)
      .slice(0, 10);
  } else {
    // Fallback: Rank by rating
    ranked = candidates.map(service => ({
      service,
      score: (service.avgRating / 5.0) * 0.8 + 0.2, // map 0-5 rating to 0.2-1.0 score
    }));
  }

  // 5. Generate GPT explanations
  const scoredRecommendations = await Promise.all(
    ranked.map(async ({ service, score }) => {
      let reason = `Based on your interest in ${service.category} services.`;
      
      if (preferredCategories.length > 0) {
        try {
          const reasonResponse = await openai.chat.completions.create({
            model: 'gpt-4o-mini',
            messages: [
              {
                role: 'system',
                content: `You are a recommendation explainer. Based on the user's categories of interest (${preferredCategories.join(', ')}), write a single sentence (max 15 words) explaining why they would like this service. Keep it natural, direct, and engaging. Do not use generic introductions.`,
              },
              { role: 'user', content: `Service: ${service.title} — Category: ${service.category}. Description: ${service.shortDescription}` },
            ],
            max_tokens: 40,
          });
          reason = reasonResponse.choices[0]?.message?.content?.trim() || reason;
        } catch (err) {
          console.error('Failed to generate GPT explanation:', err);
        }
      } else {
        reason = `Recommended as one of our top-rated local service listings.`;
      }

      return {
        userId,
        serviceId: service._id,
        score: Math.round(score * 100), // convert to percentage
        reason,
      };
    })
  );

  // 6. Refresh recommendations cache
  await Recommendation.deleteMany({ userId });
  if (scoredRecommendations.length > 0) {
    await Recommendation.insertMany(scoredRecommendations);
  }
};
