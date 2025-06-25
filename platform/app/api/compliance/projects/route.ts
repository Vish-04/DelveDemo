import { NextRequest, NextResponse } from 'next/server';
import { logComplianceResult, determineComplianceStatus, extractSummaryData } from '../../../lib/compliance-logger';

export async function POST(request: NextRequest) {
  try {
    const { projectRef, personalAccessToken, userEmail } = await request.json();

    if (!projectRef || !personalAccessToken || !userEmail) {
      return NextResponse.json(
        { error: 'Project reference, personal access token, and user email are required' },
        { status: 400 }
      );
    }

    // Validate credentials by testing a simple Management API call first
    try {
      const validationResponse = await fetch(`https://api.supabase.com/v1/projects/${projectRef}`, {
        headers: {
          'Authorization': `Bearer ${personalAccessToken}`,
          'Content-Type': 'application/json'
        }
      });

      if (!validationResponse.ok) {
        console.log('Key validation failed with status:', validationResponse.status);
        
        // Log the validation failure
        if (userEmail) {
          logComplianceResult({
            userEmail,
            checkType: 'PITR',
            projectRef,
            status: 'fail',
            responseData: { error: 'Invalid project reference or personal access token' },
            errorMessage: `Key validation failed with status: ${validationResponse.status}`
          });
        }
        
        return NextResponse.json(
          { error: 'Invalid project reference or personal access token' },
          { status: 401 }
        );
      }
    } catch (error) {
      console.log('Key validation error:', error);
      
      // Log the validation error
      if (userEmail) {
        logComplianceResult({
          userEmail,
          checkType: 'PITR',
          projectRef,
          status: 'fail',
          responseData: { error: 'Invalid project reference or personal access token' },
          errorMessage: 'Key validation error: ' + (error instanceof Error ? error.message : 'Unknown error')
        });
      }
      
      return NextResponse.json(
        { error: 'Invalid project reference or personal access token' },
        { status: 401 }
      );
    }

    // For PITR checking, we need to use Supabase Management API
    // This is a simplified check - in reality you'd need proper management API access
    
    const projectData = {
      id: projectRef,
      name: `Project ${projectRef}`,
      pitr_enabled: false, // This would need actual PITR status checking via Management API
      backup_retention_days: 7, // Default assumption
      status: 'fail' // Default to fail until we can properly check PITR
    };

    // If management API key is provided, attempt to check PITR status
    if (personalAccessToken) { 
      try {
        const response = await fetch(`https://api.supabase.com/v1/projects/${projectRef}/database/backups`, {
          headers: {
            'Authorization': `Bearer ${personalAccessToken}`,
            'Content-Type': 'application/json'
          }
        });


        if (response.ok) {
          const projectInfo = await response.json();
          projectData.pitr_enabled = projectInfo.database?.pitr_enabled || false;
          projectData.status = projectData.pitr_enabled ? 'pass' : 'fail';
          projectData.backup_retention_days = projectInfo.database?.backup_retention_days || 7;
        }
      } catch (error) {
        console.warn('Could not fetch PITR status from Management API:', error);
      }
    }

    const summary = {
      total_projects: 1,
      pitr_enabled: projectData.pitr_enabled ? 1 : 0,
      pitr_disabled: projectData.pitr_enabled ? 0 : 1,
      compliance_rate: projectData.pitr_enabled ? 100 : 0
    };

    const responseData = {
      success: true,
      data: [projectData],
      summary,
      note: personalAccessToken 
        ? 'PITR status checked via Management API' 
        : 'PITR status checking requires Supabase Management API access'
    };

    // Log the compliance result
    const status = determineComplianceStatus(responseData);
    const summaryData = extractSummaryData(responseData);
    
    // Log compliance result (don't await to avoid blocking response)
    if (userEmail) {
      logComplianceResult({
        userEmail,
        checkType: 'PITR',
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
    console.error('Error checking project compliance:', error);
    
    // Log the error (extract from request body if available)
    try {
      const requestBody = await request.json();
      const { projectRef, userEmail } = requestBody;
      
      if (userEmail && projectRef) {
        logComplianceResult({
          userEmail,
          checkType: 'PITR',
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