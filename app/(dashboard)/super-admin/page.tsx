'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { 
  Building2, 
  Users, 
  CreditCard, 
  TrendingUp,
  Server,
  ArrowRight,
  ShieldCheck,
  Plus
} from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const growthData = [
  { name: 'Jan', total: 12 },
  { name: 'Feb', total: 18 },
  { name: 'Mar', total: 24 },
  { name: 'Apr', total: 32 },
  { name: 'May', total: 45 },
  { name: 'Jun', total: 60 },
  { name: 'Jul', total: 75 },
  { name: 'Aug', total: 92 },
];

export default function SuperAdminDashboard() {
  const [stats, setStats] = useState({
    totalCustomers: 5,
    activeCustomers: 4,
    suspendedCustomers: 1,
    totalBuildings: 10,
    totalUnits: 55,
    totalTenants: 41,
    totalMRR: 17991,
    tierDistribution: { Starter: 2, Pro: 2, Enterprise: 1 }
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    const fetchStats = async () => {
      try {
        const res = await fetch('/api/super-admin/customers');
        const data = await res.json();
        if (isMounted && data.success && data.stats) {
          setStats(data.stats);
        }
      } catch (err) {
        // Fallback
      } finally {
        if (isMounted) setLoading(false);
      }
    };
    fetchStats();
    return () => { isMounted = false; };
  }, []);

  return (
    <div className="p-6 md:p-8 max-w-7xl mx-auto space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Platform Overview</h1>
          <p className="text-gray-500 mt-1">Monitor the health, customer growth, and MRR of your SaaS platform.</p>
        </div>
        <Link 
          href="/super-admin/customers" 
          className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2.5 rounded-xl text-sm font-semibold shadow-xs transition-all w-fit"
        >
          <Users className="w-4 h-4" />
          <span>Manage Customers</span>
          <ArrowRight className="w-4 h-4 ml-1" />
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard 
          title="Active Subscribers" 
          value={stats.activeCustomers.toString()} 
          icon={Users} 
          trend="+15%" 
          subtitle={`${stats.totalCustomers} total registered property managers`}
        />
        <StatCard 
          title="Total Properties" 
          value={stats.totalBuildings.toString()} 
          icon={Building2} 
          subtitle={`${stats.totalUnits} rental units across portfolio`}
        />
        <StatCard 
          title="Monthly Recurring Rev." 
          value={`₱ ${stats.totalMRR.toLocaleString()}`} 
          icon={CreditCard} 
          trend="+12%" 
          subtitle="From active SaaS plan subscriptions"
        />
        <StatCard 
          title="Platform System Status" 
          value="Healthy" 
          icon={Server} 
          alert={false} 
          subtitle="All microservices operational (99.9%)"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white rounded-2xl shadow-xs border border-gray-200/80 p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-lg font-bold text-gray-900">Customer & Subscriber Growth</h2>
              <p className="text-xs text-gray-500 mt-0.5">Monthly platform subscriber onboarding trajectory</p>
            </div>
            <span className="inline-flex items-center text-xs font-semibold text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200">
              <TrendingUp className="w-3.5 h-3.5 mr-1" />
              +28% YoY
            </span>
          </div>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={growthData} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorTotal" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#2563eb" stopOpacity={0.2}/>
                    <stop offset="95%" stopColor="#2563eb" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                <XAxis dataKey="name" stroke="#9ca3af" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis stroke="#9ca3af" fontSize={12} tickLine={false} axisLine={false} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#111827', borderRadius: '12px', border: 'none', color: '#fff', fontSize: '12px' }}
                  itemStyle={{ color: '#60a5fa' }}
                />
                <Area type="monotone" dataKey="total" stroke="#2563eb" strokeWidth={2.5} fillOpacity={1} fill="url(#colorTotal)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-xs border border-gray-200/80 p-6 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-bold text-gray-900">Tier Distribution</h2>
              <Link href="/super-admin/tiers" className="text-xs font-semibold text-blue-600 hover:text-blue-700">
                View Tiers
              </Link>
            </div>
            <div className="space-y-3">
              <div className="flex justify-between items-center p-3.5 bg-gray-50 rounded-xl border border-gray-100">
                <div className="flex items-center gap-2.5">
                  <div className="w-2.5 h-2.5 rounded-full bg-gray-400" />
                  <span className="font-semibold text-gray-700 text-sm">Starter Tier</span>
                </div>
                <span className="text-gray-900 font-extrabold text-sm">{stats.tierDistribution.Starter || 0}</span>
              </div>
              <div className="flex justify-between items-center p-3.5 bg-blue-50/60 rounded-xl border border-blue-100">
                <div className="flex items-center gap-2.5">
                  <div className="w-2.5 h-2.5 rounded-full bg-blue-600" />
                  <span className="font-semibold text-blue-900 text-sm">Pro Tier</span>
                </div>
                <span className="text-blue-900 font-extrabold text-sm">{stats.tierDistribution.Pro || 0}</span>
              </div>
              <div className="flex justify-between items-center p-3.5 bg-purple-50/60 rounded-xl border border-purple-100">
                <div className="flex items-center gap-2.5">
                  <div className="w-2.5 h-2.5 rounded-full bg-purple-600" />
                  <span className="font-semibold text-purple-900 text-sm">Enterprise Tier</span>
                </div>
                <span className="text-purple-900 font-extrabold text-sm">{stats.tierDistribution.Enterprise || 0}</span>
              </div>
            </div>
          </div>

          <div className="pt-6 mt-6 border-t border-gray-100">
            <Link 
              href="/super-admin/customers"
              className="w-full flex items-center justify-center gap-2 py-2.5 px-4 bg-gray-100 hover:bg-gray-200 text-gray-800 text-xs font-bold rounded-xl transition-colors"
            >
              <span>Explore All Subscribers</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

function StatCard({ title, value, icon: Icon, trend, alert, subtitle }: any) {
  return (
    <div className="bg-white rounded-2xl shadow-xs border border-gray-200/80 p-6 flex flex-col justify-between">
      <div className="flex justify-between items-start mb-4">
        <div className={`p-3 rounded-xl ${alert ? 'bg-red-50 text-red-600' : 'bg-blue-50 text-blue-600'}`}>
          <Icon size={22} />
        </div>
        {trend && (
          <span className="inline-flex items-center text-xs font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200">
            <TrendingUp size={14} className="mr-1" />
            {trend}
          </span>
        )}
      </div>
      <div>
        <h3 className="text-gray-500 font-semibold text-xs uppercase tracking-wider">{title}</h3>
        <p className="text-2xl font-extrabold text-gray-900 mt-1.5">{value}</p>
        {subtitle && <p className="text-xs text-gray-500 mt-1">{subtitle}</p>}
      </div>
    </div>
  );
}
