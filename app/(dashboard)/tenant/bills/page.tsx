'use client';

import { Download, CreditCard } from 'lucide-react';

export default function TenantBillsPage() {
  return (
    <div className="p-6 md:p-8 max-w-5xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Bills & Payments</h1>
        <p className="text-gray-500 mt-1">View your billing history and make payments.</p>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Description</th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Due Date</th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
              <th scope="col" className="relative px-6 py-3"><span className="sr-only">Actions</span></th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            <tr>
              <td className="px-6 py-4 whitespace-nowrap">
                <div className="text-sm font-medium text-gray-900">August Rent</div>
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">Aug 01, 2024</td>
              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">₱ 15,500</td>
              <td className="px-6 py-4 whitespace-nowrap">
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                  Unpaid
                </span>
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                <button className="text-blue-600 hover:text-blue-900 flex items-center justify-end w-full">
                  <CreditCard className="w-4 h-4 mr-1" />
                  Pay
                </button>
              </td>
            </tr>
            <tr>
              <td className="px-6 py-4 whitespace-nowrap">
                <div className="text-sm font-medium text-gray-900">July Rent</div>
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">Jul 01, 2024</td>
              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">₱ 15,000</td>
              <td className="px-6 py-4 whitespace-nowrap">
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                  Paid
                </span>
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                <button className="text-gray-600 hover:text-gray-900 flex items-center justify-end w-full">
                  <Download className="w-4 h-4 mr-1" />
                  Receipt
                </button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}
