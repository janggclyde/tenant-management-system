'use client';

import { Plus, Clock } from 'lucide-react';

export default function MaintenancePage() {
  return (
    <div className="p-6 md:p-8 max-w-5xl mx-auto space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Maintenance Requests</h1>
          <p className="text-gray-500 mt-1">Submit and track maintenance tickets.</p>
        </div>
        <button className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center">
          <Plus className="w-4 h-4 mr-2" />
          New Request
        </button>
      </div>

      <div className="space-y-4">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 flex flex-col md:flex-row justify-between items-start md:items-center">
          <div>
            <div className="flex items-center mb-2">
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800 mr-3">
                In Progress
              </span>
              <span className="text-sm text-gray-500 flex items-center"><Clock className="w-4 h-4 mr-1"/> Submitted 2 days ago</span>
            </div>
            <h3 className="text-lg font-semibold text-gray-900">Leaking Faucet in Kitchen</h3>
            <p className="text-gray-600 mt-1">The kitchen sink faucet is constantly dripping water.</p>
          </div>
          <div className="mt-4 md:mt-0 text-sm text-gray-500">
            Ticket #1024
          </div>
        </div>
      </div>
    </div>
  );
}
