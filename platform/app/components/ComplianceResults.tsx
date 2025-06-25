'use client';

import { useState } from 'react';

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

interface ComplianceResultsProps {
  data: ComplianceData;
  isLoading: boolean;
}

const CheckCircle = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);

const XCircle = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);

const Users = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
  </svg>
);

const Table = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M3 14h18m-9-4v8m-7 0V4a1 1 0 011-1h14a1 1 0 011 1v16a1 1 0 01-1 1H5a1 1 0 01-1-1z" />
  </svg>
);

const Server = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <rect x="2" y="3" width="20" height="14" rx="2" ry="2"></rect>
    <line x1="8" y1="21" x2="16" y2="21"></line>
    <line x1="12" y1="17" x2="12" y2="21"></line>
  </svg>
);

export default function ComplianceResults({ data, isLoading }: ComplianceResultsProps) {
  const [activeTab, setActiveTab] = useState<'users' | 'tables' | 'projects'>('users');

  if (isLoading) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-1/4 mb-4"></div>
          <div className="space-y-3">
            <div className="h-4 bg-gray-200 rounded"></div>
            <div className="h-4 bg-gray-200 rounded w-5/6"></div>
            <div className="h-4 bg-gray-200 rounded w-3/4"></div>
          </div>
        </div>
      </div>
    );
  }

  if (!data.users && !data.tables && !data.projects) {
    return null;
  }

  const tabs = [
    { id: 'users' as const, label: 'User MFA', icon: Users, data: data.users },
    { id: 'tables' as const, label: 'Table RLS', icon: Table, data: data.tables },
    { id: 'projects' as const, label: 'PITR Backup', icon: Server, data: data.projects },
  ];

  const activeData = data[activeTab];

  return (
    <div className="bg-white rounded-lg shadow-md overflow-hidden">
      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8 px-6">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            const hasData = !!tab.data;
            
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`py-4 px-1 border-b-2 font-medium text-sm flex items-center space-x-2 ${
                  isActive
                    ? 'border-blue-500 text-blue-600'
                    : hasData
                    ? 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    : 'border-transparent text-gray-300 cursor-not-allowed'
                }`}
                disabled={!hasData}
              >
                <Icon className="h-5 w-5" />
                <span>{tab.label}</span>
                {hasData && (
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                    tab.data?.summary.compliance_rate === 100
                      ? 'bg-green-100 text-green-800'
                      : tab.data?.summary.compliance_rate === 0
                      ? 'bg-red-100 text-red-800'
                      : 'bg-yellow-100 text-yellow-800'
                  }`}>
                    {tab.data?.summary.compliance_rate}%
                  </span>
                )}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Content */}
      <div className="p-6">
        {activeData ? (
          <div>
            {/* Summary */}
            <div className="mb-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                {activeTab === 'users' && 'Multi-Factor Authentication Status'}
                {activeTab === 'tables' && 'Row Level Security Status'}
                {activeTab === 'projects' && 'Point in Time Recovery Status'}
              </h3>
              
                             <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
                 <div className="bg-gray-50 p-4 rounded-lg">
                   <div className="text-2xl font-bold text-gray-900">
                     {activeTab === 'users' && 'total_users' in activeData.summary && activeData.summary.total_users}
                     {activeTab === 'tables' && 'total_tables' in activeData.summary && activeData.summary.total_tables}
                     {activeTab === 'projects' && 'total_projects' in activeData.summary && activeData.summary.total_projects}
                   </div>
                   <div className="text-sm text-gray-600">
                     Total {activeTab === 'users' ? 'Users' : activeTab === 'tables' ? 'Tables' : 'Projects'}
                   </div>
                 </div>
                 
                 <div className="bg-green-50 p-4 rounded-lg">
                   <div className="text-2xl font-bold text-green-600">
                     {activeTab === 'users' && 'mfa_enabled' in activeData.summary && activeData.summary.mfa_enabled}
                     {activeTab === 'tables' && 'rls_enabled' in activeData.summary && activeData.summary.rls_enabled}
                     {activeTab === 'projects' && 'pitr_enabled' in activeData.summary && activeData.summary.pitr_enabled}
                   </div>
                   <div className="text-sm text-green-600">Compliant</div>
                 </div>
                 
                 <div className="bg-red-50 p-4 rounded-lg">
                   <div className="text-2xl font-bold text-red-600">
                     {activeTab === 'users' && 'mfa_disabled' in activeData.summary && activeData.summary.mfa_disabled}
                     {activeTab === 'tables' && 'rls_disabled' in activeData.summary && activeData.summary.rls_disabled}
                     {activeTab === 'projects' && 'pitr_disabled' in activeData.summary && activeData.summary.pitr_disabled}
                   </div>
                   <div className="text-sm text-red-600">Non-Compliant</div>
                 </div>
                
                <div className={`p-4 rounded-lg ${
                  activeData.summary.compliance_rate === 100
                    ? 'bg-green-50'
                    : activeData.summary.compliance_rate === 0
                    ? 'bg-red-50'
                    : 'bg-yellow-50'
                }`}>
                  <div className={`text-2xl font-bold ${
                    activeData.summary.compliance_rate === 100
                      ? 'text-green-600'
                      : activeData.summary.compliance_rate === 0
                      ? 'text-red-600'
                      : 'text-yellow-600'
                  }`}>
                    {activeData.summary.compliance_rate}%
                  </div>
                  <div className={`text-sm ${
                    activeData.summary.compliance_rate === 100
                      ? 'text-green-600'
                      : activeData.summary.compliance_rate === 0
                      ? 'text-red-600'
                      : 'text-yellow-600'
                  }`}>
                    Compliance Rate
                  </div>
                </div>
              </div>

                             {'note' in activeData && activeData.note && (
                 <div className="bg-yellow-50 border border-yellow-200 rounded-md p-4">
                   <div className="text-sm text-yellow-800">{activeData.note}</div>
                 </div>
               )}
            </div>

            {/* Details Table */}
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    {activeTab === 'users' && (
                      <>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Email
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          MFA Enabled
                        </th>
                      </>
                    )}
                    {activeTab === 'tables' && (
                      <>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Schema
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Table
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          RLS Enabled
                        </th>
                      </>
                    )}
                    {activeTab === 'projects' && (
                      <>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Project
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          PITR Enabled
                        </th>
                      </>
                    )}
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {activeData.data.map((item, index) => (
                    <tr key={index}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {item.status === 'pass' ? (
                          <CheckCircle className="h-5 w-5 text-green-500" />
                        ) : (
                          <XCircle className="h-5 w-5 text-red-500" />
                        )}
                      </td>
                      {activeTab === 'users' && 'email' in item && (
                        <>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {item.email}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                              'mfa_enabled' in item && item.mfa_enabled
                                ? 'bg-green-100 text-green-800'
                                : 'bg-red-100 text-red-800'
                            }`}>
                              {'mfa_enabled' in item && item.mfa_enabled ? 'Yes' : 'No'}
                            </span>
                          </td>
                        </>
                      )}
                      {activeTab === 'tables' && 'schema' in item && (
                        <>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {item.schema}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {'table' in item ? item.table : ''}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                              'rls_enabled' in item && item.rls_enabled
                                ? 'bg-green-100 text-green-800'
                                : 'bg-red-100 text-red-800'
                            }`}>
                              {'rls_enabled' in item && item.rls_enabled ? 'Yes' : 'No'}
                            </span>
                          </td>
                        </>
                      )}
                      {activeTab === 'projects' && 'name' in item && (
                        <>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {item.name}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                              'pitr_enabled' in item && item.pitr_enabled
                                ? 'bg-green-100 text-green-800'
                                : 'bg-red-100 text-red-800'
                            }`}>
                              {'pitr_enabled' in item && item.pitr_enabled ? 'Yes' : 'No'}
                            </span>
                          </td>
                        </>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ) : (
          <div className="text-center py-12">
            <div className="text-gray-500">No data available for this compliance check.</div>
          </div>
        )}
      </div>
    </div>
  );
} 