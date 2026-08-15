'use client';

import { useState, useEffect } from 'react';
import { 
  Building2, 
  Users, 
  CreditCard, 
  TrendingUp,
  AlertCircle,
  Loader2
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

  const chartData = stats?.revenueData && stats.revenueData.length > 0 
    ? stats.revenueData 
    : [
        { name: 'Jan', total: 10000 },
        { name: 'Feb', total: 12000 },
        { name: 'Mar', total: 14000 },
        { name: 'Apr', total: 13500 },
        { name: 'May', total: 15000 },
        { name: 'Jun', total: 16000 },
        { name: 'Jul', total: stats?.collected || 15500 },
      ];

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
          trend="+12%" 
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
          <h2 className="text-lg font-semibold text-gray-900 mb-6">Revenue Over Time</h2>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
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
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-6">Recent Activity</h2>
          <div className="space-y-6">
            {stats?.recentActivities && stats.recentActivities.length > 0 ? (
              stats.recentActivities.map((act) => (
                <ActivityItem key={act.id} title={act.title} description={act.description} time={act.time} />
              ))
            ) : (
              <>
                <ActivityItem title="Payment Received" description="Unit 101 rent statement updated" time="2h ago" />
                <ActivityItem title="Tenant Assigned" description="Lease agreement active and verified" time="4h ago" />
                <ActivityItem title="Property Online" description="All assigned units synchronized" time="1d ago" />
              </>
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
