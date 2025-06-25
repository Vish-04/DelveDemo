'use client';

import { useState } from 'react';

interface ComplianceFormProps {
  onSubmit: (credentials: {
    projectRef: string;
    serviceRoleKey: string;
    managementApiKey?: string;
  }) => void;
  isLoading: boolean;
}

// Simple SVG icons as components
const Shield = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
  </svg>
);

const Database = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <ellipse cx="12" cy="5" rx="9" ry="3"></ellipse>
    <path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3"></path>
    <path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5"></path>
  </svg>
);

const Key = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
  </svg>
);

export default function ComplianceForm({ onSubmit, isLoading }: ComplianceFormProps) {
  const [projectRef, setProjectRef] = useState('');
  const [serviceRoleKey, setServiceRoleKey] = useState('');
  const [managementApiKey, setManagementApiKey] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({
      projectRef,
      serviceRoleKey,
      managementApiKey: managementApiKey || undefined
    });
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6 mb-6">
      <div className="flex items-center mb-4">
        <Shield className="h-6 w-6 text-blue-600 mr-2" />
        <h2 className="text-xl font-semibold text-gray-900">Supabase Credentials</h2>
      </div>
      
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="projectRef" className="block text-sm font-medium text-gray-700 mb-1">
            Project Reference
          </label>
          <div className="relative">
            <Database className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              id="projectRef"
              value={projectRef}
              onChange={(e) => setProjectRef(e.target.value)}
              className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="your-project-ref"
              required
            />
          </div>
          <p className="text-xs text-gray-500 mt-1">
            Found in your Supabase project URL: https://your-project-ref.supabase.co
          </p>
        </div>

        <div>
          <label htmlFor="serviceRoleKey" className="block text-sm font-medium text-gray-700 mb-1">
            Service Role Key
          </label>
          <div className="relative">
            <Key className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="password"
              id="serviceRoleKey"
              value={serviceRoleKey}
              onChange={(e) => setServiceRoleKey(e.target.value)}
              className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
              required
            />
          </div>
          <p className="text-xs text-gray-500 mt-1">
            Found in your Supabase project settings under API keys
          </p>
        </div>



        <div>
          <label htmlFor="managementApiKey" className="block text-sm font-medium text-gray-700 mb-1">
            Management API Key <span className="text-gray-400">(Optional)</span>
          </label>
          <div className="relative">
            <Key className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="password"
              id="managementApiKey"
              value={managementApiKey}
              onChange={(e) => setManagementApiKey(e.target.value)}
              className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="sbp_xxx..."
            />
          </div>
          <p className="text-xs text-gray-500 mt-1">
            Required for PITR compliance checking. Generate from your Supabase account settings.
          </p>
        </div>

        <button
          type="submit"
          disabled={isLoading || !projectRef || !serviceRoleKey}
          className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {isLoading ? 'Running Compliance Check...' : 'Run Compliance Check'}
        </button>
        
        <button
          type="button"
          onClick={async () => {
            if (!projectRef || !serviceRoleKey) return;
            
            try {
              const response = await fetch('/api/compliance/test', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ projectRef, serviceRoleKey })
              });
              const result = await response.json();
              console.log('Test result:', result);
              alert(`Test ${result.success ? 'PASSED' : 'FAILED'}: ${result.status} ${result.statusText}\n\nCheck console for details.`);
            } catch (error) {
              console.error('Test error:', error);
              alert('Test failed - check console for details');
            }
          }}
          disabled={!projectRef || !serviceRoleKey}
          className="w-full bg-gray-600 text-white py-2 px-4 rounded-md hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors mt-2"
        >
          Test Connection
        </button>
      </form>
    </div>
  );
} 