import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { supportChats, supportChatMessages } from '@/lib/db/schema';
import { eq, desc } from 'drizzle-orm';
import { getServerSession } from '@/lib/auth-utils';
import OpenAI from 'openai';

// Check if API key is configured
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const IS_MOCK_MODE = !OPENAI_API_KEY || OPENAI_API_KEY === 'your_openai_api_key_here';

const openai = IS_MOCK_MODE ? null : new OpenAI({
  apiKey: OPENAI_API_KEY,
});

// Mock responses for testing without API key
const MOCK_RESPONSES: Record<string, string> = {
  default: "Thanks for your message! I'm currently running in demo mode without an API key. To enable real AI responses, add your OpenAI API key to the .env.local file.\n\nIn the meantime, I can tell you that TMF AI helps you manage social media, track campaigns, and connect with your audience across multiple platforms!",
  facebook: "To connect Facebook, go to the Integrations tab and click 'Add Platform'. Select Facebook from the list, then configure your OAuth credentials. You'll need a Facebook Developer App with the appropriate permissions.\n\n(Demo mode - add OPENAI_API_KEY for real responses)",
  instagram: "Instagram integration works through the Facebook Business API. Make sure you have a Facebook Business account connected, then you can add Instagram from the Integrations tab.\n\n(Demo mode - add OPENAI_API_KEY for real responses)",
  schedule: "To schedule posts, go to the Post Scheduler tab. Click 'Create Post', write your content, select your target platforms, and choose a date/time. Your post will be automatically published at the scheduled time!\n\n(Demo mode - add OPENAI_API_KEY for real responses)",
  integration: "TMF AI supports many integrations including Facebook, Instagram, Twitter, LinkedIn, TikTok, Google Ads, and more. Go to the Integrations tab to see all available platforms and connect them using OAuth or API keys.\n\n(Demo mode - add OPENAI_API_KEY for real responses)",
  help: "I'm here to help! You can ask me about:\n\n• Connecting social media platforms\n• Scheduling posts\n• Managing your CRM contacts\n• Viewing analytics and reports\n• Troubleshooting connection issues\n\n(Demo mode - add OPENAI_API_KEY for real responses)",
};

// Get mock response based on message content
function getMockResponse(message: string): string {
  const lowerMessage = message.toLowerCase();

  if (lowerMessage.includes('facebook')) return MOCK_RESPONSES.facebook;
  if (lowerMessage.includes('instagram')) return MOCK_RESPONSES.instagram;
  if (lowerMessage.includes('schedule') || lowerMessage.includes('post')) return MOCK_RESPONSES.schedule;
  if (lowerMessage.includes('integration') || lowerMessage.includes('connect')) return MOCK_RESPONSES.integration;
  if (lowerMessage.includes('help')) return MOCK_RESPONSES.help;

  return MOCK_RESPONSES.default;
}

// System prompt for the AI assistant
const SYSTEM_PROMPT = `You are a helpful AI support assistant for TMF AI, a marketing automation and social media management platform. Your role is to:

1. Help users understand and use the platform's features
2. Answer questions about integrations (Facebook, Instagram, Twitter, LinkedIn, Google, etc.)
3. Assist with troubleshooting connection issues
4. Guide users through setting up campaigns and managing their social media
5. Provide best practices for social media marketing
6. Help with CRM and contact management features

Key platform features you should know about:
- Social Media Integrations: Connect multiple platforms (Facebook, Instagram, Twitter, LinkedIn, TikTok, etc.)
- Post Scheduling: Schedule and publish posts across multiple platforms
- Unified Inbox: Manage all messages and comments from one place
- CRM: Contact management and lead tracking
- Analytics & Reports: Track campaign performance
- API Key & OAuth integrations for third-party services

Be friendly, concise, and helpful. If you don't know something specific about the platform, suggest the user contact human support or check the documentation.`;

// GET - Fetch chat history
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession();
    if (!session?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const chatId = searchParams.get('chatId');

    if (chatId) {
      // Get specific chat with messages
      const chat = await db
        .select()
        .from(supportChats)
        .where(eq(supportChats.id, parseInt(chatId)))
        .limit(1);

      if (chat.length === 0 || chat[0].userId !== session.id) {
        return NextResponse.json({ error: 'Chat not found' }, { status: 404 });
      }

      const messages = await db
        .select()
        .from(supportChatMessages)
        .where(eq(supportChatMessages.chatId, parseInt(chatId)))
        .orderBy(supportChatMessages.createdAt);

      return NextResponse.json({ chat: chat[0], messages });
    } else {
      // Get all user's chats
      const chats = await db
        .select()
        .from(supportChats)
        .where(eq(supportChats.userId, session.id))
        .orderBy(desc(supportChats.updatedAt));

      return NextResponse.json({ chats });
    }
  } catch (error) {
    console.error('Support chat GET error:', error);
    return NextResponse.json({ error: 'Failed to fetch chat' }, { status: 500 });
  }
}

