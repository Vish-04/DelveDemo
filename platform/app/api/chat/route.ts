import { NextRequest, NextResponse } from 'next/server';

const SYSTEM_PROMPT = `You are a helpful AI assistant specialized in Supabase Security Compliance. Your role is to help users understand and implement security best practices for Supabase projects.

Your expertise includes:
- Row Level Security (RLS) policies and implementation
- Multi-Factor Authentication (MFA) setup and best practices
- Point in Time Recovery (PITR) configuration and benefits
- Supabase project security configuration
- Database security best practices
- User authentication and authorization
- API security and service role key management
- Compliance requirements and audit trails

You should:
- Provide clear, actionable advice on Supabase security
- Help troubleshoot security compliance issues
- Explain technical concepts in an accessible way
- Reference official Supabase documentation when relevant
- Focus on practical implementation steps
- Be concise but thorough in your responses

Always prioritize security best practices and compliance requirements in your recommendations.`;

export async function POST(request: NextRequest) {
  try {
    const { messages } = await request.json();

    if (!messages || !Array.isArray(messages)) {
      return NextResponse.json(
        { error: 'Messages array is required' },
        { status: 400 }
      );
    }

    const openAIKey = process.env.NEXT_PUBLIC_OPENAI_API_KEY;
    
    if (!openAIKey) {
      return NextResponse.json(
        { error: 'OpenAI API key not configured' },
        { status: 500 }
      );
    }

    // Prepare messages with system prompt
    const chatMessages = [
      { role: 'system', content: SYSTEM_PROMPT },
      ...messages
    ];

    // Call OpenAI API directly
    const openaiResponse = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAIKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-3.5-turbo',
        messages: chatMessages,
        max_tokens: 250,
        temperature: 0.7,
      }),
    });

    if (!openaiResponse.ok) {
      const errorData = await openaiResponse.json();
      throw new Error(errorData.error?.message || 'OpenAI API error');
    }

    const completion = await openaiResponse.json();
    const response = completion.choices[0]?.message?.content;

    if (!response) {
      return NextResponse.json(
        { error: 'No response generated' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: response
    });

  } catch (error: any) {
    console.error('Chat API error:', error);
    
    if (error?.code === 'insufficient_quota') {
      return NextResponse.json(
        { error: 'OpenAI quota exceeded. Please check your API usage.' },
        { status: 429 }
      );
    }

    if (error?.code === 'invalid_api_key') {
      return NextResponse.json(
        { error: 'Invalid OpenAI API key' },
        { status: 401 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to process chat request' },
      { status: 500 }
    );
  }
} 