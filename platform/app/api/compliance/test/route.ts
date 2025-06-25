import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const { projectRef, serviceRoleKey } = await request.json();

    if (!projectRef || !serviceRoleKey) {
      return NextResponse.json(
        { error: 'Project reference and service role key are required' },
        { status: 400 }
      );
    }

    const supabaseUrl = `https://${projectRef}.supabase.co`;
    
    // Test basic connectivity with a simple endpoint
    const response = await fetch(`${supabaseUrl}/rest/v1/`, {
      headers: {
        'Authorization': `Bearer ${serviceRoleKey}`,
        'apikey': serviceRoleKey,
        'Content-Type': 'application/json'
      }
    });

    const responseText = await response.text();
    
    return NextResponse.json({
      success: response.ok,
      status: response.status,
      statusText: response.statusText,
      response: responseText,
      url: `${supabaseUrl}/rest/v1/`,
      headers: {
        'Authorization': `Bearer ${serviceRoleKey.substring(0, 20)}...`,
        'apikey': `${serviceRoleKey.substring(0, 20)}...`,
      }
    });

  } catch (error) {
    console.error('Test endpoint error:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error },
      { status: 500 }
    );
  }
} 