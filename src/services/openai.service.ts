import OpenAI from 'openai';
import Service from '../models/Service';
import Booking from '../models/Booking';

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

// Tool functions execution
export const searchServices = async (query?: string, category?: string, maxPrice?: number) => {
  const filter: any = { status: 'active' };
  if (query) {
    filter.$or = [
      { title: { $regex: query, $options: 'i' } },
      { shortDescription: { $regex: query, $options: 'i' } },
      { fullDescription: { $regex: query, $options: 'i' } },
    ];
  }
  if (category) {
    filter.category = category;
  }
  if (maxPrice) {
    filter.price = { $lte: maxPrice };
  }
  return await Service.find(filter).limit(5).select('title shortDescription category price priceUnit avgRating location').lean();
};

export const getServiceById = async (id: string) => {
  return await Service.findById(id).populate('providerId', 'name avatarUrl location').lean();
};

export const getUserBookings = async (userId: string) => {
  return await Booking.find({
    $or: [{ customerId: userId }, { providerId: userId }],
  })
    .sort({ date: 1 })
    .populate('serviceId', 'title price priceUnit')
    .populate('customerId', 'name')
    .populate('providerId', 'name')
    .limit(5)
    .lean();
};

// Definitions for OpenAI tools
const tools = [
  {
    type: 'function' as const,
    function: {
      name: 'searchServices',
      description: 'Search for active service listings in the marketplace with keywords, category filters, and price limits.',
      parameters: {
        type: 'object',
        properties: {
          query: { type: 'string', description: 'Keyword query to search title and description' },
          category: { type: 'string', description: 'Filter by category name exactly' },
          maxPrice: { type: 'number', description: 'Filter by maximum price limit' },
        },
      },
    },
  },
  {
    type: 'function' as const,
    function: {
      name: 'getServiceById',
      description: 'Get details about a specific service listing by its ID, including provider info.',
      parameters: {
        type: 'object',
        properties: {
          id: { type: 'string', description: 'The unique MongoDB ObjectId of the service' },
        },
        required: ['id'],
      },
    },
  },
  {
    type: 'function' as const,
    function: {
      name: 'getUserBookings',
      description: 'Get the bookings list of the current logged-in user.',
      parameters: {
        type: 'object',
        properties: {},
      },
    },
  },
];

export const generateChatResponse = async (
  userId: string,
  messages: any[],
  onChunk: (chunk: string) => void
): Promise<{ content: string; suggestions: string[] }> => {
  try {
    // Add a system prompt with app context if not present
    const systemPrompt = {
      role: 'system',
      content: `You are the friendly, professional AI Assistant for ServiceHive, a local services marketplace.
      You help users find services, learn about providers, check their bookings, and navigate the platform.
      
      The user's MongoDB ID is "${userId}".
      
      You have access to tools to query the database. Always use them if the user asks for recommendations, specific details, or bookings.
      Routes on the platform:
      - Explore Services: /explore
      - Dashboard: /dashboard
      - List a Service: /services/add
      - Profile: /profile
      - Conversations: /ai/assistant`,
    };

    const finalMessages = [systemPrompt, ...messages];

    // 1. Initial Call to check if tool-calling is requested
    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: finalMessages,
      tools,
      tool_choice: 'auto',
    });

    const message = response.choices[0].message;

    if (message.tool_calls && message.tool_calls.length > 0) {
      // Append the assistant's decision to call tools
      finalMessages.push(message as any);

      // Execute each tool call
      for (const toolCall of message.tool_calls) {
        const functionName = (toolCall as any).function.name;
        const args = JSON.parse((toolCall as any).function.arguments);

        let result: any;
        if (functionName === 'searchServices') {
          result = await searchServices(args.query, args.category, args.maxPrice);
        } else if (functionName === 'getServiceById') {
          result = await getServiceById(args.id);
        } else if (functionName === 'getUserBookings') {
          result = await getUserBookings(userId);
        }

        finalMessages.push({
          role: 'tool',
          tool_call_id: toolCall.id,
          name: functionName,
          content: JSON.stringify(result || { message: 'No records found' }),
        });
      }

      // Call again to stream the response based on tool results
      const stream = await openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: finalMessages,
        stream: true,
        max_tokens: 1000,
      });

      let fullContent = '';
      for await (const chunk of stream) {
        const delta = chunk.choices[0]?.delta?.content || '';
        fullContent += delta;
        onChunk(delta);
      }

      const suggestions = await getFollowUpSuggestions(finalMessages, fullContent);
      return { content: fullContent, suggestions };
    } else {
      // No tool calls needed, stream the response immediately
      const stream = await openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: finalMessages,
        stream: true,
        max_tokens: 1000,
      });

      let fullContent = '';
      for await (const chunk of stream) {
        const delta = chunk.choices[0]?.delta?.content || '';
        fullContent += delta;
        onChunk(delta);
      }

      const suggestions = await getFollowUpSuggestions(finalMessages, fullContent);
      return { content: fullContent, suggestions };
    }
  } catch (err: any) {
    console.warn('OpenAI chat error (falling back to local simulator):', err.message);
    const lastUserMessage = messages.filter((m) => m.role === 'user').pop()?.content || '';

    let responseText = '';
    const query = lastUserMessage.toLowerCase();

    if (query.includes('add') || query.includes('create') || query.includes('list')) {
      responseText = `To list a new service on ServiceHive:
1. Go to the "List a Service" page at /services/add (using the button in the top navigation).
2. Input the title, select a category, add descriptions, and set your price.
3. You can also click the "Generate Descriptions with AI" button to automatically draft your listing description!
4. Click "List Service" to publish it instantly to the explore catalog.`;
    } else if (query.includes('booking') || query.includes('reservation') || query.includes('order')) {
      responseText = `You can manage your service reservations under the Dashboard. As a customer, you can view your requested appointments, track provider approvals, or cancel bookings. As a provider, you can review client requests and approve or complete them in real-time.`;
    } else if (query.includes('recommend') || query.includes('suggest') || query.includes('match')) {
      responseText = `Based on popular categories, I recommend checking out:
- "Algebra Tutoring" for high school academic support
- "Sleek Modern Web Development" for coding services
- "Deep Cleaning Services" for home cleaning
You can view compatibility match percentages on service details pages.`;
    } else {
      responseText = `Welcome to ServiceHive! I am your AI Assistant. I can help you find services, explore providers, guide you on how to list your own services, or check your active bookings. Try asking "how can I add services?".`;
    }

    const chunks = responseText.split(' ');
    let currentText = '';
    for (const chunk of chunks) {
      const delta = chunk + ' ';
      onChunk(delta);
      currentText += delta;
      await new Promise((resolve) => setTimeout(resolve, 30));
    }

    return {
      content: responseText,
      suggestions: [
        'How do I book a service?',
        'Can you recommend tutoring services?',
        'How can I view my dashboard?',
      ],
    };
  }
};

