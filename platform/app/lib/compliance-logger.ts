import { createClient } from '@supabase/supabase-js';

// Helper function to log compliance check results
export async function logComplianceResult({
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
}: {
  userEmail: string;
  checkType: 'RLS' | 'MFA' | 'PITR';
  projectRef: string;
  status: 'pass' | 'fail';
  responseData: any;
  totalItems?: number;
  compliantItems?: number;
  complianceRate?: number;
  errorMessage?: string;
  setupTitle?: string;
  note?: string;
}) {
  try {
    // Use direct database call instead of HTTP request for server-side logging
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !supabaseServiceKey) {
      console.error('Logging database configuration missing. URL:', !!supabaseUrl, 'Key:', !!supabaseServiceKey);
      console.error('Available env vars:', Object.keys(process.env).filter(key => key.includes('SUPABASE')));
      return;
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    console.log('Attempting to log compliance result for:', userEmail, checkType, projectRef);
    
    // Insert the compliance log directly
    const { error } = await supabase
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
      });

    if (error) {
      console.error('Failed to log compliance result:', error);
    } else {
      console.log('Successfully logged compliance result for:', userEmail, checkType);
    }
  } catch (error) {
    console.error('Error logging compliance result:', error);
  }
}

// Helper function to determine overall status from response
export function determineComplianceStatus(response: any): 'pass' | 'fail' {
  if (response.success === true) {
    // For successful responses, check compliance rate
    if (response.summary?.compliance_rate !== undefined) {
      return response.summary.compliance_rate === 100 ? 'pass' : 'fail';
    }
    // For individual items, check if any failed
    if (response.data && Array.isArray(response.data)) {
      const hasFailures = response.data.some((item: any) => item.status === 'fail');
      return hasFailures ? 'fail' : 'pass';
    }
    return 'pass';
  }
  
  // For setup required or error responses
  return 'fail';
}

// Helper function to extract summary data from response
export function extractSummaryData(response: any) {
  if (response.summary) {
    return {
      totalItems: response.summary.total_tables || response.summary.total_users || response.summary.total_projects || 0,
      compliantItems: response.summary.rls_enabled || response.summary.mfa_enabled || response.summary.pitr_enabled || 0,
      complianceRate: response.summary.compliance_rate || 0
    };
  }
  
  if (response.data && Array.isArray(response.data)) {
    const totalItems = response.data.length;
    const compliantItems = response.data.filter((item: any) => item.status === 'pass').length;
    const complianceRate = totalItems > 0 ? Math.round((compliantItems / totalItems) * 100) : 0;
    
    return { totalItems, compliantItems, complianceRate };
  }
  
  return { totalItems: 0, compliantItems: 0, complianceRate: 0 };
} 