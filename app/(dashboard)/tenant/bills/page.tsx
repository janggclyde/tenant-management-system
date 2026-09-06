'use client';

import { useState, useEffect } from 'react';
import { Download, CreditCard, Loader2, Receipt, AlertCircle, CheckCircle2, Repeat } from 'lucide-react';

interface TenantBillRecord {
  id: number;
  description: string;
  due_date: string;
  billing_cycle?: string;
  amount: number;
  status: 'draft' | 'posted' | 'paid' | 'overdue';
  created_at?: string;
}

const formatBillingCycle = (c?: string) => {
  if (!c) return 'Monthly';
  const lower = c.toLowerCase().trim();
  switch (lower) {
    case 'monthly': return 'Monthly';
    case 'quarterly': return 'Quarterly (3 Mos)';
    case 'annually':
    case 'annual': return 'Annually (12 Mos)';
    case 'one_time':
    case 'one-time': return 'One-time';
    default: return c;
  }
};

export default function TenantBillsPage() {
  const [bills, setBills] = useState<TenantBillRecord[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchBills() {
      try {
        const res = await fetch('/api/tenant/bills');
        const data = await res.json();
        if (data.success) {
          setBills(data.bills || []);
        }
      } catch (err) {
        console.error('Failed to load bills', err);
      } finally {
        setLoading(false);
      }
    }
    fetchBills();
  }, []);

  return (
    <div className="p-6 md:p-8 max-w-5xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Bills & Statements</h1>
        <p className="text-gray-500 mt-1">View your rent and utility billing history and make payments.</p>
      </div>

      <div className="bg-white rounded-2xl shadow-xs border border-gray-200 overflow-hidden">
        {loading ? (
          <div className="p-16 text-center text-gray-400 flex flex-col items-center justify-center">
            <Loader2 className="w-8 h-8 animate-spin text-blue-600 mb-2" />
            <span className="text-sm">Loading bills...</span>
          </div>
        ) : bills.length > 0 ? (
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Description</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Due Date</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Amount</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Status</th>
                <th scope="col" className="relative px-6 py-3"><span className="sr-only">Actions</span></th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {bills.map((b) => (
                <tr key={b.id} className="hover:bg-gray-50/60 transition-colors">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-bold text-gray-900">{b.description}</div>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="text-xs text-gray-400">Invoice #{b.id}</span>
                      {b.billing_cycle && (
                        <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-blue-700 bg-blue-50 px-1.5 py-0.5 rounded border border-blue-200">
                          <Repeat className="w-2.5 h-2.5 text-blue-600" />
                          {formatBillingCycle(b.billing_cycle)}
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 font-medium">
                    {b.due_date}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-extrabold text-gray-900">
                    ₱ {b.amount.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                      b.status === 'paid'
                        ? 'bg-green-100 text-green-800'
                        : b.status === 'overdue'
                        ? 'bg-red-100 text-red-800'
                        : 'bg-amber-100 text-amber-800'
                    }`}>
                      {b.status === 'paid' ? <CheckCircle2 className="w-3 h-3 mr-1" /> : <AlertCircle className="w-3 h-3 mr-1" />}
                      {b.status === 'paid' ? 'Paid' : b.status === 'overdue' ? 'Overdue' : 'Unpaid'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    {b.status === 'paid' ? (
                      <a 
                        href={`/api/admin/billings/${b.id}/pdf`}
                        target="_blank"
                        rel="noreferrer"
                        className="text-gray-600 hover:text-gray-900 inline-flex items-center justify-end gap-1 text-xs font-semibold bg-gray-100 hover:bg-gray-200 px-3 py-1.5 rounded-xl transition-colors"
                      >
                        <Download className="w-3.5 h-3.5" />
                        <span>PDF Statement</span>
                      </a>
                    ) : (
                      <button 
                        onClick={() => alert(`Payment gateway for Invoice #${b.id} can be settled at the property management office or via QR.`)}
                        className="text-white bg-blue-600 hover:bg-blue-700 inline-flex items-center justify-end gap-1 text-xs font-semibold px-3.5 py-1.5 rounded-xl transition-colors shadow-xs"
                      >
                        <CreditCard className="w-3.5 h-3.5" />
                        <span>Pay Online</span>
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <div className="p-16 text-center text-gray-500">
            <Receipt className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <h3 className="text-base font-bold text-gray-800">No Bills Found</h3>
            <p className="text-xs text-gray-500 mt-1 max-w-sm mx-auto">
              You do not have any pending or past billing statements on file.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
