import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { logComplianceResult, determineComplianceStatus, extractSummaryData } from '../../../lib/compliance-logger';

export async function POST(request: NextRequest) {
  
  try {
    const requestBody = await request.json();
    
        const { projectRef, serviceRoleKey, userEmail } = requestBody;

    if (!projectRef || !serviceRoleKey || !userEmail) {
      console.log('Missing credentials - returning 400');
      return NextResponse.json(
        { error: 'Project reference, service role key, and user email are required' },
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

    // Validate credentials by testing connection with a simple query
    try {
      const { error: validationError } = await supabase.auth.admin.listUsers({
        page: 1,
        perPage: 1
      });
      
      if (validationError) {
        console.log('Key validation failed:', validationError);
        
        // Log the validation failure
        if (userEmail) {
          logComplianceResult({
            userEmail,
            checkType: 'RLS',
            projectRef,
            status: 'fail',
            responseData: { error: 'Invalid project reference or service role key' },
            errorMessage: 'Key validation failed: ' + (validationError.message || 'Unknown validation error')
          });
        }
        
        return NextResponse.json(
          { error: 'Invalid project reference or service role key' },
          { status: 401 }
        );
      }
    } catch (error) {
      console.log('Key validation error:', error);
      
      // Log the validation error
      if (userEmail) {
        logComplianceResult({
          userEmail,
          checkType: 'RLS',
          projectRef,
          status: 'fail',
          responseData: { error: 'Invalid project reference or service role key' },
          errorMessage: 'Key validation error: ' + (error instanceof Error ? error.message : 'Unknown error')
        });
      }
      
      return NextResponse.json(
        { error: 'Invalid project reference or service role key' },
        { status: 401 }
      );
    }

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
        
        const setupResponse = {
          setup_required: true,
          instructions: setupInstructions
        };

        // Log the setup required result
        if (userEmail) {
          logComplianceResult({
            userEmail,
            checkType: 'RLS',
            projectRef,
            status: 'fail',
            responseData: setupResponse,
            setupTitle: setupInstructions.title,
            note: 'SQL function setup required'
          });
        }

        return NextResponse.json(setupResponse);
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
    const responseData = {
      success: true,
      data: tableCompliance,
      summary,
      note: `RLS status checked using custom SQL function for ${tableCompliance.length} tables.`
    };

    // Log the compliance result
    const status = determineComplianceStatus(responseData);
    const summaryData = extractSummaryData(responseData);
    
    // Log compliance result (don't await to avoid blocking response)
    if (userEmail) {
      logComplianceResult({
        userEmail,
        checkType: 'RLS',
        projectRef,
        status,
        responseData,
        totalItems: summaryData.totalItems,
        compliantItems: summaryData.compliantItems,
        complianceRate: summaryData.complianceRate,
        note: responseData.note
      });
    }

    return NextResponse.json(responseData);

  } catch (error) {
    console.error('Error checking table compliance:', error);
    
    // Log the error (extract from request body if available)
    try {
      const requestBody = await request.json();
      const { projectRef, userEmail } = requestBody;
      
      if (userEmail && projectRef) {
        logComplianceResult({
          userEmail,
          checkType: 'RLS',
          projectRef,
          status: 'fail',
          responseData: { error: 'Internal server error' },
          errorMessage: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    } catch (parseError) {
      // Ignore parsing errors in error handler
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 