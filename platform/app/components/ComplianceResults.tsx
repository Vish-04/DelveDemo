'use client';

import { useState } from 'react';
import { CheckCircle, XCircle, Users, Table, Server } from 'lucide-react';

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
              
              {/* Special simplified view for PITR */}
              {activeTab === 'projects' ? (
                <div className="bg-gray-50 p-6 rounded-lg">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="text-lg font-medium text-gray-900 mb-2">
                        PITR Backup Enabled
                      </h4>
                      <p className="text-sm text-gray-600">
                        Point in Time Recovery backup status for your project
                      </p>
                    </div>
                    <div className="flex items-center space-x-3">
                      {(activeData.data[0] as { pitr_enabled: boolean })?.pitr_enabled ? (
                        <>
                          <CheckCircle className="h-8 w-8 text-green-500" />
                          <span className="text-2xl font-bold text-green-600">Yes</span>
                        </>
                      ) : (
                        <>
                          <span className="text-2xl font-semibold text-red-600">No</span>
                          <XCircle strokeWidth={2} className="h-7 w-7 text-red-500" />
                        </>
                      )}
                    </div>
                  </div>
                </div>
              ) : (
                // Existing complex view for users and tables
                <div>
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <div className="text-2xl font-bold text-gray-900">
                        {activeTab === 'users' && 'total_users' in activeData.summary && activeData.summary.total_users}
                        {activeTab === 'tables' && 'total_tables' in activeData.summary && activeData.summary.total_tables}
                      </div>
                      <div className="text-sm text-gray-600">
                        Total {activeTab === 'users' ? 'Users' : 'Tables'}
                      </div>
                    </div>
                    
                    <div className="bg-green-50 p-4 rounded-lg">
                      <div className="text-2xl font-bold text-green-600">
                        {activeTab === 'users' && 'mfa_enabled' in activeData.summary && activeData.summary.mfa_enabled}
                        {activeTab === 'tables' && 'rls_enabled' in activeData.summary && activeData.summary.rls_enabled}
                      </div>
                      <div className="text-sm text-green-600">Compliant</div>
                    </div>
                    
                    <div className="bg-red-50 p-4 rounded-lg">
                      <div className="text-2xl font-bold text-red-600">
                        {activeTab === 'users' && 'mfa_disabled' in activeData.summary && activeData.summary.mfa_disabled}
                        {activeTab === 'tables' && 'rls_disabled' in activeData.summary && activeData.summary.rls_disabled}
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
              )}
            </div>

            {/* Details Table - only show for users and tables, not for projects */}
            {activeTab !== 'projects' && (
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
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
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