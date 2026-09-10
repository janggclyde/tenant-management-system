"use client";

import { useState, useEffect } from "react";
import {
  Download,
  CreditCard,
  Loader2,
  Receipt,
  AlertCircle,
  CheckCircle2,
  Repeat,
  ChevronDown,
  ChevronUp,
  X,
  Zap,
  Droplet,
  ArrowRight,
  ShieldCheck,
  QrCode,
  Building2,
  Clock,
} from "lucide-react";

interface CollectionRecord {
  id: number;
  amount_paid: number;
  payment_method: string;
  bank_name?: string | null;
  payment_reference?: string | null;
  collected_date?: string | null;
  status: string;
  receipt_url?: string | null;
}

interface TenantBillRecord {
  id: number;
  reference_number: string;
  billing_type_name: string;
  description: string;
  billing_cycle?: string;
  base_amount: number;
  tax_amount: number;
  transfer_fee: number;
  late_fee_applied: number;
  meter_readings?: any;
  extra_charges?: any;
  amount: number;
  amount_paid: number;
  remaining_balance: number;
  due_date: string;
  status: "draft" | "posted" | "paid" | "overdue" | "unpaid";
  collections: CollectionRecord[];
  created_at?: string;
}

interface BillsSummary {
  totalOutstanding: number;
  totalPaid: number;
  countUnpaid: number;
  countPaid: number;
  advancedBalance: number;
}

