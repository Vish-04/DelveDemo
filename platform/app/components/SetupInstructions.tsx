'use client';

import { Copy, X, AlertTriangle } from 'lucide-react';

interface SetupInstructionsProps {
  instructions: {
    title: string;
    description: string;
    sql: string;
    steps: string[];
  };
  onClose: () => void;
}

export default function SetupInstructions({ instructions, onClose }: SetupInstructionsProps) {
  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    alert('SQL function copied to clipboard!');
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-auto">
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold text-gray-900">{instructions.title}</h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600"
            >
              <X className="h-6 w-6" />
            </button>
          </div>
          <p className="mt-2 text-gray-600">{instructions.description}</p>
        </div>

        <div className="p-6">
          <div className="mb-6">
            <h3 className="text-lg font-medium text-gray-900 mb-3">Steps to Setup:</h3>
            <ol className="list-decimal list-inside space-y-2 text-gray-700">
              {instructions.steps.map((step, index) => (
                <li key={index}>{step}</li>
              ))}
            </ol>
          </div>

          <div className="mb-6">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-lg font-medium text-gray-900">SQL Function to Create:</h3>
              <button
                onClick={() => copyToClipboard(instructions.sql)}
                className="flex items-center space-x-2 px-3 py-1 bg-blue-100 text-blue-700 rounded-md hover:bg-blue-200 transition-colors text-sm"
              >
                <Copy className="h-4 w-4" />
                <span>Copy SQL</span>
              </button>
            </div>
            <pre className="bg-gray-100 p-4 rounded-lg overflow-x-auto text-sm">
              <code>{instructions.sql.trim()}</code>
            </pre>
          </div>

          <div className="bg-yellow-50 border border-yellow-200 rounded-md p-4">
            <div className="flex">
              <AlertTriangle className="h-5 w-5 text-yellow-400 mr-2 flex-shrink-0 mt-0.5" />
              <div className="text-sm text-yellow-800">
                <p><strong>Important:</strong> You only need to create this function once in your Supabase database. After running the SQL, the RLS compliance checking will work for all future scans.</p>
              </div>
            </div>
          </div>
        </div>

        <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
          >
            Got it!
          </button>
        </div>
      </div>
    </div>
  );
} 