// POST - Send a message and get AI response
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession();
    if (!session?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { message, chatId } = await request.json();

    if (!message || typeof message !== 'string') {
      return NextResponse.json({ error: 'Message is required' }, { status: 400 });
    }

    let currentChatId = chatId;

    // Create new chat if no chatId provided
    if (!currentChatId) {
      const [newChat] = await db
        .insert(supportChats)
        .values({
          userId: session.id, // UUID string
          title: message.substring(0, 100), // Use first message as title
          status: 'active',
        })
        .returning();
      currentChatId = newChat.id;
    }

    // Verify chat belongs to user
    const chat = await db
      .select()
      .from(supportChats)
      .where(eq(supportChats.id, currentChatId))
      .limit(1);

    if (chat.length === 0 || chat[0].userId !== session.id) {
      return NextResponse.json({ error: 'Chat not found' }, { status: 404 });
    }

    // Save user message
    await db.insert(supportChatMessages).values({
      chatId: currentChatId,
      role: 'user',
      content: message,
    });

    // Get AI response - either from OpenAI or mock
    let aiResponse: string;

    if (IS_MOCK_MODE) {
      // Use mock response with a small delay to simulate API call
      await new Promise(resolve => setTimeout(resolve, 800));
      aiResponse = getMockResponse(message);
    } else {
      // Get chat history for context
      const chatHistory = await db
        .select()
        .from(supportChatMessages)
        .where(eq(supportChatMessages.chatId, currentChatId))
        .orderBy(supportChatMessages.createdAt);

      // Build messages array for OpenAI
      const openAiMessages: OpenAI.Chat.ChatCompletionMessageParam[] = [
        { role: 'system', content: SYSTEM_PROMPT },
        ...chatHistory.map(msg => ({
          role: msg.role as 'user' | 'assistant',
          content: msg.content,
        })),
      ];

      // Get AI response from OpenAI
      const completion = await openai!.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: openAiMessages,
        max_tokens: 1000,
        temperature: 0.7,
      });

      aiResponse = completion.choices[0]?.message?.content || 'I apologize, but I could not generate a response. Please try again.';
    }

    // Save AI response
    const [savedResponse] = await db
      .insert(supportChatMessages)
      .values({
        chatId: currentChatId,
        role: 'assistant',
        content: aiResponse,
        metadata: IS_MOCK_MODE ? { mode: 'demo' } : { mode: 'openai' },
      })
      .returning();

    // Update chat timestamp
    await db
      .update(supportChats)
      .set({ updatedAt: new Date() })
      .where(eq(supportChats.id, currentChatId));

    return NextResponse.json({
      chatId: currentChatId,
      message: savedResponse,
    });
  } catch (error) {
    console.error('Support chat POST error:', error);

    // Check if it's an OpenAI API error
    if (error instanceof OpenAI.APIError) {
      return NextResponse.json(
        { error: 'AI service temporarily unavailable. Please try again.' },
        { status: 503 }
      );
    }

    return NextResponse.json({ error: 'Failed to send message' }, { status: 500 });
  }
}

// DELETE - Delete a chat
export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession();
    if (!session?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const chatId = searchParams.get('chatId');

    if (!chatId) {
      return NextResponse.json({ error: 'Chat ID required' }, { status: 400 });
    }

    // Verify chat belongs to user
    const chat = await db
      .select()
      .from(supportChats)
      .where(eq(supportChats.id, parseInt(chatId)))
      .limit(1);

    if (chat.length === 0 || chat[0].userId !== session.id) {
      return NextResponse.json({ error: 'Chat not found' }, { status: 404 });
    }

    // Delete chat (messages will cascade)
    await db.delete(supportChats).where(eq(supportChats.id, parseInt(chatId)));

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Support chat DELETE error:', error);
    return NextResponse.json({ error: 'Failed to delete chat' }, { status: 500 });
  }
}
