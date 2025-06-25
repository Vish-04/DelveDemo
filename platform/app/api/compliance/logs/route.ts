import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// GET endpoint to fetch logs by email
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userEmail = searchParams.get('email');
    const checkType = searchParams.get('checkType');
    const limit = parseInt(searchParams.get('limit') || '50');

    if (!userEmail) {
      return NextResponse.json(
        { error: 'User email is required' },
        { status: 400 }
      );
    }

    // This would connect to your main compliance logging database
    // For now, I'll assume you're using the same Supabase project for logging
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !supabaseServiceKey) {
      return NextResponse.json(
        { error: 'Logging database configuration missing' },
        { status: 500 }
      );
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Build query
    let query = supabase
      .from('compliance_logs')
      .select('*')
      .eq('user_email', userEmail)
      .order('created_at', { ascending: false })
      .limit(limit);

    // Add optional filters
    if (checkType) {
      query = query.eq('check_type', checkType);
    }

    const { data: logs, error } = await query;

    if (error) {
      console.error('Error fetching compliance logs:', error);
      return NextResponse.json(
        { error: 'Failed to fetch compliance logs' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: logs,
      count: logs.length
    });

  } catch (error) {
    console.error('Error in logs GET endpoint:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST endpoint to create a new compliance log
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      userEmail,
      checkType,
      projectRef,
      status,
      responseData,
      totalItems = 0,
      compliantItems = 0,
      complianceRate = 0,
      errorMessage,
      setupTitle,
      note
    } = body;

    // Validate required fields
    if (!userEmail || !checkType || !projectRef || !status || !responseData) {
      return NextResponse.json(
        { error: 'Missing required fields: userEmail, checkType, projectRef, status, responseData' },
        { status: 400 }
      );
    }

    // Validate check_type and status values
    const validCheckTypes = ['RLS', 'MFA', 'PITR'];
    const validStatuses = ['pass', 'fail'];

    if (!validCheckTypes.includes(checkType)) {
      return NextResponse.json(
        { error: 'Invalid checkType. Must be one of: RLS, MFA, PITR' },
        { status: 400 }
      );
    }

    if (!validStatuses.includes(status)) {
      return NextResponse.json(
        { error: 'Invalid status. Must be either pass or fail' },
        { status: 400 }
      );
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !supabaseServiceKey) {
      return NextResponse.json(
        { error: 'Logging database configuration missing' },
        { status: 500 }
      );
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Insert the compliance log
    const { data: newLog, error } = await supabase
      .from('compliance_logs')
      .insert({
        user_email: userEmail,
        check_type: checkType,
        project_ref: projectRef,
        status,
        response_data: responseData,
        total_items: totalItems,
        compliant_items: compliantItems,
        compliance_rate: complianceRate,
        error_message: errorMessage,
        setup_title: setupTitle,
        note
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating compliance log:', error);
      return NextResponse.json(
        { error: 'Failed to create compliance log' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: newLog
    });

  } catch (error) {
    console.error('Error in logs POST endpoint:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 