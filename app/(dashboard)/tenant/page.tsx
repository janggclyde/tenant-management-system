'use client';

import { useState, useEffect } from 'react';
import { 
  CreditCard, 
  Home, 
  FileText,
  AlertCircle,
  CheckCircle2,
  Loader2,
  Calendar,
  Building2
} from 'lucide-react';
import Link from 'next/link';

interface TenantOverviewData {
  tenant: {
    id: number;
    name: string;
    email: string;
    unit_number: string;
    building_name: string;
    lease_expiry?: string | null;
    document_url?: string | null;
  } | null;
  outstandingBill: {
    id: number;
    billing_type_name: string;
    amount: number;
    due_date: string;
    status: string;
  } | null;
  recentBills: Array<{
    id: number;
    billing_type_name: string;
    amount: number;
    due_date: string;
    status: string;
  }>;
  advancedBalance: number;
}

export default function TenantDashboard() {
  const [data, setData] = useState<TenantOverviewData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchTenantData() {
      try {
        const res = await fetch('/api/tenant/overview');
        const json = await res.json();
        if (json.success) {
          setData(json);
        }
      } catch (err) {
        console.error('Failed to load tenant overview', err);
      } finally {
        setLoading(false);
      }
    }
    fetchTenantData();
  }, []);

  const tenant = data?.tenant;
  const outstandingBill = data?.outstandingBill;
  const recentBills = data?.recentBills || [];

  return (
    <div className="p-6 md:p-8 max-w-7xl mx-auto space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">
          {loading ? 'Welcome' : `Welcome Back, ${tenant?.name || 'Resident'}`}
        </h1>
        <p className="text-gray-500 mt-1 flex items-center gap-1.5">
          <Building2 className="w-4 h-4 text-gray-400" />
          <span>
            {tenant ? `${tenant.unit_number} • ${tenant.building_name}` : 'Apartment Resident'}
          </span>
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Outstanding Bill Card */}
        {loading ? (
          <div className="bg-white rounded-2xl shadow-xs border border-gray-100 p-6 flex items-center justify-center min-h-[160px]">
            <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
          </div>
        ) : outstandingBill ? (
          <div className="bg-red-50 rounded-2xl shadow-xs border border-red-100 p-6 flex flex-col justify-between">
            <div>
              <div className="flex items-center text-red-600 mb-2">
                <AlertCircle className="w-5 h-5 mr-2" />
                <h3 className="font-bold text-sm">Action Required</h3>
              </div>
              <p className="text-xs text-red-700">
                You have an outstanding statement for {outstandingBill.billing_type_name}.
              </p>
            </div>
            <div className="flex justify-between items-end mt-4">
              <div>
                <p className="text-[10px] text-red-500 uppercase tracking-wider font-bold">Amount Due</p>
                <p className="text-2xl font-extrabold text-red-700">
                  ₱ {outstandingBill.amount.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                </p>
                <p className="text-[10px] text-red-500 mt-0.5 font-medium">Due: {outstandingBill.due_date}</p>
              </div>
              <Link 
                href="/tenant/bills" 
                className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-xl text-xs font-semibold transition-colors"
              >
                Pay Now
              </Link>
            </div>
          </div>
        ) : (
          <div className="bg-emerald-50/70 rounded-2xl shadow-xs border border-emerald-100 p-6 flex flex-col justify-between">
            <div>
              <div className="flex items-center text-emerald-700 mb-2">
                <CheckCircle2 className="w-5 h-5 mr-2" />
                <h3 className="font-bold text-sm">All Caught Up</h3>
              </div>
              <p className="text-xs text-emerald-800 leading-relaxed">
                Your account is in good standing with zero overdue balance.
              </p>
            </div>
            <div className="mt-4">
              <p className="text-[10px] text-emerald-600 uppercase tracking-wider font-bold">Amount Due</p>
              <p className="text-2xl font-extrabold text-emerald-800">₱ 0.00</p>
            </div>
          </div>
        )}

        {/* Lease Card */}
        <div className="bg-white rounded-2xl shadow-xs border border-gray-200 p-6 flex flex-col justify-between">
          <div>
            <div className="flex items-center text-gray-700 mb-3">
              <Home className="w-5 h-5 mr-2 text-blue-500" />
              <h3 className="font-bold text-sm">Your Lease</h3>
            </div>
            {tenant?.lease_expiry ? (
              <p className="text-xs text-gray-500 flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5 text-gray-400" />
                <span>Expires on {new Date(tenant.lease_expiry).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}</span>
              </p>
            ) : (
              <p className="text-xs text-gray-400">Standard monthly tenancy</p>
            )}
          </div>
          <div className="mt-4">
            {tenant?.document_url ? (
              <a 
                href={tenant.document_url} 
                target="_blank" 
                rel="noreferrer" 
                className="text-blue-600 text-xs font-semibold hover:underline flex items-center gap-1"
              >
                <FileText className="w-3.5 h-3.5" />
                <span>View Contract Document</span>
              </a>
            ) : (
              <span className="text-xs text-gray-400 flex items-center gap-1">
                <FileText className="w-3.5 h-3.5 text-gray-300" />
                <span>Active verified tenancy</span>
              </span>
            )}
          </div>
        </div>

        {/* Advanced Payment */}
        <div className="bg-white rounded-2xl shadow-xs border border-gray-200 p-6 flex flex-col justify-between">
          <div>
            <div className="flex items-center text-gray-700 mb-3">
              <CreditCard className="w-5 h-5 mr-2 text-emerald-500" />
              <h3 className="font-bold text-sm">Advanced Payments</h3>
            </div>
            <p className="text-xs text-gray-500">Security deposit / prepaid credits</p>
          </div>
          <div className="mt-4">
            <p className="text-2xl font-extrabold text-gray-900">
              ₱ {Number(data?.advancedBalance || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}
            </p>
          </div>
        </div>
      </div>

      {/* Recent Bills */}
      <div className="bg-white rounded-2xl shadow-xs border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-base font-bold text-gray-900">Recent Bills</h2>
          <Link href="/tenant/bills" className="text-xs font-semibold text-blue-600 hover:text-blue-700">
            View All Bills
          </Link>
        </div>

        {loading ? (
          <div className="p-8 text-center text-gray-400 flex justify-center items-center">
            <Loader2 className="w-6 h-6 animate-spin mr-2" />
            <span className="text-sm">Loading bills...</span>
          </div>
        ) : recentBills.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-gray-100 text-xs text-gray-400 uppercase font-semibold">
                  <th className="py-3 px-4">Bill Type</th>
                  <th className="py-3 px-4">Due Date</th>
                  <th className="py-3 px-4">Amount</th>
                  <th className="py-3 px-4">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 text-sm">
                {recentBills.map((b) => (
                  <tr key={b.id} className="hover:bg-gray-50/60 transition-colors">
                    <td className="py-3.5 px-4 font-semibold text-gray-900">{b.billing_type_name}</td>
                    <td className="py-3.5 px-4 text-gray-500 text-xs">{b.due_date}</td>
                    <td className="py-3.5 px-4 font-extrabold text-gray-900">
                      ₱ {b.amount.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                    </td>
                    <td className="py-3.5 px-4">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                        b.status === 'paid'
                          ? 'bg-green-100 text-green-800'
                          : b.status === 'overdue'
                          ? 'bg-red-100 text-red-800'
                          : 'bg-amber-100 text-amber-800'
                      }`}>
                        {b.status === 'paid' ? 'Paid' : b.status === 'overdue' ? 'Overdue' : 'Unpaid'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="py-12 text-center text-gray-500 border border-dashed border-gray-200 rounded-xl bg-gray-50/50">
            <FileText className="w-10 h-10 text-gray-300 mx-auto mb-2" />
            <h4 className="text-sm font-semibold text-gray-700">No Bills Recorded</h4>
            <p className="text-xs text-gray-400 mt-0.5">You have no pending or past billing statements on file.</p>
          </div>
        )}
      </div>
    </div>
  );
}
