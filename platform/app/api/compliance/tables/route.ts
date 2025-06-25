import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function POST(request: NextRequest) {
  
  try {
    const requestBody = await request.json();
    
        const { projectRef, serviceRoleKey } = requestBody;

    if (!projectRef || !serviceRoleKey) {
      console.log('Missing credentials - returning 400');
      return NextResponse.json(
        { error: 'Project reference and service role key are required' },
        { status: 400 }
      );
    }

    const supabaseUrl = `https://${projectRef}.supabase.co`;

    // Create a Supabase client
    const supabase = createClient(supabaseUrl, serviceRoleKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    });

    // console.log('Attempting to call RLS status function...');

    // Try to call the RLS checking function
    const { data: tableCompliance, error } = await supabase
      .rpc('check_table_rls_status');

    if (error) {
      // console.log('RLS function call failed:', error);
      
      // Check if it's a function not found error
      // console.log('Function does not exist, returning setup instructions');
      
      const setupInstructions = {
        title: 'SQL Function Setup Required',
        description: 'To check RLS status, you need to create a custom function in your Supabase database.',
        sql: `CREATE OR REPLACE FUNCTION check_table_rls_status()
RETURNS TABLE(
schema text,
"table" text,
rls_enabled boolean,
status text
) 
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
RETURN QUERY
SELECT 
  t.schemaname::text as schema,
  t.tablename::text as "table",
  t.rowsecurity as rls_enabled,
  CASE 
    WHEN t.rowsecurity THEN 'pass'::text
    ELSE 'fail'::text
  END as status
FROM pg_tables t
WHERE t.schemaname = 'public'
  AND t.tablename NOT LIKE 'pg_%'
  AND t.tablename NOT LIKE '_realtime_%'
ORDER BY t.tablename;
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

    // console.log('RLS function executed successfully, got', tableCompliance?.length, 'results');
    
    const summary = {
      total_tables: tableCompliance.length,
      rls_enabled: tableCompliance.filter((t: any) => t.rls_enabled).length,
      rls_disabled: tableCompliance.filter((t: any) => !t.rls_enabled).length,
      compliance_rate: tableCompliance.length > 0 
        ? Math.round((tableCompliance.filter((t: any) => t.rls_enabled).length / tableCompliance.length) * 100)
        : 0
    };

    // console.log('Returning success response with', tableCompliance.length, 'tables');
    return NextResponse.json({
      success: true,
      data: tableCompliance,
      summary,
      note: `RLS status checked using custom SQL function for ${tableCompliance.length} tables.`
    });

  } catch (error) {
    console.error('Error checking table compliance:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 