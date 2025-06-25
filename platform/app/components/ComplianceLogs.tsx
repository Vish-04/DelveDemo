'use client';

import { useState, useEffect } from 'react';

interface ComplianceLog {
  id: number;
  user_email: string;
  check_type: 'RLS' | 'MFA' | 'PITR';
  project_ref: string;
  status: 'pass' | 'fail';
  created_at: string;
  response_data: any;
  total_items: number;
  compliant_items: number;
  compliance_rate: number;
  error_message?: string;
  setup_title?: string;
  note?: string;
}

interface ComplianceLogsProps {
  userEmail: string;
  projectRef?: string;
}

export default function ComplianceLogs({ userEmail, projectRef }: ComplianceLogsProps) {
  const [logs, setLogs] = useState<ComplianceLog[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedCheckType, setSelectedCheckType] = useState<string>('');
  const [selectedStatus, setSelectedStatus] = useState<string>('');
  const [expandedLogId, setExpandedLogId] = useState<number | null>(null);

  const fetchLogs = async () => {
    setLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams({
        email: userEmail,
        limit: '50'
      });

      if (projectRef) {
        params.append('projectRef', projectRef);
      }
      if (selectedCheckType) {
        params.append('checkType', selectedCheckType);
      }

      const response = await fetch(`/api/compliance/logs?${params}`);
      const data = await response.json();

      if (data.success) {
        let filteredLogs = data.data;
        
        // Apply status filter on frontend if selected
        if (selectedStatus) {
          filteredLogs = filteredLogs.filter((log: ComplianceLog) => log.status === selectedStatus);
        }
        
        setLogs(filteredLogs);
      } else {
        setError(data.error || 'Failed to fetch logs');
      }
    } catch (err) {
      setError('Failed to fetch compliance logs');
      console.error('Error fetching logs:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (userEmail) {
      fetchLogs();
    }
  }, [userEmail, projectRef, selectedCheckType, selectedStatus]);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  const getStatusColor = (status: 'pass' | 'fail') => {
    return status === 'pass' ? 'text-green-600' : 'text-red-600';
  };

  const getStatusBadge = (status: 'pass' | 'fail') => {
    const baseClasses = 'px-2 py-1 rounded-full text-xs font-medium';
    const statusClasses = status === 'pass' 
      ? 'bg-green-100 text-green-800' 
      : 'bg-red-100 text-red-800';
    
    return `${baseClasses} ${statusClasses}`;
  };

  const getCheckTypeIcon = (checkType: 'RLS' | 'MFA' | 'PITR') => {
    switch (checkType) {
      case 'RLS':
        return '🔒';
      case 'MFA':
        return '🔐';
      case 'PITR':
        return '💾';
      default:
        return '📋';
    }
  };

  const toggleLogDetails = (logId: number) => {
    setExpandedLogId(expandedLogId === logId ? null : logId);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <span className="ml-2">Loading compliance logs...</span>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <h2 className="text-xl font-semibold">Compliance Logs</h2>
        
        {/* Filters */}
        <div className="flex gap-2">
          <select
            value={selectedCheckType}
            onChange={(e) => setSelectedCheckType(e.target.value)}
            className="px-3 py-1 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">All Types</option>
            <option value="RLS">RLS</option>
            <option value="MFA">MFA</option>
            <option value="PITR">PITR</option>
          </select>
          
          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="px-3 py-1 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">All Status</option>
            <option value="pass">Pass</option>
            <option value="fail">Fail</option>
          </select>
          
          <button
            onClick={fetchLogs}
            className="px-3 py-1 bg-blue-600 text-white rounded-md text-sm hover:bg-blue-700 transition-colors"
          >
            Refresh
          </button>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-md p-4">
          <p className="text-red-800">{error}</p>
        </div>
      )}

      {logs.length === 0 && !loading && !error && (
        <div className="text-center py-8 text-gray-500">
          No compliance logs found for this user.
        </div>
      )}

      {logs.length > 0 && (
        <div className="space-y-3">
          {logs.map((log) => (
            <div key={log.id} className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors">
              <div className="flex items-center justify-between cursor-pointer" onClick={() => toggleLogDetails(log.id)}>
                <div className="flex items-center space-x-3">
                  <span className="text-lg">{getCheckTypeIcon(log.check_type)}</span>
                  <div>
                    <div className="flex items-center space-x-2">
                      <span className="font-medium">{log.check_type} Check</span>
                      <span className={getStatusBadge(log.status)}>
                        {log.status.toUpperCase()}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600">
                      Project: {log.project_ref} • {formatDate(log.created_at)}
                    </p>
                  </div>
                </div>
                
                <div className="flex items-center space-x-4">
                  {log.total_items > 0 && (
                    <div className="text-right text-sm">
                      <div className={getStatusColor(log.status)}>
                        {log.compliance_rate}% compliant
                      </div>
                      <div className="text-gray-500">
                        {log.compliant_items}/{log.total_items} items
                      </div>
                    </div>
                  )}
                  
                  <button className="text-gray-400 hover:text-gray-600">
                    {expandedLogId === log.id ? '▼' : '▶'}
                  </button>
                </div>
              </div>

              {expandedLogId === log.id && (
                <div className="mt-4 pt-4 border-t border-gray-200 space-y-3">
                  {log.note && (
                    <div>
                      <h4 className="font-medium text-sm text-gray-700">Note:</h4>
                      <p className="text-sm text-gray-600">{log.note}</p>
                    </div>
                  )}
                  
                  {log.error_message && (
                    <div>
                      <h4 className="font-medium text-sm text-red-700">Error:</h4>
                      <p className="text-sm text-red-600">{log.error_message}</p>
                    </div>
                  )}
                  
                  {log.setup_title && (
                    <div>
                      <h4 className="font-medium text-sm text-orange-700">Setup Required:</h4>
                      <p className="text-sm text-orange-600">{log.setup_title}</p>
                    </div>
                  )}
                  
                  <div>
                    <h4 className="font-medium text-sm text-gray-700 mb-2">Raw Response:</h4>
                    <details className="text-xs">
                      <summary className="cursor-pointer text-blue-600 hover:text-blue-800">
                        Show response data
                      </summary>
                      <pre className="mt-2 p-2 bg-gray-100 rounded text-xs overflow-x-auto max-h-40 overflow-y-auto">
                        {JSON.stringify(log.response_data, null, 2)}
                      </pre>
                    </details>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
} 