const getFollowUpSuggestions = async (history: any[], lastReply: string): Promise<string[]> => {
  try {
    const suggestionsResponse = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: 'Based on the conversation, suggest exactly 3 short follow-up questions (under 10 words each) the user might ask next. Return as JSON array of strings in format: { "suggestions": ["question 1", "question 2", "question 3"] }',
        },
        ...history.slice(-4),
        { role: 'assistant', content: lastReply },
      ],
      response_format: { type: 'json_object' },
    });

    const parsed = JSON.parse(suggestionsResponse.choices[0]?.message?.content || '{}');
    return parsed.suggestions || parsed || [];
  } catch {
    return ['Can you recommend some popular services?', 'How do I book a service?', 'Where is my dashboard?'];
  }
};

export const generateTitle = async (message: string): Promise<string> => {
  const response = await openai.chat.completions.create({
    model: 'gpt-4o-mini',
    messages: [
      { role: 'system', content: 'Generate a short title (max 5 words) for a conversation based on the first user message. Return only the title text, no quotes.' },
      { role: 'user', content: message },
    ],
    max_tokens: 15,
  });
  return response.choices[0]?.message?.content?.trim() || 'New Conversation';
};

export const generateServiceEmbedding = async (text: string): Promise<number[]> => {
  const response = await openai.embeddings.create({
    model: 'text-embedding-3-small',
    input: text.slice(0, 8000),
  });
  return response.data[0].embedding;
};

export const generateListingDraft = async (bullets: string, tone: string, length: string) => {
  const tonePrompts: Record<string, string> = {
    professional: 'Use a professional, trustworthy tone. Highlight credentials, certifications, and experience.',
    friendly: 'Use a warm, neighborhood-friendly, and approachable tone. Make the provider feel local and cooperative.',
    persuasive: 'Use conversion-focused persuasive copywriting. Emphasize advantages, problem-solving, and quality results.',
  };

  const lengthSettings: Record<string, string> = {
    short: 'Keep the shortDescription under 40 words and the fullDescription under 150 words.',
    medium: 'Keep the shortDescription under 80 words and the fullDescription under 300 words.',
    long: 'The shortDescription can be up to 120 words and the fullDescription up to 500 words.',
  };

  try {
    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: `You are a professional copywriter for a services marketplace called ServiceHive.
          ${tonePrompts[tone] || tonePrompts.professional}
          ${lengthSettings[length] || lengthSettings.medium}
          Return your response strictly as a JSON object: { "shortDescription": "...", "fullDescription": "..." }
          The shortDescription should be a concise summary for card displays. The fullDescription should include key bulleted segments, process description, and what is included.`,
        },
        { role: 'user', content: `Write a service listing based on these bullet points:\n${bullets}` },
      ],
      response_format: { type: 'json_object' },
    });

    return JSON.parse(response.choices[0]?.message?.content || '{}');
  } catch (err: any) {
    console.warn('OpenAI listing generator error (switching to local simulator):', err.message);

    const bulletList = bullets
      .split('\n')
      .map((b) => b.trim())
      .filter(Boolean)
      .map((b) => (b.startsWith('-') || b.startsWith('*') ? b : `- ${b}`))
      .join('\n');

    const tonePrefix =
      tone === 'persuasive'
        ? 'Looking for high-impact quality results that help you stand out?'
        : tone === 'friendly'
        ? 'Hello there! I am happy to offer this friendly service to our local neighborhood.'
        : 'We deliver professional, high-standard services tailored to support your specific needs.';

    const shortDescription = `High-quality specialized service: ${bullets.slice(0, 60)}... ${
      tone === 'persuasive' ? 'Book now for prompt outcomes!' : 'Experienced and fully vetted.'
    }`;

    const fullDescription = `${tonePrefix}

Our service stands out because we guarantee satisfaction, reliability, and open communication at every step.

Here is a summary of what is included in this offering:
${bulletList}

Why choose us?
- Fully certified and background-checked professional
- Top-tier tools and modern procedures
- Flexible timing configured around your calendar
- Clean, transparent rates with zero surprises

Please send a booking request or message with any questions. We look forward to working with you!`;

    return {
      shortDescription: shortDescription.slice(0, 120),
      fullDescription,
    };
  }
};
