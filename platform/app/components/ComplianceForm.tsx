'use client';

import { useState } from 'react';
import { ShieldCheck, Database, Key } from 'lucide-react';

interface ComplianceFormProps {
  onSubmit: (credentials: {
    projectRef: string;
    serviceRoleKey: string;
    personalAccessToken?: string;
  }) => void;
  isLoading: boolean;
}

export default function ComplianceForm({ onSubmit, isLoading }: ComplianceFormProps) {
  const [projectRef, setProjectRef] = useState('');
  const [serviceRoleKey, setServiceRoleKey] = useState('');
  const [personalAccessToken, setPersonalAccessToken] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({
      projectRef,
      serviceRoleKey,
      personalAccessToken: personalAccessToken || undefined
    });
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6 mb-6">
      <div className="flex items-center mb-4">
        <ShieldCheck className="h-6 w-6 text-blue-600 mr-2" />
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
          <label htmlFor="personalAccessToken" className="block text-sm font-medium text-gray-700 mb-1">
            Personal Access Token
          </label>
          <div className="relative">
            <Key className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="password"
              id="personalAccessToken"
              value={personalAccessToken}
              onChange={(e) => setPersonalAccessToken(e.target.value)}
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
          disabled={isLoading || !projectRef || !serviceRoleKey || !personalAccessToken}
          className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {isLoading ? 'Running Compliance Check...' : 'Run Compliance Check'}
        </button>
      </form>
    </div>
  );
} 