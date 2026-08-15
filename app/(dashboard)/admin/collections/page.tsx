'use client';

import { useState } from 'react';
import { Search, Plus, Download, CheckCircle, Clock, AlertCircle } from 'lucide-react';

export default function CollectionsPage() {
  const [activeTab, setActiveTab] = useState<'for_collection' | 'collected' | 'advanced'>('for_collection');

  return (
    <div className="p-6 md:p-8 max-w-7xl mx-auto space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Collections</h1>
          <p className="text-gray-500 mt-1">Manage billings, payments, and receipts.</p>
        </div>
        <a href="/admin/billings" className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center">
          <Plus className="w-4 h-4 mr-2" />
          Create Draft Bill
        </a>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="border-b border-gray-200">
          <nav className="flex overflow-x-auto" aria-label="Tabs">
            <button
              onClick={() => setActiveTab('for_collection')}
              className={`whitespace-nowrap py-4 px-6 border-b-2 font-medium text-sm ${
                activeTab === 'for_collection'
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              For Collection
            </button>
            <button
              onClick={() => setActiveTab('collected')}
              className={`whitespace-nowrap py-4 px-6 border-b-2 font-medium text-sm ${
                activeTab === 'collected'
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Collected / Paid
            </button>
            <button
              onClick={() => setActiveTab('advanced')}
              className={`whitespace-nowrap py-4 px-6 border-b-2 font-medium text-sm ${
                activeTab === 'advanced'
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Advanced Payments
            </button>
          </nav>
        </div>

        <div className="p-4 border-b border-gray-200 flex justify-between items-center bg-gray-50/50">
          <div className="relative max-w-sm w-full">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="h-4 w-4 text-gray-400" />
            </div>
            <input
              type="text"
              className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
              placeholder="Search by unit or tenant..."
            />
          </div>
          <button className="text-gray-600 hover:text-gray-900 flex items-center text-sm font-medium">
            <Download className="w-4 h-4 mr-2" />
            Export CSV
          </button>
        </div>

        <div className="overflow-x-auto">
          {activeTab === 'for_collection' && (
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Unit / Tenant</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Amount Due</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Due Date</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                  <th scope="col" className="relative px-6 py-3"><span className="sr-only">Actions</span></th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                <tr>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">Unit 204</div>
                    <div className="text-sm text-gray-500">John Doe</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">Monthly Rent</td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">₱ 15,500</div>
                    <div className="text-xs text-red-500">+₱500 Late Fee</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">Aug 01, 2024</td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                      <AlertCircle className="w-3 h-3 mr-1" />
                      Overdue
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <button className="text-blue-600 hover:text-blue-900 bg-blue-50 px-3 py-1 rounded-md">Receive Cash</button>
                  </td>
                </tr>
                <tr>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">Unit 102</div>
                    <div className="text-sm text-gray-500">Jane Smith</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">Utilities</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">₱ 2,100</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">Aug 15, 2024</td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                      <Clock className="w-3 h-3 mr-1" />
                      Pending
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <button className="text-blue-600 hover:text-blue-900 bg-blue-50 px-3 py-1 rounded-md">Receive Cash</button>
                  </td>
                </tr>
              </tbody>
            </table>
          )}
          
          {activeTab === 'collected' && (
             <div className="p-8 text-center text-gray-500">
               <CheckCircle className="w-12 h-12 text-gray-300 mx-auto mb-3" />
               <p>No recently collected payments found.</p>
             </div>
          )}

          {activeTab === 'advanced' && (
             <div className="p-8 text-center text-gray-500">
               <p>No advanced payments active.</p>
             </div>
          )}
        </div>
      </div>
    </div>
  );
}
