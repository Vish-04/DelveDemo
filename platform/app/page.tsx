'use client';

import { useState } from 'react';
import ComplianceForm from './components/ComplianceForm';
import ComplianceResults from './components/ComplianceResults';
import SetupInstructions from './components/SetupInstructions';
import axios from 'axios';

interface ComplianceCredentials {
  projectRef: string;
  serviceRoleKey: string;
  personalAccessToken?: string;
}

interface ComplianceData {
  users?: {
    data: Array<{
      id: string;
      email: string;
      mfa_enabled: boolean;
      status: 'pass' | 'fail';
    }>;
    summary: {
      total_users: number;
      mfa_enabled: number;
      mfa_disabled: number;
      compliance_rate: number;
    };
  };
  tables?: {
    data: Array<{
      schema: string;
      table: string;
      rls_enabled: boolean;
      status: 'pass' | 'fail';
    }>;
    summary: {
      total_tables: number;
      rls_enabled: number;
      rls_disabled: number;
      compliance_rate: number;
    };
    note?: string;
  };
  projects?: {
    data: Array<{
      id: string;
      name: string;
      pitr_enabled: boolean;
      status: 'pass' | 'fail';
    }>;
    summary: {
      total_projects: number;
      pitr_enabled: number;
      pitr_disabled: number;
      compliance_rate: number;
    };
    note?: string;
  };
}

const AlertCircle = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <circle cx="12" cy="12" r="10"></circle>
    <line x1="12" y1="8" x2="12" y2="12"></line>
    <line x1="12" y1="16" x2="12.01" y2="16"></line>
  </svg>
);

export default function Home() {
  const [isLoading, setIsLoading] = useState(false);
  const [complianceData, setComplianceData] = useState<ComplianceData>({});
  const [error, setError] = useState<string | null>(null);
  const [setupInstructions, setSetupInstructions] = useState<any>(null);

  const runComplianceCheck = async (credentials: ComplianceCredentials) => {
    setIsLoading(true);
    setError(null);
    setComplianceData({});

    try {
      // Run all compliance checks in parallel
      const [usersResponse, tablesResponse, projectsResponse] = await Promise.allSettled([
        axios.post('/api/compliance/users', credentials),
        axios.post('/api/compliance/tables', credentials),
        axios.post('/api/compliance/projects', credentials)
      ]);

      const newComplianceData: ComplianceData = {};

      // Process users response
      if (usersResponse.status === 'fulfilled' && usersResponse.value.data.success) {
        console.log("usersResponse.value.data", usersResponse.value.data);
        newComplianceData.users = {
          data: usersResponse.value.data.data,
          summary: usersResponse.value.data.summary
        };
      } else if (usersResponse.status === 'fulfilled' && usersResponse.value.data.setup_required) {
        // Handle setup instructions for MFA function
        console.log("MFA function setup required:", usersResponse.value.data.instructions);
        setSetupInstructions(usersResponse.value.data.instructions);
      }

      // Process tables response
      if (tablesResponse.status === 'fulfilled' && tablesResponse.value.data.success) {
        console.log("tablesResponse.value.data", tablesResponse.value.data);
        newComplianceData.tables = {
          data: tablesResponse.value.data.data,
          summary: tablesResponse.value.data.summary,
          note: tablesResponse.value.data.note
        };
      } else if (tablesResponse.status === 'fulfilled' && tablesResponse.value.data.setup_required) {
        // Handle setup instructions for RLS function
        console.log("RLS function setup required:", tablesResponse.value.data.instructions);
        setSetupInstructions(tablesResponse.value.data.instructions);
      }

      // Process projects response
      if (projectsResponse.status === 'fulfilled' && projectsResponse.value.data.success) {
        console.log("projectsResponse.value.data", projectsResponse.value.data);
        newComplianceData.projects = {
          data: projectsResponse.value.data.data,
          summary: projectsResponse.value.data.summary,
          note: projectsResponse.value.data.note
        };
      }

      setComplianceData(newComplianceData);

      // Check if all requests failed
      if (!newComplianceData.users && !newComplianceData.tables && !newComplianceData.projects) {
        throw new Error('All compliance checks failed. Please verify your credentials and try again.');
      }

    } catch (err: any) {
      console.error('Compliance check error:', err);
      setError(err.message || 'An error occurred while running compliance checks');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="h-8 w-8 bg-blue-600 rounded-lg flex items-center justify-center">
                  <span className="text-white font-bold text-sm">D</span>
                </div>
              </div>
              <div className="ml-4">
                <h1 className="text-xl font-semibold text-gray-900">Delve</h1>
                <p className="text-sm text-gray-500">Supabase Compliance Checker</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            Security Compliance Assessment
          </h2>
          <p className="text-gray-600">
            Analyze your Supabase project for compliance with security best practices including 
            Multi-Factor Authentication, Row Level Security, and Point in Time Recovery.
          </p>
        </div>

        <ComplianceForm onSubmit={runComplianceCheck} isLoading={isLoading} />

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-md p-4 mb-6">
            <div className="flex">
              <AlertCircle className="h-5 w-5 text-red-400 mr-2 flex-shrink-0 mt-0.5" />
              <div className="text-sm text-red-800">{error}</div>
            </div>
          </div>
        )}

        {(complianceData.users || complianceData.tables || complianceData.projects) && (
          <ComplianceResults data={complianceData} isLoading={isLoading} />
        )}

        {setupInstructions && (
          <SetupInstructions 
            instructions={setupInstructions} 
            onClose={() => setSetupInstructions(null)} 
          />
        )}

        {/* Instructions */}
        <div className="mt-8 bg-blue-50 border border-blue-200 rounded-md p-6">
          <h3 className="text-lg font-medium text-blue-900 mb-3">Getting Started</h3>
          <div className="text-sm text-blue-800 space-y-2">
            <p><strong>Project Reference:</strong> Found in your Supabase project URL (e.g., https://your-project-ref.supabase.co)</p>
            <p><strong>Service Role Key:</strong> Found in your project settings under API → Project API keys (service_role key)</p>
            <p><strong>Personal Access Token:</strong> Required for PITR checking. Generate from your Supabase account settings.</p>
          </div>
        </div>

        <div className="mt-4 bg-blue-50 border border-blue-200 rounded-md p-4">
          <div className="flex">
            <AlertCircle className="h-5 w-5 text-blue-400 mr-2 flex-shrink-0 mt-0.5" />
            <div className="text-sm text-blue-800">
              <strong>Note:</strong> MFA & RLS checking require a one-time SQL function setup in your database. PITR checking requires a personal access token.
              If the functions don't exist, you'll be provided with setup instructions.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
