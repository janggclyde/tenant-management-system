'use client';

import { useState, useEffect, useMemo } from 'react';
import { 
  Search, 
  Plus, 
  Download, 
  CheckCircle2, 
  Clock, 
  AlertCircle, 
  Receipt, 
  CreditCard,
  Loader2,
  X,
  DollarSign,
  Repeat,
  Calendar,
  Hash,
  Building2,
  ImageIcon,
  ExternalLink,
  Eye
} from 'lucide-react';
import Link from 'next/link';
import type { BillingRecord } from '@/lib/billingsStore';
import type { CollectionRecord } from '@/lib/collectionsStore';
import { formatBillingReference, formatCollectionReference, formatBillingCycle } from '@/lib/utils';

const POPULAR_BANKS_EWALLETS = [
  "BDO", "BPI", "GCash", "Maya", "UnionBank", "Metrobank", "Landbank", "GoTyme", "SeaBank"
];

export default function CollectionsPage() {
  const [activeTab, setActiveTab] = useState<'for_collection' | 'collected' | 'advanced'>('for_collection');
  const [billings, setBillings] = useState<BillingRecord[]>([]);
  const [collections, setCollections] = useState<CollectionRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  // Payment Modal State
  const [paymentModalBilling, setPaymentModalBilling] = useState<BillingRecord | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'gcash' | 'qr' | 'bank_transfer'>('cash');
  const [bankName, setBankName] = useState<string>('');
  const [referenceNumber, setReferenceNumber] = useState<string>('');
  const [receiptUrl, setReceiptUrl] = useState<string>('');
  const [imageError, setImageError] = useState(false);
  const [paymentAmount, setPaymentAmount] = useState<string>('');
  const [collectedDate, setCollectedDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [paymentSubmitting, setPaymentSubmitting] = useState(false);
  const [paymentError, setPaymentError] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Full Image Preview Modal State
  const [previewReceiptUrl, setPreviewReceiptUrl] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const fetchData = async () => {
    setLoading(true);
    try {
      const [bRes, cRes] = await Promise.all([
        fetch('/api/admin/billings'),
        fetch('/api/admin/collections')
      ]);
      const bData = await bRes.json();
      const cData = await cRes.json();

      if (bData.success) setBillings(bData.billings || []);
      if (cData.success) setCollections(cData.collections || []);
    } catch (err) {
      console.error('Failed to load collections data', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Filter billings that need collection (posted or overdue with remaining balance)
  const pendingBillings = useMemo(() => {
    return billings.filter(b => {
      const isPending = (b.status === 'posted' || b.status === 'overdue') && 
        (!b.amount_paid || b.amount_paid < b.amount);
      if (!isPending) return false;

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const refNo = b.reference_number || formatBillingReference(b.id);
        const cycle = formatBillingCycle(b.billing_cycle || b.BillingType?.frequency);
        return (
          refNo.toLowerCase().includes(q) ||
          b.id.toString().includes(q) ||
          cycle.toLowerCase().includes(q) ||
          b.tenant_name?.toLowerCase().includes(q) ||
          b.unit_number?.toLowerCase().includes(q) ||
          b.building_name?.toLowerCase().includes(q) ||
          b.billing_type_name?.toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [billings, searchQuery]);

  // Filter collected records
  const filteredCollections = useMemo(() => {
    return collections.filter(c => {
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const refNo = c.reference_number || formatCollectionReference(c.id);
        const invRef = c.billing_reference_number || formatBillingReference(c.billing_id);
        const cycle = c.billing_cycle || 'Monthly';
        return (
          refNo.toLowerCase().includes(q) ||
          invRef.toLowerCase().includes(q) ||
          cycle.toLowerCase().includes(q) ||
          (c.collected_date && c.collected_date.includes(q)) ||
          c.tenant_name?.toLowerCase().includes(q) ||
          c.unit_number?.toLowerCase().includes(q) ||
          c.building_name?.toLowerCase().includes(q) ||
          (c.bank_name && c.bank_name.toLowerCase().includes(q)) ||
          (c.payment_reference && c.payment_reference.toLowerCase().includes(q)) ||
          c.hitpay_reference?.toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [collections, searchQuery]);

  const handleOpenPaymentModal = (billing: BillingRecord) => {
    setPaymentModalBilling(billing);
    const balance = Math.max(0, billing.amount - (billing.amount_paid || 0));
    setPaymentAmount(balance.toString());
    setPaymentMethod('cash');
    setBankName('');
    setReferenceNumber('');
    setReceiptUrl('');
    setImageError(false);
    setCollectedDate(new Date().toISOString().split('T')[0]);
    setPaymentError(null);
  };

  const handleRecordPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!paymentModalBilling) return;

    const amt = Number(paymentAmount);
    if (isNaN(amt) || amt <= 0) {
      setPaymentError('Please enter a valid payment amount.');
      return;
    }

    if (paymentMethod === 'bank_transfer' && !bankName.trim()) {
      setPaymentError('Please enter the Bank name or E-Wallet used for the transfer.');
      return;
    }

    setPaymentSubmitting(true);
    setPaymentError(null);

    try {
      const res = await fetch('/api/admin/collections', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          billing_id: paymentModalBilling.id,
          amount_paid: amt,
          payment_method: paymentMethod,
          bank_name: paymentMethod === 'bank_transfer' ? bankName.trim() : undefined,
          reference_number: paymentMethod === 'bank_transfer' && referenceNumber.trim() ? referenceNumber.trim() : undefined,
          payment_reference: paymentMethod === 'bank_transfer' && referenceNumber.trim() ? referenceNumber.trim() : undefined,
          receipt_url: paymentMethod === 'bank_transfer' && receiptUrl.trim() ? receiptUrl.trim() : undefined,
          collected_date: collectedDate,
          status: 'completed',
        })
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.error || 'Failed to record collection');

      setPaymentModalBilling(null);
      showToast(`Payment of ₱${amt.toLocaleString()} recorded successfully!`);
      fetchData();
    } catch (err: any) {
      setPaymentError(err.message || 'Error recording payment.');
    } finally {
      setPaymentSubmitting(false);
    }
  };

  return (
    <div className="p-6 md:p-8 max-w-7xl mx-auto space-y-6">
      {toastMessage && (
        <div className="fixed bottom-5 right-5 z-50 bg-gray-900 text-white px-4 py-3 rounded-xl shadow-lg flex items-center gap-2 text-sm">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          <span>{toastMessage}</span>
        </div>
      )}

      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Collections</h1>
          <p className="text-gray-500 mt-1">Manage receivables, record payments, and track receipts.</p>
        </div>
        <Link 
          href="/admin/billings" 
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-xl text-sm font-semibold transition-colors flex items-center shadow-xs"
        >
          <Plus className="w-4 h-4 mr-1.5" />
          <span>Create Draft Bill</span>
        </Link>
      </div>

      <div className="bg-white rounded-2xl shadow-xs border border-gray-200 overflow-hidden">
        {/* Navigation Tabs */}
        <div className="border-b border-gray-200 bg-gray-50/50">
          <nav className="flex overflow-x-auto" aria-label="Tabs">
            <button
              onClick={() => setActiveTab('for_collection')}
              className={`whitespace-nowrap py-4 px-6 border-b-2 font-semibold text-sm transition-colors flex items-center gap-2 ${
                activeTab === 'for_collection'
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <span>For Collection</span>
              {pendingBillings.length > 0 && (
                <span className="bg-amber-100 text-amber-800 text-xs px-2 py-0.5 rounded-full font-bold">
                  {pendingBillings.length}
                </span>
              )}
            </button>
            <button
              onClick={() => setActiveTab('collected')}
              className={`whitespace-nowrap py-4 px-6 border-b-2 font-semibold text-sm transition-colors flex items-center gap-2 ${
                activeTab === 'collected'
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <span>Collected / Paid</span>
              {filteredCollections.length > 0 && (
                <span className="bg-blue-100 text-blue-800 text-xs px-2 py-0.5 rounded-full font-bold">
                  {filteredCollections.length}
                </span>
              )}
            </button>
            <button
              onClick={() => setActiveTab('advanced')}
              className={`whitespace-nowrap py-4 px-6 border-b-2 font-semibold text-sm transition-colors ${
                activeTab === 'advanced'
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Advanced Payments
            </button>
          </nav>
        </div>

        {/* Search Header */}
        <div className="p-4 border-b border-gray-200 flex justify-between items-center bg-white">
          <div className="relative max-w-sm w-full">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="h-4 w-4 text-gray-400" />
            </div>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-xl leading-5 bg-white placeholder-gray-400 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="Search by tenant, unit, or invoice..."
            />
          </div>
        </div>

        {/* Content Tabs */}
        <div className="overflow-x-auto">
          {loading ? (
            <div className="p-16 text-center text-gray-500 flex flex-col items-center justify-center">
              <Loader2 className="w-8 h-8 animate-spin text-blue-600 mb-2" />
              <p className="text-sm">Loading collection records...</p>
            </div>
          ) : activeTab === 'for_collection' ? (
            pendingBillings.length > 0 ? (
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Invoice Ref</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Unit / Tenant</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Billing Type</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Billing Cycle</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Amount Due</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Due Date</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Status</th>
                    <th scope="col" className="relative px-6 py-3"><span className="sr-only">Actions</span></th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {pendingBillings.map((b) => {
                    const balance = b.amount - (b.amount_paid || 0);
                    return (
                      <tr key={b.id} className="hover:bg-gray-50/60 transition-colors">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="font-mono text-xs font-bold text-gray-900 bg-gray-100 px-2.5 py-1 rounded-lg border border-gray-200 inline-flex items-center gap-1">
                            <Hash className="w-3 h-3 text-gray-500" />
                            {b.reference_number || formatBillingReference(b.id)}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-bold text-gray-900">{b.unit_number || `Unit #${b.unit_id}`}</div>
                          <div className="text-xs text-gray-500">{b.tenant_name} • {b.building_name}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                          {b.billing_type_name || 'General Bill'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="inline-flex items-center gap-1 text-xs font-semibold text-blue-700 bg-blue-50 px-2.5 py-0.5 rounded-md border border-blue-200">
                            <Repeat className="w-3 h-3 text-blue-600" />
                            {formatBillingCycle(b.billing_cycle || b.BillingType?.frequency)}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-extrabold text-gray-900">₱ {balance.toLocaleString('en-US', { minimumFractionDigits: 2 })}</div>
                          {b.late_fee_applied > 0 && (
                            <div className="text-[11px] font-semibold text-red-500">+₱{b.late_fee_applied.toFixed(2)} Late Fee</div>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 font-medium">
                          {b.due_date}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                            b.status === 'overdue' 
                              ? 'bg-red-100 text-red-800' 
                              : 'bg-amber-100 text-amber-800'
                          }`}>
                            {b.status === 'overdue' ? <AlertCircle className="w-3 h-3 mr-1" /> : <Clock className="w-3 h-3 mr-1" />}
                            {b.status === 'overdue' ? 'Overdue' : 'Pending Payment'}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <button 
                            onClick={() => handleOpenPaymentModal(b)}
                            className="text-blue-600 hover:text-blue-800 font-semibold bg-blue-50 hover:bg-blue-100 px-3.5 py-1.5 rounded-xl transition-colors inline-flex items-center gap-1 text-xs"
                          >
                            <DollarSign className="w-3.5 h-3.5" />
                            <span>Collect Payment</span>
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            ) : (
              <div className="p-16 text-center text-gray-500">
                <CheckCircle2 className="w-12 h-12 text-emerald-500 mx-auto mb-3" />
                <h3 className="text-base font-bold text-gray-800">All Collections Caught Up</h3>
                <p className="text-xs text-gray-500 mt-1 max-w-sm mx-auto">
                  There are currently no posted or overdue invoices waiting for collection.
                </p>
              </div>
            )
          ) : activeTab === 'collected' ? (
            filteredCollections.length > 0 ? (
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Reference No.</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Date Collected</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Invoice Ref</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Tenant / Unit</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Billing Cycle</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Payment Method</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Amount Collected</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Status</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Receipt Proof</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredCollections.map((c) => (
                    <tr key={c.id} className="hover:bg-gray-50/60 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="font-mono text-xs font-bold text-blue-900 bg-blue-50 px-2.5 py-1 rounded-lg border border-blue-200 inline-flex items-center gap-1.5 shadow-2xs">
                          <Receipt className="w-3.5 h-3.5 text-blue-600" />
                          {c.reference_number || formatCollectionReference(c.id)}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-xs text-gray-700 font-medium">
                        <div className="flex items-center gap-1.5">
                          <Calendar className="w-3.5 h-3.5 text-gray-400" />
                          <span>
                            {c.collected_date 
                              ? new Date(c.collected_date).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })
                              : (c.createdAt ? new Date(c.createdAt).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' }) : '-')}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="font-mono text-xs font-semibold text-gray-800 bg-gray-100 px-2.5 py-1 rounded-md border border-gray-200 inline-flex items-center gap-1">
                          <Hash className="w-3 h-3 text-gray-400" />
                          {c.billing_reference_number || formatBillingReference(c.billing_id)}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-bold text-gray-900">{c.tenant_name || 'Tenant'}</div>
                        <div className="text-xs text-gray-500">{c.unit_number} • {c.building_name}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="inline-flex items-center gap-1 text-xs font-medium text-slate-700 bg-slate-100 px-2.5 py-0.5 rounded-md border border-slate-200">
                          <Repeat className="w-3.5 h-3.5 text-slate-500" />
                          {c.billing_cycle || 'Monthly'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                        {c.payment_method === 'bank_transfer' ? (
                          <div className="space-y-0.5">
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-semibold bg-blue-50 text-blue-800 border border-blue-200">
                              <Building2 className="w-3 h-3 text-blue-600" />
                              Bank Transfer
                            </span>
                            {c.bank_name && (
                              <div className="text-xs font-bold text-gray-900">
                                {c.bank_name}
                              </div>
                            )}
                            {c.payment_reference && (
                              <div className="text-[11px] text-gray-500 font-mono">
                                Ref: {c.payment_reference}
                              </div>
                            )}
                          </div>
                        ) : (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-lg text-xs font-semibold bg-gray-100 text-gray-800 uppercase">
                            {c.payment_method === 'gcash' ? 'GCash' : c.payment_method === 'qr' ? 'QR Ph' : 'Cash'}
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-extrabold text-emerald-700">
                        ₱ {Number(c.amount_paid).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-green-100 text-green-800">
                          <CheckCircle2 className="w-3 h-3 mr-1" />
                          Completed
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-xs">
                        {c.receipt_url ? (
                          <button
                            type="button"
                            onClick={() => setPreviewReceiptUrl(c.receipt_url!)}
                            className="inline-flex items-center gap-1 px-2.5 py-1 bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 rounded-lg font-semibold transition-colors shadow-2xs cursor-pointer"
                            title="Click to view full image receipt"
                          >
                            <Eye className="w-3.5 h-3.5 text-blue-600" />
                            <span>View Proof</span>
                          </button>
                        ) : (
                          <span className="text-gray-400 text-xs italic">None</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <div className="p-16 text-center text-gray-500">
                <Receipt className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                <h3 className="text-base font-bold text-gray-800">No Collected Payments Yet</h3>
                <p className="text-xs text-gray-500 mt-1 max-w-sm mx-auto">
                  Payments collected via Cash, GCash, or QR will appear in this history log once received.
                </p>
              </div>
            )
          ) : (
            <div className="p-16 text-center text-gray-500">
              <CreditCard className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <h3 className="text-base font-bold text-gray-800">No Advance Payments On Record</h3>
              <p className="text-xs text-gray-500 mt-1 max-w-sm mx-auto">
                Prepaid rental deposits and advance security payments will be listed here.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Record Payment Modal */}
      {paymentModalBilling && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl max-w-lg w-full shadow-2xl overflow-hidden border border-gray-200 max-h-[92vh] flex flex-col">
            <div className="px-6 py-4 bg-gray-50 border-b border-gray-200 flex justify-between items-center shrink-0">
              <div>
                <h3 className="text-base font-bold text-gray-900">Record Payment</h3>
                <p className="text-xs text-gray-500">
                  Billing Invoice {paymentModalBilling.reference_number || formatBillingReference(paymentModalBilling.id)}
                </p>
              </div>
              <button 
                onClick={() => setPaymentModalBilling(null)}
                className="text-gray-400 hover:text-gray-600 p-1 rounded-lg cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleRecordPayment} className="p-6 space-y-4 overflow-y-auto">
              {paymentError && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-red-700 text-xs font-semibold flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />
                  <span>{paymentError}</span>
                </div>
              )}

              <div className="p-3 bg-gray-50 rounded-xl border border-gray-200 text-xs space-y-1">
                <div className="flex justify-between">
                  <span className="text-gray-500">Invoice Reference:</span>
                  <span className="font-mono font-bold text-gray-900">
                    {paymentModalBilling.reference_number || formatBillingReference(paymentModalBilling.id)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Tenant:</span>
                  <span className="font-bold text-gray-900">{paymentModalBilling.tenant_name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Unit:</span>
                  <span className="font-bold text-gray-900">{paymentModalBilling.unit_number} ({paymentModalBilling.building_name})</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Billing Cycle:</span>
                  <span className="font-semibold text-blue-700">
                    {formatBillingCycle(paymentModalBilling.billing_cycle || paymentModalBilling.BillingType?.frequency)}
                  </span>
                </div>
                <div className="flex justify-between border-t border-gray-200 pt-1 mt-1">
                  <span className="text-gray-500">Total Invoice:</span>
                  <span className="font-bold text-gray-900">₱ {paymentModalBilling.amount.toLocaleString()}</span>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">
                  Date Collected *
                </label>
                <input
                  type="date"
                  value={collectedDate}
                  onChange={(e) => setCollectedDate(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-xl text-sm font-medium text-gray-900 focus:ring-2 focus:ring-blue-500 outline-none"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">
                  Amount to Collect (₱) *
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-2.5 text-gray-400 text-sm font-semibold">₱</span>
                  <input
                    type="number"
                    step="0.01"
                    min="0.01"
                    value={paymentAmount}
                    onChange={(e) => setPaymentAmount(e.target.value)}
                    className="w-full pl-7 pr-3 py-2 border border-gray-300 rounded-xl text-sm font-bold text-gray-900 focus:ring-2 focus:ring-blue-500 outline-none"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">
                  Payment Method *
                </label>
                <select
                  value={paymentMethod}
                  onChange={(e) => {
                    setPaymentMethod(e.target.value as any);
                    setImageError(false);
                  }}
                  className="w-full px-3 py-2 border border-gray-300 rounded-xl text-sm bg-white font-medium text-gray-900 focus:ring-2 focus:ring-blue-500 outline-none"
                >
                  <option value="cash">Cash</option>
                  <option value="bank_transfer">Bank Transfer / E-Wallet</option>
                  <option value="gcash">GCash</option>
                  <option value="qr">QR Ph</option>
                </select>
              </div>

              {/* Dynamic Bank Transfer / E-Wallet Details */}
              {paymentMethod === 'bank_transfer' && (
                <div className="p-4 bg-gradient-to-br from-blue-50/70 via-slate-50 to-indigo-50/60 border border-blue-200 rounded-xl space-y-3.5 shadow-2xs">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-blue-900 uppercase tracking-wide">
                    <Building2 className="w-4 h-4 text-blue-600" />
                    <span>Bank Transfer / E-Wallet Details</span>
                  </div>

                  {/* Bank / E-Wallet Name */}
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">
                      Bank Name or E-Wallet *
                    </label>
                    <input
                      type="text"
                      value={bankName}
                      onChange={(e) => setBankName(e.target.value)}
                      placeholder="e.g. BDO, BPI, GCash, Maya, UnionBank..."
                      className="w-full px-3 py-2 border border-gray-300 rounded-xl text-sm font-medium text-gray-900 bg-white focus:ring-2 focus:ring-blue-500 outline-none shadow-2xs"
                      required={paymentMethod === 'bank_transfer'}
                    />
                    {/* Quick suggestion tags */}
                    <div className="flex flex-wrap gap-1 mt-1.5">
                      {POPULAR_BANKS_EWALLETS.map((name) => (
                        <button
                          key={name}
                          type="button"
                          onClick={() => setBankName(name)}
                          className={`text-[10px] px-2 py-0.5 rounded-md font-medium border transition-colors cursor-pointer ${
                            bankName.toLowerCase() === name.toLowerCase()
                              ? 'bg-blue-600 text-white border-blue-600 shadow-2xs'
                              : 'bg-white text-gray-700 border-gray-200 hover:bg-blue-50 hover:text-blue-700'
                          }`}
                        >
                          {name}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Reference Number (Optional) */}
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="block text-xs font-semibold text-gray-700">
                        Reference Number
                      </label>
                      <span className="text-[10px] font-medium text-gray-400 uppercase tracking-wider">
                        Optional
                      </span>
                    </div>
                    <div className="relative">
                      <Hash className="w-3.5 h-3.5 text-gray-400 absolute left-3 top-3 pointer-events-none" />
                      <input
                        type="text"
                        value={referenceNumber}
                        onChange={(e) => setReferenceNumber(e.target.value)}
                        placeholder="e.g. 123456789012 or TRN-87654321"
                        className="w-full pl-8 pr-3 py-2 border border-gray-300 rounded-xl text-sm font-medium text-gray-900 bg-white focus:ring-2 focus:ring-blue-500 outline-none shadow-2xs font-mono"
                      />
                    </div>
                  </div>

                  {/* Image Field: Link to Image with Live Display in Form */}
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="block text-xs font-semibold text-gray-700 flex items-center gap-1.5">
                        <ImageIcon className="w-3.5 h-3.5 text-blue-600" />
                        <span>Receipt / Proof Image Link</span>
                      </label>
                      <span className="text-[10px] font-medium text-gray-400 uppercase tracking-wider">
                        Optional Link
                      </span>
                    </div>
                    <input
                      type="url"
                      value={receiptUrl}
                      onChange={(e) => {
                        setReceiptUrl(e.target.value);
                        setImageError(false);
                      }}
                      placeholder="https://example.com/receipt.jpg or paste image link"
                      className="w-full px-3 py-2 border border-gray-300 rounded-xl text-sm font-medium text-gray-900 bg-white focus:ring-2 focus:ring-blue-500 outline-none shadow-2xs"
                    />

                    {/* Image Preview Box displayed directly in the form */}
                    {receiptUrl.trim() ? (
                      <div className="mt-2.5 p-2.5 bg-white border border-blue-200 rounded-xl shadow-2xs space-y-1.5">
                        <div className="flex items-center justify-between px-1 text-[11px] font-semibold text-gray-700">
                          <span className="flex items-center gap-1 text-blue-700 font-bold">
                            <ImageIcon className="w-3.5 h-3.5" />
                            Receipt Image Preview
                          </span>
                          <div className="flex items-center gap-2">
                            <a
                              href={receiptUrl.trim()}
                              target="_blank"
                              rel="noreferrer"
                              className="text-blue-600 hover:text-blue-800 text-[11px] hover:underline inline-flex items-center gap-0.5"
                            >
                              <ExternalLink className="w-3 h-3" />
                              Open link
                            </a>
                            <button
                              type="button"
                              onClick={() => {
                                setReceiptUrl('');
                                setImageError(false);
                              }}
                              className="text-red-500 hover:text-red-700 text-[11px] font-medium cursor-pointer"
                            >
                              Clear
                            </button>
                          </div>
                        </div>

                        <div className="relative rounded-lg overflow-hidden bg-gray-50 border border-gray-200 flex items-center justify-center min-h-[120px] max-h-[220px] p-2">
                          {imageError ? (
                            <div className="p-4 text-center text-xs text-amber-800 flex flex-col items-center gap-1.5">
                              <AlertCircle className="w-5 h-5 text-amber-500" />
                              <span className="font-semibold">Unable to load image preview</span>
                              <span className="text-[11px] text-amber-600">Please check that the URL is a direct link to an image file.</span>
                            </div>
                          ) : (
                            <img
                              src={receiptUrl.trim()}
                              alt="Proof of payment preview"
                              onError={() => setImageError(true)}
                              className="max-h-[200px] w-auto max-w-full object-contain rounded-md shadow-xs"
                            />
                          )}
                        </div>
                      </div>
                    ) : (
                      <p className="mt-1 text-[11px] text-gray-400 italic">
                        Paste an image link above to display the proof of payment receipt in this form.
                      </p>
                    )}
                  </div>
                </div>
              )}

              <div className="pt-3 flex justify-end gap-3 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setPaymentModalBilling(null)}
                  className="px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-xl transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={paymentSubmitting}
                  className="px-5 py-2 text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-xl transition-all shadow-sm flex items-center gap-2 disabled:opacity-50 cursor-pointer"
                >
                  {paymentSubmitting && <Loader2 className="w-4 h-4 animate-spin" />}
                  <span>Confirm Payment</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Full Receipt Image Viewer Modal */}
      {previewReceiptUrl && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl max-w-2xl w-full shadow-2xl overflow-hidden border border-gray-200">
            <div className="px-6 py-4 bg-gray-50 border-b border-gray-200 flex justify-between items-center">
              <div className="flex items-center gap-2">
                <ImageIcon className="w-4 h-4 text-blue-600" />
                <h3 className="text-sm font-bold text-gray-900">Proof of Payment Receipt</h3>
              </div>
              <div className="flex items-center gap-2">
                <a
                  href={previewReceiptUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="text-xs text-blue-600 hover:text-blue-800 font-semibold inline-flex items-center gap-1 hover:underline"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  <span>Open Full Resolution</span>
                </a>
                <button
                  onClick={() => setPreviewReceiptUrl(null)}
                  className="text-gray-400 hover:text-gray-600 p-1 rounded-lg cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>
            <div className="p-4 bg-slate-900/5 flex items-center justify-center max-h-[70vh] overflow-auto">
              <img
                src={previewReceiptUrl}
                alt="Receipt Full Preview"
                className="max-h-[65vh] w-auto max-w-full object-contain rounded-lg shadow-md"
              />
            </div>
            <div className="px-6 py-3 bg-gray-50 border-t border-gray-200 flex justify-end">
              <button
                type="button"
                onClick={() => setPreviewReceiptUrl(null)}
                className="px-4 py-1.5 text-xs font-semibold text-gray-700 bg-white border border-gray-300 hover:bg-gray-100 rounded-lg transition-colors cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
