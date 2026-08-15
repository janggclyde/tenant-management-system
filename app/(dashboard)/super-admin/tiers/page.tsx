'use client';

import { FileText, Plus, Edit2 } from 'lucide-react';

export default function TiersPage() {
  return (
    <div className="p-6 md:p-8 max-w-7xl mx-auto space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Subscription Tiers</h1>
          <p className="text-gray-500 mt-1">Configure pricing and limits for SaaS plans.</p>
        </div>
        <button className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center">
          <Plus className="w-4 h-4 mr-2" />
          Create Tier
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 flex flex-col justify-between">
          <div>
            <div className="flex justify-between items-start mb-4">
              <h3 className="text-xl font-bold text-gray-900">Starter</h3>
              <button className="text-gray-400 hover:text-blue-600"><Edit2 size={16} /></button>
            </div>
            <p className="text-3xl font-bold text-gray-900 mb-6">₱ 0<span className="text-sm font-normal text-gray-500">/mo</span></p>
            <ul className="space-y-3 text-sm text-gray-600">
              <li className="flex items-center">✓ 1 Building limit</li>
              <li className="flex items-center">✓ Basic Reports</li>
              <li className="flex items-center opacity-50">✗ Email Notifications</li>
            </ul>
          </div>
        </div>
        
        <div className="bg-blue-50 rounded-xl shadow-sm border border-blue-200 p-6 flex flex-col justify-between relative">
          <span className="absolute top-0 right-0 bg-blue-600 text-white text-xs px-2 py-1 rounded-bl-lg rounded-tr-xl font-medium">Popular</span>
          <div>
            <div className="flex justify-between items-start mb-4">
              <h3 className="text-xl font-bold text-gray-900">Pro</h3>
              <button className="text-gray-400 hover:text-blue-600"><Edit2 size={16} /></button>
            </div>
            <p className="text-3xl font-bold text-gray-900 mb-6">₱ 2,500<span className="text-sm font-normal text-gray-500">/mo</span></p>
            <ul className="space-y-3 text-sm text-gray-600">
              <li className="flex items-center">✓ Up to 10 Buildings</li>
              <li className="flex items-center">✓ Advanced Reports</li>
              <li className="flex items-center">✓ Email Notifications</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
