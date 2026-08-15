'use client';

import { Bell, Plus } from 'lucide-react';

export default function AnnouncementsPage() {
  return (
    <div className="p-6 md:p-8 max-w-7xl mx-auto space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Announcements</h1>
          <p className="text-gray-500 mt-1">Send announcements to your tenants.</p>
        </div>
        <button className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center">
          <Plus className="w-4 h-4 mr-2" />
          New Announcement
        </button>
      </div>

      <div className="space-y-4">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex justify-between items-start mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Water Interruption Notice</h3>
            <span className="text-sm text-gray-500">Aug 10, 2024</span>
          </div>
          <p className="text-gray-600">
            Please be advised that there will be a water interruption on August 15, 2024 from 10:00 AM to 2:00 PM due to scheduled maintenance by the local water district.
          </p>
          <div className="mt-4 flex items-center text-sm text-gray-500">
            <Bell className="w-4 h-4 mr-1" />
            Sent to: Sunrise Apartments
          </div>
        </div>
      </div>
    </div>
  );
}
