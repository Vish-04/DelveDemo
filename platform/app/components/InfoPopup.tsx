import { AlertCircle, X, Copy } from 'lucide-react';
import { useState } from 'react';

export default function InfoPopup({ setShowInfoPopup }: { setShowInfoPopup: (show: boolean) => void }) {
  const [copiedFunction, setCopiedFunction] = useState<string | null>(null);

  const copyToClipboard = async (text: string, functionName: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedFunction(functionName);
      setTimeout(() => setCopiedFunction(null), 2000);
    } catch (err) {
      console.error('Failed to copy: ', err);
    }
  };

  const mfaFunction = `CREATE OR REPLACE FUNCTION get_user_mfa_status(target_user_id uuid)
RETURNS TABLE(
user_id uuid,
mfa_enabled boolean,
factor_count integer,
factors json
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
RETURN QUERY
SELECT 
target_user_id as user_id,
CASE 
    WHEN COUNT(af.id) > 0 THEN true
    ELSE false
END as mfa_enabled,
COUNT(af.id)::integer as factor_count,
COALESCE(
    json_agg(
    json_build_object(
        'id', af.id,
        'friendly_name', af.friendly_name,
        'factor_type', af.factor_type,
        'status', af.status,
        'created_at', af.created_at,
        'updated_at', af.updated_at
    )
    ) FILTER (WHERE af.id IS NOT NULL),
    '[]'::json
) as factors
FROM auth.mfa_factors af
WHERE af.user_id = target_user_id 
AND af.status = 'verified'
GROUP BY target_user_id;
END;
$$;`;

  const rlsFunction = `CREATE OR REPLACE FUNCTION check_table_rls_status()
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
$$;`;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-6xl w-full max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-2xl font-bold text-gray-900">Setup Guide & Instructions</h2>
          <button
            onClick={() => setShowInfoPopup(false)}
            className="text-gray-400 hover:text-gray-600 p-1"
          >
            <X className="h-6 w-6" />
          </button>
        </div>
        
        <div className="p-6 space-y-8">
          {/* Token Access Instructions */}
          <div>
            <h3 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
              <div className="w-8 h-8 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-sm font-bold mr-3">1</div>
              Accessing Your Supabase Tokens
            </h3>
            
            <div className="space-y-6">
              <div className="bg-gray-50 rounded-lg p-4">
                <h4 className="font-medium text-gray-900 mb-2">Project Reference</h4>
                <ul className="text-sm text-gray-700 space-y-1 ml-4 list-disc">
                  <li>Go to your <a href="https://supabase.com/dashboard" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">Supabase Dashboard</a></li>
                  <li>Select your project</li>
                  <li>Copy the Project Reference from your project URL</li>
                  <li>Example: If your URL is <code className="bg-gray-100 px-1 rounded">https://abcdefghij.supabase.co</code>, your Project Reference is <code className="bg-gray-100 px-1 rounded">abcdefghij</code></li>
                </ul>
              </div>

              <div className="bg-gray-50 rounded-lg p-4">
                <h4 className="font-medium text-gray-900 mb-2">Service Role Key</h4>
                <ul className="text-sm text-gray-700 space-y-1 ml-4 list-disc">
                  <li>In your Supabase project dashboard, go to <strong>Settings</strong> → <strong>API</strong></li>
                  <li>Under "Project API keys", find the <strong>service_role</strong> key</li>
                  <li>Click the eye icon to reveal the key and copy it</li>
                  <li className="text-red-600 font-medium">⚠️ Keep this key secure - it has full access to your database</li>
                </ul>
              </div>

              <div className="bg-gray-50 rounded-lg p-4">
                <h4 className="font-medium text-gray-900 mb-2">Personal Access Token (Optional - for PITR checking)</h4>
                <ul className="text-sm text-gray-700 space-y-1 ml-4 list-disc">
                  <li>Go to your <a href="https://supabase.com/dashboard/account/tokens" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">Supabase Account Settings</a></li>
                  <li>Click on <strong>Access Tokens</strong> in the sidebar</li>
                  <li>Click <strong>Generate new token</strong></li>
                  <li>Give it a name (e.g., "SCC Compliance Checker")</li>
                  <li>Copy the generated token immediately (it won't be shown again)</li>
                </ul>
              </div>
            </div>
          </div>

          {/* SQL Setup Instructions */}
          <div>
            <h3 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
              <div className="w-8 h-8 bg-green-100 text-green-600 rounded-full flex items-center justify-center text-sm font-bold mr-3">2</div>
              Setting Up SQL Functions
            </h3>
            
            <div className="space-y-6">
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <div className="flex items-start">
                  <AlertCircle className="h-5 w-5 text-yellow-600 mr-2 flex-shrink-0 mt-0.5" />
                  <div className="text-sm text-yellow-800">
                    <strong>Important:</strong> The MFA and RLS compliance checks require custom SQL functions to be created in your database. 
                    Copy and run the SQL functions below in your Supabase SQL Editor.
                  </div>
                </div>
              </div>

              <div className="bg-gray-50 rounded-lg p-4">
                <h4 className="font-medium text-gray-900 mb-2">How to Run SQL Scripts in Supabase</h4>
                <ol className="text-sm text-gray-700 space-y-2 ml-4 list-decimal">
                  <li>In your Supabase project dashboard, go to <strong>SQL Editor</strong></li>
                  <li>Click <strong>New Query</strong> to create a new SQL script</li>
                  <li>Copy and paste the SQL function from below into the editor</li>
                  <li>Click <strong>Run</strong> to execute the script</li>
                  <li>You should see a success message confirming the function was created</li>
                  <li>Repeat for both functions (MFA and RLS)</li>
                  <li>Return to SCC and run your compliance checks</li>
                </ol>
              </div>

              {/* MFA Function */}
              <div className="bg-white border border-gray-200 rounded-lg p-4">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="font-medium text-gray-900">MFA Function</h4>
                  <button
                    onClick={() => copyToClipboard(mfaFunction, 'mfa')}
                    className="flex items-center space-x-2 px-3 py-1 bg-blue-50 text-blue-600 rounded-md hover:bg-blue-100 transition-colors"
                  >
                    <Copy className="h-4 w-4" />
                    <span className="text-sm">
                      {copiedFunction === 'mfa' ? 'Copied!' : 'Copy'}
                    </span>
                  </button>
                </div>
                <div className="bg-gray-900 text-gray-100 rounded-md p-4 overflow-x-auto">
                  <pre className="text-sm whitespace-pre-wrap">{mfaFunction}</pre>
                </div>
                <p className="text-xs text-gray-600 mt-2">
                  This function checks MFA status for users without exposing sensitive authentication data.
                </p>
              </div>

              {/* RLS Function */}
              <div className="bg-white border border-gray-200 rounded-lg p-4">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="font-medium text-gray-900">RLS Function</h4>
                  <button
                    onClick={() => copyToClipboard(rlsFunction, 'rls')}
                    className="flex items-center space-x-2 px-3 py-1 bg-blue-50 text-blue-600 rounded-md hover:bg-blue-100 transition-colors"
                  >
                    <Copy className="h-4 w-4" />
                    <span className="text-sm">
                      {copiedFunction === 'rls' ? 'Copied!' : 'Copy'}
                    </span>
                  </button>
                </div>
                <div className="bg-gray-900 text-gray-100 rounded-md p-4 overflow-x-auto">
                  <pre className="text-sm whitespace-pre-wrap">{rlsFunction}</pre>
                </div>
                <p className="text-xs text-gray-600 mt-2">
                  This function analyzes your database tables to check Row Level Security status.
                </p>
              </div>

              <div className="bg-blue-50 rounded-lg p-4">
                <h4 className="font-medium text-blue-900 mb-2">What These Functions Do</h4>
                <ul className="text-sm text-blue-800 space-y-1 ml-4 list-disc">
                  <li><strong>MFA Function:</strong> Safely checks which users have MFA enabled without exposing sensitive data</li>
                  <li><strong>RLS Function:</strong> Analyzes your database tables to determine which have Row Level Security enabled</li>
                  <li>Both functions are read-only and don't modify your data or expose sensitive information</li>
                  <li>Functions use <code>SECURITY DEFINER</code> to run with elevated privileges safely</li>
                </ul>
              </div>

              <div className="bg-gray-50 rounded-lg p-4">
                <h4 className="font-medium text-gray-900 mb-2">Troubleshooting</h4>
                <ul className="text-sm text-gray-700 space-y-1 ml-4 list-disc">
                  <li>If you get permission errors, ensure you're using the <strong>service_role</strong> key, not the public anon key</li>
                  <li>Make sure your Project Reference is correct (no spaces or extra characters)</li>
                  <li>For PITR checks, ensure your Personal Access Token has the necessary permissions</li>
                  <li>If SQL scripts fail, check that you have sufficient database permissions</li>
                  <li>Functions should be created in your database schema - run them in the SQL Editor</li>
                </ul>
              </div>
            </div>
          </div>

          {/* Quick Start */}
          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg p-6 border border-blue-200">
            <h3 className="text-lg font-semibold text-blue-900 mb-3">Quick Start Checklist</h3>
            <ul className="text-sm text-blue-800 space-y-2">
              <li className="flex items-center">
                <div className="w-4 h-4 border-2 border-blue-400 rounded mr-3"></div>
                Get your Project Reference from your Supabase project URL
              </li>
              <li className="flex items-center">
                <div className="w-4 h-4 border-2 border-blue-400 rounded mr-3"></div>
                Copy your Service Role Key from Settings → API
              </li>
              <li className="flex items-center">
                <div className="w-4 h-4 border-2 border-blue-400 rounded mr-3"></div>
                Run the MFA and RLS SQL functions in your SQL Editor
              </li>
              <li className="flex items-center">
                <div className="w-4 h-4 border-2 border-blue-400 rounded mr-3"></div>
                Generate a Personal Access Token for PITR checking
              </li>
              <li className="flex items-center">
                <div className="w-4 h-4 border-2 border-blue-400 rounded mr-3"></div>
                Run compliance checks
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}