'use client';

import { useState, useEffect } from 'react';
import { 
  Building2, 
  Users, 
  CreditCard, 
  TrendingUp,
  AlertCircle,
  Loader2,
  Clock
} from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';

interface OverviewStats {
  buildingsCount: number;
  unitsCount: number;
  tenantsCount: number;
  collected: number;
  overdueCount: number;
  revenueData: Array<{ name: string; total: number }>;
  recentActivities: Array<{ id: number; title: string; description: string; time: string }>;
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<OverviewStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchOverview() {
      try {
        const res = await fetch('/api/admin/overview');
        if (res.ok) {
          const data = await res.json();
          setStats(data);
        }
      } catch (err) {
        console.error('Failed to load overview metrics:', err);
      } finally {
        setLoading(false);
      }
    }
    fetchOverview();
  }, []);

  const revenueData = stats?.revenueData || [];
  const hasRevenueData = revenueData.some((item) => item.total > 0);

  return (
    <div className="p-6 md:p-8 max-w-7xl mx-auto space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Overview</h1>
        <p className="text-gray-500 mt-1">Here's what's happening across your properties today.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard 
          title="Total Properties" 
          value={loading ? '-' : String(stats?.buildingsCount ?? 0)} 
          icon={Building2} 
          loading={loading}
        />
        <StatCard 
          title="Total Tenants" 
          value={loading ? '-' : String(stats?.tenantsCount ?? 0)} 
          icon={Users} 
          loading={loading}
        />
        <StatCard 
          title="Collected This Month" 
          value={loading ? '-' : `₱ ${Number(stats?.collected || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}`} 
          icon={CreditCard} 
          trend={stats?.collected ? "+12%" : undefined} 
          loading={loading}
        />
        <StatCard 
          title="Overdue Billings" 
          value={loading ? '-' : String(stats?.overdueCount ?? 0)} 
          icon={AlertCircle} 
          alert={Number(stats?.overdueCount || 0) > 0} 
          loading={loading}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-semibold text-gray-900">Revenue Over Time</h2>
            {hasRevenueData && (
              <span className="text-xs font-semibold text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200">
                Live Data
              </span>
            )}
          </div>
          <div className="h-72">
            {loading ? (
              <div className="h-full flex items-center justify-center text-gray-400">
                <Loader2 className="w-6 h-6 animate-spin mr-2" />
                <span className="text-sm">Loading revenue data...</span>
              </div>
            ) : hasRevenueData ? (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={revenueData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorTotal" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.1}/>
                      <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <XAxis dataKey="name" stroke="#888888" fontSize={12} tickLine={false} axisLine={false} />
                  <YAxis stroke="#888888" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(value) => `₱${value}`} />
                  <Tooltip formatter={(value: any) => [`₱ ${Number(value).toLocaleString()}`, 'Revenue']} />
                  <Area type="monotone" dataKey="total" stroke="#3b82f6" fillOpacity={1} fill="url(#colorTotal)" />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-center p-6 border border-dashed border-gray-200 rounded-xl bg-gray-50/50">
                <div className="w-12 h-12 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center mb-3">
                  <TrendingUp className="w-6 h-6" />
                </div>
                <h3 className="text-sm font-semibold text-gray-800">No Revenue Recorded Yet</h3>
                <p className="text-xs text-gray-500 max-w-sm mt-1">
                  Monthly revenue trends will automatically be graphed here as rental payments and utility collections are received.
                </p>
              </div>
            )}
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-6">Recent Activity</h2>
          <div className="space-y-6">
            {loading ? (
              <div className="py-12 flex items-center justify-center text-gray-400">
                <Loader2 className="w-5 h-5 animate-spin mr-2" />
                <span className="text-sm">Loading activity...</span>
              </div>
            ) : stats?.recentActivities && stats.recentActivities.length > 0 ? (
              stats.recentActivities.map((act) => (
                <ActivityItem key={act.id} title={act.title} description={act.description} time={act.time} />
              ))
            ) : (
              <div className="py-12 flex flex-col items-center justify-center text-center p-4 border border-dashed border-gray-200 rounded-xl bg-gray-50/50">
                <div className="w-10 h-10 rounded-full bg-gray-100 text-gray-400 flex items-center justify-center mb-2.5">
                  <Clock className="w-5 h-5" />
                </div>
                <h4 className="text-sm font-semibold text-gray-700">No Recent Activity</h4>
                <p className="text-xs text-gray-400 mt-1 max-w-xs">
                  Tenant payments, billing statements, and maintenance tickets will be logged here in real-time.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function StatCard({ title, value, icon: Icon, trend, alert, loading }: any) {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 flex flex-col">
      <div className="flex justify-between items-start mb-4">
        <div className={`p-3 rounded-lg ${alert ? 'bg-red-50 text-red-600' : 'bg-blue-50 text-blue-600'}`}>
          <Icon size={24} />
        </div>
        {trend && (
          <span className="inline-flex items-center text-sm font-medium text-green-600 bg-green-50 px-2 py-1 rounded-full">
            <TrendingUp size={16} className="mr-1" />
            {trend}
          </span>
        )}
      </div>
      <div>
        <h3 className="text-gray-500 font-medium text-sm">{title}</h3>
        {loading ? (
          <div className="flex items-center mt-2 text-gray-400">
            <Loader2 className="w-5 h-5 animate-spin mr-2" />
            <span className="text-sm">Loading...</span>
          </div>
        ) : (
          <p className="text-2xl font-bold text-gray-900 mt-1">{value}</p>
        )}
      </div>
    </div>
  );
}

function ActivityItem({ title, description, time }: any) {
  return (
    <div className="flex items-start">
      <div className="w-2 h-2 mt-2 bg-blue-600 rounded-full mr-3 flex-shrink-0" />
      <div>
        <p className="text-sm font-medium text-gray-900">{title}</p>
        <p className="text-sm text-gray-500 mt-0.5">{description}</p>
        <p className="text-xs text-gray-400 mt-1">{time}</p>
      </div>
    </div>
  );
}
