'use client';

import { 
  CreditCard, 
  Home, 
  FileText,
  AlertCircle
} from 'lucide-react';

export default function TenantDashboard() {
  return (
    <div className="p-6 md:p-8 max-w-7xl mx-auto space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Welcome Back, John</h1>
        <p className="text-gray-500 mt-1">Unit 204 • Sunrise Apartments</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-red-50 rounded-xl shadow-sm border border-red-100 p-6">
          <div className="flex items-center text-red-600 mb-4">
            <AlertCircle className="w-5 h-5 mr-2" />
            <h3 className="font-semibold">Action Required</h3>
          </div>
          <p className="text-sm text-red-700 mb-4">You have an outstanding balance for this month's rent.</p>
          <div className="flex justify-between items-end">
            <div>
              <p className="text-xs text-red-500 uppercase tracking-wide font-semibold">Amount Due</p>
              <p className="text-2xl font-bold text-red-700">₱ 15,500</p>
            </div>
            <button className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors">
              Pay Now
            </button>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 flex flex-col justify-between">
          <div>
            <div className="flex items-center text-gray-700 mb-4">
              <Home className="w-5 h-5 mr-2 text-blue-500" />
              <h3 className="font-semibold">Your Lease</h3>
            </div>
            <p className="text-sm text-gray-500">Expires on Dec 31, 2024</p>
          </div>
          <div className="mt-4">
            <button className="text-blue-600 text-sm font-medium hover:underline flex items-center">
              <FileText className="w-4 h-4 mr-1" />
              View Contract
            </button>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 flex flex-col justify-between">
          <div>
            <div className="flex items-center text-gray-700 mb-4">
              <CreditCard className="w-5 h-5 mr-2 text-green-500" />
              <h3 className="font-semibold">Advanced Payment</h3>
            </div>
            <p className="text-sm text-gray-500">Remaining Balance</p>
          </div>
          <div className="mt-4">
            <p className="text-2xl font-bold text-gray-900">₱ 0.00</p>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-6">Recent Bills</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="py-3 px-4 text-sm font-medium text-gray-500">Bill Type</th>
                <th className="py-3 px-4 text-sm font-medium text-gray-500">Due Date</th>
                <th className="py-3 px-4 text-sm font-medium text-gray-500">Amount</th>
                <th className="py-3 px-4 text-sm font-medium text-gray-500">Status</th>
              </tr>
            </thead>
            <tbody>
              <tr className="border-b border-gray-100 last:border-0">
                <td className="py-4 px-4 text-sm text-gray-900">Monthly Rent</td>
                <td className="py-4 px-4 text-sm text-gray-500">Aug 01, 2024</td>
                <td className="py-4 px-4 text-sm font-medium text-gray-900">₱ 15,500</td>
                <td className="py-4 px-4 text-sm">
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                    Unpaid
                  </span>
                </td>
              </tr>
              <tr className="border-b border-gray-100 last:border-0">
                <td className="py-4 px-4 text-sm text-gray-900">Monthly Rent</td>
                <td className="py-4 px-4 text-sm text-gray-500">Jul 01, 2024</td>
                <td className="py-4 px-4 text-sm font-medium text-gray-900">₱ 15,000</td>
                <td className="py-4 px-4 text-sm">
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                    Paid
                  </span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
