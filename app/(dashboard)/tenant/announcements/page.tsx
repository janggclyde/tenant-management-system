'use client';

import { useState, useEffect } from 'react';
import { 
  Bell, 
  Building2, 
  Clock, 
  CheckCheck, 
  CreditCard, 
  Wrench, 
  Info, 
  Loader2, 
  FileText,
  AlertCircle
} from 'lucide-react';

interface AnnouncementItem {
  id: number;
  title: string;
  content: string;
  building_id?: number | null;
  building_name?: string;
  created_at: string;
}

interface NotificationItem {
  id: number;
  type: string;
  message: string;
  is_read: boolean;
  created_at: string;
}

export default function TenantAnnouncementsPage() {
  const [activeTab, setActiveTab] = useState<'announcements' | 'notifications'>('announcements');
  const [announcements, setAnnouncements] = useState<AnnouncementItem[]>([]);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [annRes, notifRes] = await Promise.all([
        fetch('/api/tenant/announcements'),
        fetch('/api/tenant/notifications')
      ]);

      const [annJson, notifJson] = await Promise.all([
        annRes.json(),
        notifRes.json()
      ]);

      if (annJson.success) {
        setAnnouncements(annJson.announcements || []);
      }
      if (notifJson.success) {
        setNotifications(notifJson.notifications || []);
        setUnreadCount(notifJson.unreadCount || 0);
      }
    } catch (err) {
      console.error('Failed to load notices data', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const markAllAsRead = async () => {
    setActionLoading(true);
    try {
      const res = await fetch('/api/tenant/notifications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mark_all: true })
      });
      const data = await res.json();
      if (data.success) {
        setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
        setUnreadCount(0);
      }
    } catch (err) {
      console.error('Failed to mark all as read', err);
    } finally {
      setActionLoading(false);
    }
  };

  const markOneAsRead = async (id: number) => {
    try {
      const res = await fetch('/api/tenant/notifications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ notification_id: id })
      });
      const data = await res.json();
      if (data.success) {
        setNotifications(prev => prev.map(n => n.id === id ? { ...n, is_read: true } : n));
        setUnreadCount(prev => Math.max(0, prev - 1));
      }
    } catch (err) {}
  };

  const getNotifIcon = (type: string) => {
    switch (type) {
      case 'new_bill':
      case 'late_fee':
        return <CreditCard className="w-4 h-4 text-amber-600" />;
      case 'payment_received':
        return <CheckCheck className="w-4 h-4 text-emerald-600" />;
      case 'maintenance_update':
        return <Wrench className="w-4 h-4 text-blue-600" />;
      default:
        return <Info className="w-4 h-4 text-purple-600" />;
    }
  };

  return (
    <div className="p-4 sm:p-6 md:p-8 max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-black text-gray-900 tracking-tight">Announcements & Notices</h1>
        <p className="text-xs sm:text-sm text-gray-500 mt-1 font-medium">
          Official property advisories, maintenance alerts, and your personal account notifications.
        </p>
      </div>

      {/* Touch-Friendly Tabs */}
      <div className="flex items-center justify-between border-b border-gray-200 pb-2">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setActiveTab('announcements')}
            className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all ${
              activeTab === 'announcements'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'bg-white text-gray-600 hover:bg-gray-100 border border-gray-200'
            }`}
          >
            Building Notices ({announcements.length})
          </button>
          <button
            onClick={() => setActiveTab('notifications')}
            className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all relative ${
              activeTab === 'notifications'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'bg-white text-gray-600 hover:bg-gray-100 border border-gray-200'
            }`}
          >
            <span>My Alerts ({notifications.length})</span>
            {unreadCount > 0 && (
              <span className="ml-1.5 bg-red-500 text-white text-[10px] font-extrabold px-1.5 py-0.2 rounded-full">
                {unreadCount}
              </span>
            )}
          </button>
        </div>

        {activeTab === 'notifications' && unreadCount > 0 && (
          <button
            onClick={markAllAsRead}
            disabled={actionLoading}
            className="text-xs font-semibold text-blue-600 hover:text-blue-700 flex items-center gap-1 active:scale-95 transition-all"
          >
            <CheckCheck className="w-3.5 h-3.5" />
            <span>Mark all read</span>
          </button>
        )}
      </div>

      {/* Content Area */}
      {loading ? (
        <div className="bg-white rounded-3xl p-16 text-center text-gray-400 flex flex-col items-center justify-center border border-gray-200">
          <Loader2 className="w-8 h-8 animate-spin text-blue-600 mb-2" />
          <span className="text-sm font-medium">Loading updates...</span>
        </div>
      ) : activeTab === 'announcements' ? (
        /* Announcements List */
        announcements.length > 0 ? (
          <div className="space-y-4">
            {announcements.map((a) => (
              <div 
                key={a.id} 
                className="bg-white rounded-3xl p-5 sm:p-6 border border-gray-200 shadow-xs space-y-3"
              >
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-1.5">
                  <span className="inline-flex items-center gap-1 text-[11px] font-bold text-blue-700 bg-blue-50 px-2.5 py-0.5 rounded-full border border-blue-100">
                    <Building2 className="w-3 h-3" />
                    {a.building_name || 'All Residents'}
                  </span>
                  <span className="text-[11px] text-gray-400 flex items-center gap-1 font-medium">
                    <Clock className="w-3.5 h-3.5" />
                    {new Date(a.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                  </span>
                </div>

                <h3 className="text-base sm:text-lg font-black text-gray-900 leading-tight">
                  {a.title}
                </h3>

                <p className="text-xs sm:text-sm text-gray-600 leading-relaxed whitespace-pre-line">
                  {a.content}
                </p>
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-white rounded-3xl p-16 text-center border border-dashed border-gray-200 space-y-2">
            <Bell className="w-12 h-12 text-gray-300 mx-auto" />
            <h3 className="text-base font-bold text-gray-800">No Announcements</h3>
            <p className="text-xs text-gray-500 max-w-sm mx-auto">
              There are no active notices or advisories from property management at this time.
            </p>
          </div>
        )
      ) : (
        /* Notifications List */
        notifications.length > 0 ? (
          <div className="space-y-3">
            {notifications.map((n) => (
              <div
                key={n.id}
                onClick={() => !n.is_read && markOneAsRead(n.id)}
                className={`bg-white rounded-2xl p-4 border transition-all flex items-start gap-3.5 cursor-pointer ${
                  !n.is_read 
                    ? 'border-blue-300 bg-blue-50/20 shadow-xs' 
                    : 'border-gray-200 opacity-90'
                }`}
              >
                <div className="w-9 h-9 rounded-xl bg-gray-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                  {getNotifIcon(n.type)}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <p className={`text-xs sm:text-sm text-gray-900 leading-snug ${!n.is_read ? 'font-bold' : 'font-medium'}`}>
                      {n.message}
                    </p>
                    {!n.is_read && (
                      <span className="w-2 h-2 bg-blue-600 rounded-full flex-shrink-0" />
                    )}
                  </div>
                  <span className="text-[10px] text-gray-400 mt-1 block">
                    {new Date(n.created_at).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-white rounded-3xl p-16 text-center border border-dashed border-gray-200 space-y-2">
            <CheckCheck className="w-12 h-12 text-gray-300 mx-auto" />
            <h3 className="text-base font-bold text-gray-800">No Alerts Recorded</h3>
            <p className="text-xs text-gray-500 max-w-sm mx-auto">
              You do not have any personal account alerts at this time.
            </p>
          </div>
        )
      )}
    </div>
  );
}
