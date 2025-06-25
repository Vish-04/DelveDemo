import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

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
    // console.log('Supabase URL constructed:', supabaseUrl);

    // Create a Supabase client
    const supabase = createClient(supabaseUrl, serviceRoleKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    });

    // Validate credentials by testing connection with admin access
    try {
      const { error: validationError } = await supabase.auth.admin.listUsers({
        page: 1,
        perPage: 1
      });
      
      if (validationError) {
        console.log('Key validation failed:', validationError);
        return NextResponse.json(
          { error: 'Invalid project reference or service role key' },
          { status: 401 }
        );
      }
    } catch (error) {
      console.log('Key validation error:', error);
      return NextResponse.json(
        { error: 'Invalid project reference or service role key' },
        { status: 401 }
      );
    }

    // Fetch all users
    const { data: response, error } = await supabase.auth.admin.listUsers();
    // console.log("USERS RESPONSE:", response?.users);

    if (error) {
      console.error('Error fetching users:', error);
      return NextResponse.json(
        { error: `Failed to fetch users: ${error.message}` },
        { status: 500 }
      );
    }

    const users = response.users || [];
    // console.log('Users fetched successfully:', { count: users.length });
    
    // Test if the function exists by trying to call it with a dummy UUID
    // console.log('Testing if get_user_mfa_status function exists...');
    const { data: testData, error: testError } = await supabase
      .rpc('get_user_mfa_status', { target_user_id: users[0].id });
    
    if (testError) {
    //   console.log('Function test error:', testError);
      
      // Check if it's a function not found error
    // console.log('Function does not exist, returning setup instructions');
    
    const setupInstructions = {
        title: 'MFA Function Setup Required',
        description: 'To check MFA status, you need to create a custom function in your Supabase database.',
        sql: `CREATE OR REPLACE FUNCTION get_user_mfa_status(target_user_id uuid)
RETURNS TABLE(
user_id uuid,
mfa_enabled boolean,
factor_count integer,
factors json
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
RETURN QUERY
SELECT 
target_user_id as user_id,
CASE 
    WHEN COUNT(af.id) > 0 THEN true
    ELSE false
END as mfa_enabled,
COUNT(af.id)::integer as factor_count,
COALESCE(
    json_agg(
    json_build_object(
        'id', af.id,
        'friendly_name', af.friendly_name,
        'factor_type', af.factor_type,
        'status', af.status,
        'created_at', af.created_at,
        'updated_at', af.updated_at
    )
    ) FILTER (WHERE af.id IS NOT NULL),
    '[]'::json
) as factors
FROM auth.mfa_factors af
WHERE af.user_id = target_user_id 
AND af.status = 'verified'
GROUP BY target_user_id;
END;
$$;`,
        steps: [
        'Go to your Supabase dashboard',
        'Navigate to the SQL Editor',
        'Copy and paste the SQL function above',
        'Run the query to create the function',
        'Return here and run the compliance check again'
        ]
    };
    
    return NextResponse.json({
        setup_required: true,
        instructions: setupInstructions
    });
    }
    
    // console.log('MFA function exists, proceeding with compliance check...');
    
    // Check MFA status using the custom database function
    const userCompliance = [];
    
    for (const user of users) {
    //   console.log(`Checking MFA for user ${user.email}...`);
      
      try {
        // Query MFA status using our custom function
        const { data: mfaStatus, error: factorsError } = await supabase
          .rpc('get_user_mfa_status', { target_user_id: user.id });
        
        if (factorsError) {
          console.log(`Error fetching MFA factors for user ${user.email}:`, factorsError);
          userCompliance.push({
            id: user.id,
            email: user.email,
            created_at: user.created_at,
            mfa_enabled: false,
            status: 'fail'
          });
          continue;
        }
        
        // The function returns an array, get the first result
        const userMfaData = mfaStatus?.[0];
        
        // console.log(`User ${user.email} MFA status:`, userMfaData);
        
        const mfaEnabled = userMfaData?.mfa_enabled || false;
        
        userCompliance.push({
          id: user.id,
          email: user.email,
          created_at: user.created_at,
          mfa_enabled: mfaEnabled,
          status: mfaEnabled ? 'pass' : 'fail',
          mfa_factors_count: userMfaData?.factor_count || 0,
          mfa_factors: userMfaData?.factors || []
        });
        
      } catch (error) {
        console.log(`Error checking MFA for user ${user.email}:`, error);
        userCompliance.push({
          id: user.id,
          email: user.email,
          created_at: user.created_at,
          mfa_enabled: false,
          status: 'fail'
        });
      }
    }

    // console.log('User compliance:', userCompliance);

    const summary = {
      total_users: userCompliance.length,
      mfa_enabled: userCompliance.filter((u: any) => u.mfa_enabled === true).length,
      mfa_disabled: userCompliance.filter((u: any) => u.mfa_enabled === false).length,
      compliance_rate: userCompliance.length > 0 
        ? Math.round((userCompliance.filter((u: any) => u.mfa_enabled === true).length / userCompliance.length) * 100)
        : 0
    };

    // console.log('Summary:', summary);

    return NextResponse.json({
      success: true,
      data: userCompliance,
      summary,
      note: `MFA status checked using custom SQL function for ${userCompliance.length} users.`
    });

  } catch (error) {
    console.error('Error checking user compliance:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 