export default function TenantBillsPage() {
  const [bills, setBills] = useState<TenantBillRecord[]>([]);
  const [summary, setSummary] = useState<BillsSummary>({
    totalOutstanding: 0,
    totalPaid: 0,
    countUnpaid: 0,
    countPaid: 0,
    advancedBalance: 0,
  });
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | "unpaid" | "paid">("all");
  const [expandedBillId, setExpandedBillId] = useState<number | null>(null);

  // Payment Modal State
  const [selectedBillForPay, setSelectedBillForPay] =
    useState<TenantBillRecord | null>(null);
  const [payAmount, setPayAmount] = useState<string>("");
  const [paymentMethod, setPaymentMethod] = useState<
    "gcash" | "bank_transfer" | "qr" | "advance_credit" | "cash"
  >("gcash");
  const [bankName, setBankName] = useState("GCash");
  const [paymentReference, setPaymentReference] = useState("");
  const [receiptUrl, setReceiptUrl] = useState("");
  const [submittingPayment, setSubmittingPayment] = useState(false);
  const [payError, setPayError] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 4000);
  };

  const fetchBills = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/tenant/bills");
      const data = await res.json();
      if (data.success) {
        setBills(data.bills || []);
        if (data.summary) {
          setSummary(data.summary);
        }
      }
    } catch (err) {
      console.error("Failed to load bills", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBills();
  }, []);

  const openPaymentModal = (bill: TenantBillRecord) => {
    setSelectedBillForPay(bill);
    setPayAmount(
      String(bill.remaining_balance > 0 ? bill.remaining_balance : bill.amount),
    );
    setPaymentMethod("gcash");
    setBankName("GCash");
    setPaymentReference("");
    setReceiptUrl("");
    setPayError(null);
  };

  const handlePaymentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedBillForPay) return;

    const amt = parseFloat(payAmount);
    if (isNaN(amt) || amt <= 0) {
      setPayError("Please enter a valid amount.");
      return;
    }

    if (
      paymentMethod !== "advance_credit" &&
      paymentMethod !== "cash" &&
      !paymentReference.trim()
    ) {
      setPayError(
        "Please provide a reference number (e.g. GCash Reference No. or Bank Reference).",
      );
      return;
    }

    setSubmittingPayment(true);
    setPayError(null);

    try {
      const res = await fetch("/api/tenant/pay", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          billing_id: selectedBillForPay.id,
          amount_paid: amt,
          payment_method: paymentMethod,
          bank_name: bankName.trim(),
          payment_reference: paymentReference.trim() || undefined,
          receipt_url: receiptUrl.trim() || undefined,
        }),
      });

      const data = await res.json();
      if (!data.success) {
        throw new Error(data.error || "Payment failed to process");
      }

      setSelectedBillForPay(null);
      showToast(
        "Payment submitted successfully! Your receipt has been generated.",
      );
      fetchBills();
    } catch (err: any) {
      setPayError(err.message || "Payment processing error");
    } finally {
      setSubmittingPayment(false);
    }
  };

  const filteredBills = bills.filter((b) => {
    if (filter === "unpaid")
      return (
        b.status === "overdue" || b.status === "unpaid" || b.status === "posted"
      );
    if (filter === "paid") return b.status === "paid";
    return true;
  });

  return (
    <div className="p-4 sm:p-6 md:p-8 max-w-5xl mx-auto space-y-6">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-20 md:bottom-8 right-4 left-4 sm:left-auto sm:right-8 z-50 bg-gray-900 text-white px-5 py-3.5 rounded-2xl shadow-xl flex items-center gap-3 text-sm animate-in fade-in slide-in-from-bottom-4">
          <CheckCircle2 className="w-5 h-5 text-emerald-400 flex-shrink-0" />
          <span className="font-semibold">{toastMessage}</span>
        </div>
      )}

      {/* Page Header */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-black text-gray-900 tracking-tight">
          Bills & Statements
        </h1>
        <p className="text-xs sm:text-sm text-gray-500 mt-1 font-medium">
          Review your monthly rent, utility breakdowns, and official statement
          records.
        </p>
      </div>

      {/* Filter Tabs (Touch Friendly) */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1">
        <button
          onClick={() => setFilter("all")}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap active:scale-95 ${
            filter === "all"
              ? "bg-blue-600 text-white shadow-xs"
              : "bg-white text-gray-600 hover:bg-gray-100 border border-gray-200"
          }`}
        >
          All Statements ({bills.length})
        </button>
        <button
          onClick={() => setFilter("unpaid")}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap active:scale-95 ${
            filter === "unpaid"
              ? "bg-rose-600 text-white shadow-xs"
              : "bg-white text-gray-600 hover:bg-gray-100 border border-gray-200"
          }`}
        >
          To Pay ({summary.countUnpaid})
        </button>
        <button
          onClick={() => setFilter("paid")}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap active:scale-95 ${
            filter === "paid"
              ? "bg-emerald-600 text-white shadow-xs"
              : "bg-white text-gray-600 hover:bg-gray-100 border border-gray-200"
          }`}
        >
          Paid History ({summary.countPaid})
        </button>
      </div>

      {/* Bill Card List (Mobile-First Cards) */}
      {loading ? (
        <div className="bg-white rounded-3xl p-16 text-center text-gray-400 flex flex-col items-center justify-center border border-gray-200">
          <Loader2 className="w-8 h-8 animate-spin text-blue-600 mb-3" />
          <span className="text-sm font-medium">
            Loading billing records...
          </span>
        </div>
      ) : filteredBills.length > 0 ? (
        <div className="space-y-4">
          {filteredBills.map((b) => {
            const isExpanded = expandedBillId === b.id;
            const hasReadings =
              b.meter_readings &&
              (b.meter_readings.electricity || b.meter_readings.water);
            const isPaid = b.status === "paid";
            const isOverdue = b.status === "overdue";

            return (
              <div
                key={b.id}
                className={`bg-white rounded-3xl border transition-all overflow-hidden ${
                  isOverdue
                    ? "border-rose-200 shadow-xs"
                    : "border-gray-200 shadow-xs"
                }`}
              >
                {/* Main Card Header */}
                <div className="p-5 sm:p-6 flex flex-col gap-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-base sm:text-lg font-black text-gray-900">
                          {b.billing_type_name}
                        </span>
                        <span className="text-xs font-mono font-bold text-gray-500 bg-gray-100 px-2 py-0.5 rounded-lg">
                          {b.reference_number}
                        </span>
                      </div>
                      <p className="text-xs text-gray-400 mt-1 flex items-center gap-1.5 font-medium">
                        <Repeat className="w-3.5 h-3.5 text-blue-500" />
                        <span>{b.billing_cycle || "Monthly"}</span>
                      </p>
                    </div>

                    <div>
                      <span
                        className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-extrabold ${
                          isPaid
                            ? "bg-emerald-100 text-emerald-800"
                            : isOverdue
                              ? "bg-rose-100 text-rose-800"
                              : "bg-amber-100 text-amber-800"
                        }`}
                      >
                        {isPaid ? (
                          <CheckCircle2 className="w-3.5 h-3.5 mr-1" />
                        ) : (
                          <Clock className="w-3.5 h-3.5 mr-1" />
                        )}
                        {isPaid ? "Paid" : isOverdue ? "Overdue" : "Unpaid"}
                      </span>
                    </div>
                  </div>

                  {/* Financial Metrics & Due Date */}
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-3 pt-3 border-t border-gray-100">
                    <div>
                      <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400 block">
                        Due Date
                      </span>
                      <span
                        className={`text-sm font-bold ${isOverdue ? "text-rose-600" : "text-gray-700"}`}
                      >
                        {b.due_date} {isOverdue && "(Past Due)"}
                      </span>
                    </div>

                    <div className="text-left sm:text-right">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400 block">
                        Total Amount
                      </span>
                      <span className="text-xl sm:text-2xl font-black text-gray-900">
                        ₱{" "}
                        {b.amount.toLocaleString("en-US", {
                          minimumFractionDigits: 2,
                        })}
                      </span>
                      {b.amount_paid > 0 && !isPaid && (
                        <span className="text-xs text-emerald-600 font-semibold block">
                          ₱{" "}
                          {b.amount_paid.toLocaleString("en-US", {
                            minimumFractionDigits: 2,
                          })}{" "}
                          settled
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Quick Action Buttons on Mobile */}
                  <div className="flex items-center gap-2 pt-2">
                    {/* Temporarily commented out: Pay Online feature not supported yet
                    {!isPaid && (
                      <button
                        onClick={() => openPaymentModal(b)}
                        className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-bold py-2.5 px-4 rounded-xl text-xs sm:text-sm flex items-center justify-center gap-2 shadow-xs transition-colors active:scale-95"
                      >
                        <CreditCard className="w-4 h-4" />
                        <span>Pay Online</span>
                      </button>
                    )}
                    */}

                    <a
                      href={`/api/tenant/bills/${b.id}/pdf`}
                      target="_blank"
                      rel="noreferrer"
                      className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold py-2.5 px-4 rounded-xl text-xs sm:text-sm flex items-center justify-center gap-2 transition-colors active:scale-95"
                    >
                      <Download className="w-4 h-4" />
                      <span>PDF Statement</span>
                    </a>

                    <button
                      onClick={() =>
                        setExpandedBillId(isExpanded ? null : b.id)
                      }
                      className="p-2.5 rounded-xl border border-gray-200 text-gray-500 hover:bg-gray-100 transition-colors"
                      title="Toggle Details"
                    >
                      {isExpanded ? (
                        <ChevronUp className="w-4 h-4" />
                      ) : (
                        <ChevronDown className="w-4 h-4" />
                      )}
                    </button>
                  </div>
                </div>

                {/* Expanded Details Section (Submeters, Extra Charges, Collections) */}
                {isExpanded && (
                  <div className="bg-gray-50/90 border-t border-gray-100 p-5 sm:p-6 space-y-4 animate-in fade-in duration-150">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-gray-500">
                      Statement Breakdown
                    </h4>

                    {/* Base Rent & Submeters */}
                    <div className="space-y-2 bg-white rounded-2xl p-4 border border-gray-200 text-xs">
                      <div className="flex justify-between py-1 text-gray-600">
                        <span>Base Rent</span>
                        <span className="font-bold text-gray-900">
                          ₱{" "}
                          {b.base_amount.toLocaleString("en-US", {
                            minimumFractionDigits: 2,
                          })}
                        </span>
                      </div>

                      {/* Electricity Submeter */}
                      {b.meter_readings?.electricity && (
                        <div className="py-2 border-t border-gray-100">
                          <div className="flex items-center justify-between text-gray-800 font-bold mb-1">
                            <span className="flex items-center gap-1 text-amber-600">
                              <Zap className="w-3.5 h-3.5" />
                              Electricity Submeter
                            </span>
                            <span>
                              ₱{" "}
                              {Number(
                                b.meter_readings.electricity.amount || 0,
                              ).toLocaleString("en-US", {
                                minimumFractionDigits: 2,
                              })}
                            </span>
                          </div>
                          <div className="text-[11px] text-gray-500 flex justify-between">
                            <span>
                              Prev: {b.meter_readings.electricity.previous} •
                              Curr: {b.meter_readings.electricity.current}
                            </span>
                            <span>
                              {Number(
                                b.meter_readings.electricity.consumption || 0,
                              ).toFixed(1)}{" "}
                              kWh @ ₱
                              {b.meter_readings.electricity.rate_per_unit}/kWh
                            </span>
                          </div>
                        </div>
                      )}

                      {/* Water Submeter */}
                      {b.meter_readings?.water && (
                        <div className="py-2 border-t border-gray-100">
                          <div className="flex items-center justify-between text-gray-800 font-bold mb-1">
                            <span className="flex items-center gap-1 text-blue-600">
                              <Droplet className="w-3.5 h-3.5" />
                              Water Submeter
                            </span>
                            <span>
                              ₱{" "}
                              {Number(
                                b.meter_readings.water.amount || 0,
                              ).toLocaleString("en-US", {
                                minimumFractionDigits: 2,
                              })}
                            </span>
                          </div>
                          <div className="text-[11px] text-gray-500 flex justify-between">
                            <span>
                              Prev: {b.meter_readings.water.previous} • Curr:{" "}
                              {b.meter_readings.water.current}
                            </span>
                            <span>
                              {Number(
                                b.meter_readings.water.consumption || 0,
                              ).toFixed(1)}{" "}
                              cu.m @ ₱{b.meter_readings.water.rate_per_unit}
                              /cu.m
                            </span>
                          </div>
                        </div>
                      )}

                      {/* Tax & Fees */}
                      {b.tax_amount > 0 && (
                        <div className="flex justify-between py-1 border-t border-gray-100 text-gray-600">
                          <span>Tax</span>
                          <span className="font-bold text-gray-900">
                            ₱{" "}
                            {b.tax_amount.toLocaleString("en-US", {
                              minimumFractionDigits: 2,
                            })}
                          </span>
                        </div>
                      )}

                      {b.transfer_fee > 0 && (
                        <div className="flex justify-between py-1 border-t border-gray-100 text-gray-600">
                          <span>Transfer / Processing Fee</span>
                          <span className="font-bold text-gray-900">
                            ₱{" "}
                            {b.transfer_fee.toLocaleString("en-US", {
                              minimumFractionDigits: 2,
                            })}
                          </span>
                        </div>
                      )}

                      {b.late_fee_applied > 0 && (
                        <div className="flex justify-between py-1 border-t border-gray-100 text-rose-600">
                          <span>Late Fee</span>
                          <span className="font-bold">
                            ₱{" "}
                            {b.late_fee_applied.toLocaleString("en-US", {
                              minimumFractionDigits: 2,
                            })}
                          </span>
                        </div>
                      )}

                      <div className="flex justify-between py-2 border-t border-gray-200 font-extrabold text-gray-900 text-sm">
                        <span>Total Due</span>
                        <span>
                          ₱{" "}
                          {b.amount.toLocaleString("en-US", {
                            minimumFractionDigits: 2,
                          })}
                        </span>
                      </div>
                    </div>

                    {/* Payment Transactions List for this bill */}
                    {b.collections && b.collections.length > 0 && (
                      <div className="space-y-2">
                        <h4 className="text-xs font-bold uppercase tracking-wider text-gray-500">
                          Settlement History
                        </h4>
                        <div className="space-y-2">
                          {b.collections.map((col) => (
                            <div
                              key={col.id}
                              className="bg-white rounded-2xl p-3 border border-gray-200 flex justify-between items-center text-xs"
                            >
                              <div>
                                <span className="font-bold text-gray-900 capitalize block">
                                  {col.payment_method.replace("_", " ")}{" "}
                                  {col.bank_name ? `(${col.bank_name})` : ""}
                                </span>
                                <span className="text-[10px] text-gray-400">
                                  {col.collected_date} • Ref:{" "}
                                  {col.payment_reference || "N/A"}
                                </span>
                              </div>
                              <div className="text-right">
                                <span className="font-bold text-emerald-700 block">
                                  + ₱{" "}
                                  {col.amount_paid.toLocaleString("en-US", {
                                    minimumFractionDigits: 2,
                                  })}
                                </span>
                                <span className="text-[10px] text-emerald-600 font-semibold uppercase">
                                  {col.status}
                                </span>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      ) : (
        <div className="bg-white rounded-3xl p-16 text-center border border-dashed border-gray-200">
          <Receipt className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <h3 className="text-base font-bold text-gray-800">
            No Statements Found
          </h3>
          <p className="text-xs text-gray-500 mt-1 max-w-sm mx-auto">
            {filter === "unpaid"
              ? "You have zero unpaid statements. Your account is completely settled!"
              : "There are no billing records matching your filter."}
          </p>
        </div>
      )}

      {/* Interactive Mobile-First Payment Modal (Temporarily commented out: online payment not supported yet)
      {selectedBillForPay && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white rounded-t-3xl sm:rounded-3xl max-w-lg w-full shadow-2xl overflow-hidden border border-gray-200 max-h-[90vh] flex flex-col">
            <div className="px-6 py-4 bg-gray-50 border-b border-gray-200 flex justify-between items-center">
              <div>
                <h3 className="text-base font-bold text-gray-900">Settle Statement</h3>
                <p className="text-xs text-gray-500">{selectedBillForPay.reference_number} • {selectedBillForPay.billing_type_name}</p>
              </div>
              <button 
                onClick={() => setSelectedBillForPay(null)}
                className="text-gray-400 hover:text-gray-600 p-1 rounded-xl"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handlePaymentSubmit} className="p-6 space-y-4 overflow-y-auto">
              {payError && (
                <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-2xl text-rose-700 text-xs font-semibold flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />
                  <span>{payError}</span>
                </div>
              )}

              <div className="bg-blue-50/70 rounded-2xl p-4 border border-blue-100 text-center">
                <span className="text-[10px] uppercase font-bold text-blue-600 tracking-wider block">Remaining Balance</span>
                <span className="text-3xl font-black text-blue-900 block mt-0.5">
                  ₱ {selectedBillForPay.remaining_balance.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                </span>
                <span className="text-[11px] text-blue-700 mt-1 block">Due Date: {selectedBillForPay.due_date}</span>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">
                  Select Payment Method
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => { setPaymentMethod('gcash'); setBankName('GCash'); }}
                    className={`p-3 rounded-2xl border text-left transition-all ${
                      paymentMethod === 'gcash'
                        ? 'border-blue-600 bg-blue-50/50 text-blue-900 font-bold ring-2 ring-blue-500/20'
                        : 'border-gray-200 hover:bg-gray-50 text-gray-700'
                    }`}
                  >
                    <span className="text-xs font-bold block">GCash</span>
                    <span className="text-[10px] text-gray-500 block">E-Wallet Direct</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => { setPaymentMethod('bank_transfer'); setBankName('BDO'); }}
                    className={`p-3 rounded-2xl border text-left transition-all ${
                      paymentMethod === 'bank_transfer'
                        ? 'border-blue-600 bg-blue-50/50 text-blue-900 font-bold ring-2 ring-blue-500/20'
                        : 'border-gray-200 hover:bg-gray-50 text-gray-700'
                    }`}
                  >
                    <span className="text-xs font-bold block">Bank Transfer</span>
                    <span className="text-[10px] text-gray-500 block">InstaPay / PESONet</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => { setPaymentMethod('qr'); setBankName('QR Ph'); }}
                    className={`p-3 rounded-2xl border text-left transition-all ${
                      paymentMethod === 'qr'
                        ? 'border-blue-600 bg-blue-50/50 text-blue-900 font-bold ring-2 ring-blue-500/20'
                        : 'border-gray-200 hover:bg-gray-50 text-gray-700'
                    }`}
                  >
                    <span className="text-xs font-bold block">QR Ph</span>
                    <span className="text-[10px] text-gray-500 block">Scan Universal QR</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => { setPaymentMethod('advance_credit'); setBankName('Advance Deposit'); }}
                    disabled={summary.advancedBalance <= 0}
                    className={`p-3 rounded-2xl border text-left transition-all ${
                      summary.advancedBalance <= 0
                        ? 'opacity-40 cursor-not-allowed border-gray-100 bg-gray-50'
                        : paymentMethod === 'advance_credit'
                        ? 'border-blue-600 bg-blue-50/50 text-blue-900 font-bold ring-2 ring-blue-500/20'
                        : 'border-gray-200 hover:bg-gray-50 text-gray-700'
                    }`}
                  >
                    <span className="text-xs font-bold block">Deposit Credit</span>
                    <span className="text-[10px] text-gray-500 block">
                      Avail: ₱{summary.advancedBalance.toFixed(0)}
                    </span>
                  </button>
                </div>
              </div>

              <div className="bg-gray-50 rounded-2xl p-3.5 border border-gray-200 text-xs space-y-1">
                <span className="font-bold text-gray-700 block">Property Payment Account:</span>
                {paymentMethod === 'gcash' && (
                  <p className="text-gray-600 text-[11px]">
                    Send payment to Sylvia Property GCash: <strong className="text-gray-900 font-mono">0917-888-9999</strong> (Sylvia Admin). Then enter the 13-digit Reference Number below.
                  </p>
                )}
                {paymentMethod === 'bank_transfer' && (
                  <p className="text-gray-600 text-[11px]">
                    BDO Unibank Acct: <strong className="text-gray-900 font-mono">0012-3456-7890</strong> (Sylvia Real Estate Mgt).
                  </p>
                )}
                {paymentMethod === 'qr' && (
                  <p className="text-gray-600 text-[11px]">
                    Scan the official Sylvia QR Ph displayed at the leasing counter or in your contract pack.
                  </p>
                )}
                {paymentMethod === 'advance_credit' && (
                  <p className="text-gray-600 text-[11px]">
                    This will immediately deduct from your advance deposit credits balance.
                  </p>
                )}
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                  Amount to Pay (₱) *
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={payAmount}
                  onChange={(e) => setPayAmount(e.target.value)}
                  className="w-full px-3.5 py-2.5 border border-gray-300 rounded-xl text-base font-bold text-gray-900 focus:ring-2 focus:ring-blue-500 outline-none"
                  required
                />
              </div>

              {paymentMethod !== 'advance_credit' && (
                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                    Payment Reference Number *
                  </label>
                  <input
                    type="text"
                    value={paymentReference}
                    onChange={(e) => setPaymentReference(e.target.value)}
                    placeholder="e.g. 100234871923"
                    className="w-full px-3.5 py-2.5 border border-gray-300 rounded-xl text-sm font-semibold text-gray-900 focus:ring-2 focus:ring-blue-500 outline-none font-mono"
                    required
                  />
                  <span className="text-[10px] text-gray-400 mt-1 block">From your payment confirmation SMS or receipt</span>
                </div>
              )}

              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                  Proof of Payment / Receipt URL (Optional)
                </label>
                <input
                  type="url"
                  value={receiptUrl}
                  onChange={(e) => setReceiptUrl(e.target.value)}
                  placeholder="https://example.com/receipt.jpg"
                  className="w-full px-3.5 py-2.5 border border-gray-300 rounded-xl text-xs text-gray-900 focus:ring-2 focus:ring-blue-500 outline-none"
                />
              </div>

              <div className="pt-3 flex justify-end gap-3 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setSelectedBillForPay(null)}
                  className="px-4 py-2.5 text-sm font-semibold text-gray-700 hover:bg-gray-100 rounded-xl transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingPayment}
                  className="px-6 py-2.5 text-sm font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl transition-all shadow-sm flex items-center gap-2 disabled:opacity-50 active:scale-95"
                >
                  {submittingPayment && <Loader2 className="w-4 h-4 animate-spin" />}
                  <span>Submit Payment</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      */}
    </div>
  );
}
