'use client';

import { useState, useEffect, useMemo } from 'react';
import { 
  Building2, 
  Users, 
  CreditCard, 
  TrendingUp, 
  AlertCircle, 
  Loader2, 
  Clock, 
  CalendarClock, 
  Calendar, 
  AlertTriangle, 
  ArrowRight, 
  CheckCircle2, 
  Home 
} from 'lucide-react';
import Link from 'next/link';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';

export interface DueBillingItem {
  id: number;
  reference_number?: string;
  tenant_name: string;
  tenant_email?: string;
  unit_number: string;
  building_name: string;
  billing_type_name: string;
  amount: number;
  amount_paid: number;
  balance_due: number;
  due_date: string;
  status: string;
  diffDays: number;
  urgency: 'overdue' | 'due_today' | 'due_soon' | 'upcoming';
}

interface OverviewStats {
  buildingsCount: number;
  unitsCount: number;
  tenantsCount: number;
  collected: number;
  overdueCount: number;
  revenueData: Array<{ name: string; total: number }>;
  recentActivities: Array<{ id: number; title: string; description: string; time: string }>;
  dueBillings?: DueBillingItem[];
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

      {/* Due & Overdue Billings Card */}
      <DueBillingsCard 
        dueBillings={stats?.dueBillings || []} 
        loading={loading} 
      />
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

function DueBillingsCard({ dueBillings, loading }: { dueBillings: DueBillingItem[]; loading: boolean }) {
  const [filter, setFilter] = useState<'all' | 'past_due' | 'due_soon'>('all');

  const overdueCount = useMemo(() => dueBillings.filter((b) => b.diffDays < 0).length, [dueBillings]);
  const dueSoonCount = useMemo(() => dueBillings.filter((b) => b.diffDays >= 0).length, [dueBillings]);

  const filteredBillings = useMemo(() => {
    if (filter === 'past_due') return dueBillings.filter((b) => b.diffDays < 0);
    if (filter === 'due_soon') return dueBillings.filter((b) => b.diffDays >= 0);
    return dueBillings;
  }, [dueBillings, filter]);

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 space-y-6">
      {/* Card Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-gray-100">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center border border-amber-100 flex-shrink-0">
            <CalendarClock className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-bold text-gray-900">Due & Overdue Billings</h2>
              {!loading && dueBillings.length > 0 && (
                <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-red-100 text-red-700">
                  {dueBillings.length} Attention Needed
                </span>
              )}
            </div>
            <p className="text-xs text-gray-500 mt-0.5">
              Billings approaching or past their payment deadlines with tenant and unit details.
            </p>
          </div>
        </div>

        {/* Filter Pills & Navigation */}
        <div className="flex items-center gap-2 flex-wrap">
          <div className="flex bg-gray-100 p-1 rounded-xl text-xs font-medium">
            <button
              onClick={() => setFilter('all')}
              className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                filter === 'all'
                  ? 'bg-white text-gray-900 font-semibold shadow-xs'
                  : 'text-gray-500 hover:text-gray-900'
              }`}
            >
              All ({dueBillings.length})
            </button>
            <button
              onClick={() => setFilter('past_due')}
              className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 cursor-pointer ${
                filter === 'past_due'
                  ? 'bg-red-600 text-white font-semibold shadow-xs'
                  : 'text-gray-500 hover:text-red-700'
              }`}
            >
              <span>Past Due</span>
              <span className={`px-1.5 py-0.2 rounded-full text-[10px] ${filter === 'past_due' ? 'bg-red-700 text-white' : 'bg-red-100 text-red-700'}`}>
                {overdueCount}
              </span>
            </button>
            <button
              onClick={() => setFilter('due_soon')}
              className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 cursor-pointer ${
                filter === 'due_soon'
                  ? 'bg-amber-600 text-white font-semibold shadow-xs'
                  : 'text-gray-500 hover:text-amber-700'
              }`}
            >
              <span>Due Soon</span>
              <span className={`px-1.5 py-0.2 rounded-full text-[10px] ${filter === 'due_soon' ? 'bg-amber-700 text-white' : 'bg-amber-100 text-amber-800'}`}>
                {dueSoonCount}
              </span>
            </button>
          </div>

          <Link
            href="/admin/billings"
            className="text-xs font-semibold text-blue-600 hover:text-blue-800 hover:bg-blue-50 px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1 ml-auto sm:ml-0"
          >
            <span>All Billings</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>

      {/* Card Body */}
      {loading ? (
        <div className="py-16 flex flex-col items-center justify-center text-gray-400">
          <Loader2 className="w-7 h-7 animate-spin text-blue-600 mb-2" />
          <span className="text-sm font-medium">Loading due billings...</span>
        </div>
      ) : filteredBillings.length === 0 ? (
        <div className="py-12 flex flex-col items-center justify-center text-center p-6 border border-dashed border-gray-200 rounded-xl bg-gray-50/50">
          <div className="w-12 h-12 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center mb-3">
            <CheckCircle2 className="w-6 h-6" />
          </div>
          <h3 className="text-sm font-semibold text-gray-900">
            {dueBillings.length === 0
              ? "All Tenant Billings Are Up To Date"
              : filter === 'past_due'
              ? "No Past Due Billings"
              : "No Billings Due Soon"}
          </h3>
          <p className="text-xs text-gray-500 max-w-sm mt-1">
            {dueBillings.length === 0
              ? "No tenant invoices are currently approaching their due dates or overdue."
              : filter === 'past_due'
              ? "There are currently no overdue billing statements requiring penalty action."
              : "No invoices are scheduled for payment within the next 14 days."}
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-100 text-left">
            <thead>
              <tr className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider bg-gray-50/50">
                <th scope="col" className="py-3 px-4 rounded-l-lg">Tenant Name</th>
                <th scope="col" className="py-3 px-4">Unit & Property</th>
                <th scope="col" className="py-3 px-4">Billing Category</th>
                <th scope="col" className="py-3 px-4">Balance Due</th>
                <th scope="col" className="py-3 px-4">Due Date & Urgency</th>
                <th scope="col" className="py-3 px-4 text-right rounded-r-lg">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 text-xs">
              {filteredBillings.map((bill) => {
                const isOverdue = bill.diffDays < 0;
                const isToday = bill.diffDays === 0;

                return (
                  <tr key={bill.id} className="hover:bg-gray-50/80 transition-colors">
                    {/* Tenant Name */}
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-700 font-bold text-xs flex items-center justify-center flex-shrink-0">
                          {bill.tenant_name ? bill.tenant_name.substring(0, 2).toUpperCase() : 'TN'}
                        </div>
                        <div>
                          <div className="flex items-center gap-1.5">
                            <span className="font-bold text-gray-900 text-sm">
                              {bill.tenant_name}
                            </span>
                            <span className="font-mono text-[10px] font-bold text-gray-700 bg-gray-100 px-1.5 py-0.5 rounded border border-gray-200">
                              {bill.reference_number || `IN-${String(bill.id).padStart(5, '0')}`}
                            </span>
                          </div>
                          <div className="text-[11px] text-gray-400">
                            {bill.tenant_email || <span className="italic">No email</span>}
                          </div>
                        </div>
                      </div>
                    </td>

                    {/* Unit Number & Building */}
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <div className="flex items-center gap-1.5 font-semibold text-gray-900">
                        <Home className="w-3.5 h-3.5 text-blue-600" />
                        <span>Unit {bill.unit_number}</span>
                      </div>
                      <div className="text-[11px] text-gray-500 pl-5">
                        {bill.building_name}
                      </div>
                    </td>

                    {/* Billing Type */}
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-800 border border-slate-200">
                        {bill.billing_type_name}
                      </span>
                    </td>

                    {/* Balance Due */}
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <div className="font-bold text-gray-900 text-sm">
                        ₱ {bill.balance_due.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                      </div>
                      {bill.amount_paid > 0 && (
                        <div className="text-[10px] text-emerald-600 font-medium">
                          Paid: ₱ {bill.amount_paid.toLocaleString()}
                        </div>
                      )}
                    </td>

                    {/* Due Date & Urgency */}
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-gray-700">
                          {new Date(bill.due_date).toLocaleDateString('en-US', {
                            month: 'short',
                            day: 'numeric',
                            year: 'numeric'
                          })}
                        </span>
                        {isOverdue ? (
                          <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-md bg-red-50 text-red-700 border border-red-200">
                            <AlertTriangle className="w-3 h-3 text-red-600" />
                            <span>Past Due ({Math.abs(bill.diffDays)}d ago)</span>
                          </span>
                        ) : isToday ? (
                          <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-md bg-rose-50 text-rose-700 border border-rose-200 animate-pulse">
                            <Clock className="w-3 h-3 text-rose-600" />
                            <span>Due Today</span>
                          </span>
                        ) : bill.diffDays <= 3 ? (
                          <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-md bg-amber-50 text-amber-700 border border-amber-200">
                            <Clock className="w-3 h-3 text-amber-600" />
                            <span>Due in {bill.diffDays}d</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-[11px] font-medium px-2 py-0.5 rounded-md bg-blue-50 text-blue-700 border border-blue-200">
                            <Calendar className="w-3 h-3 text-blue-600" />
                            <span>Due in {bill.diffDays}d</span>
                          </span>
                        )}
                      </div>
                    </td>

                    {/* Action */}
                    <td className="py-3.5 px-4 whitespace-nowrap text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Link
                          href={`/admin/collections`}
                          className="px-2.5 py-1 rounded-lg text-xs font-semibold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 transition-colors"
                        >
                          Collect
                        </Link>
                        <Link
                          href={`/admin/billings`}
                          className="px-2.5 py-1 rounded-lg text-xs font-semibold text-blue-700 bg-blue-50 hover:bg-blue-100 border border-blue-200 transition-colors"
                        >
                          View Bill
                        </Link>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
