import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const { projectRef, personalAccessToken } = await request.json();

    if (!projectRef || !personalAccessToken) {
      return NextResponse.json(
        { error: 'Project reference and personal access token are required' },
        { status: 400 }
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

        console.log("RESPONSE", response);

        if (response.ok) {
          const projectInfo = await response.json();
          console.log("PROJECT INFO", projectInfo);
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

    return NextResponse.json({
      success: true,
      data: [projectData],
      summary,
      note: personalAccessToken 
        ? 'PITR status checked via Management API' 
        : 'PITR status checking requires Supabase Management API access'
    });

  } catch (error) {
    console.error('Error checking project compliance:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 