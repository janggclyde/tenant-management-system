"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  CreditCard,
  Home,
  FileText,
  AlertCircle,
  CheckCircle2,
  Loader2,
  Calendar,
  Building2,
  Wrench,
  Bell,
  ArrowRight,
  ShieldCheck,
  ChevronRight,
  Sparkles,
  Zap,
  Clock,
} from "lucide-react";

interface TenantOverviewData {
  tenant: {
    id: number;
    name: string;
    email: string;
    phone: string;
    unit_id: number;
    unit_number: string;
    building_id: number;
    building_name: string;
    building_address: string;
    monthly_rent: number;
    move_in_date: string | null;
    lease_expiry: string | null;
    document_url: string | null;
  } | null;
  outstandingBill: {
    id: number;
    billing_type_name: string;
    amount: number;
    amount_paid: number;
    due_date: string;
    billing_cycle: string;
    status: "paid" | "overdue" | "unpaid";
    meter_readings?: any;
  } | null;
  totalOutstandingAmount: number;
  recentBills: Array<{
    id: number;
    billing_type_name: string;
    amount: number;
    amount_paid: number;
    due_date: string;
    billing_cycle: string;
    status: "paid" | "overdue" | "unpaid";
  }>;
  advancedBalance: number;
  maintenance: {
    activeCount: number;
    latestTicket: {
      id: number;
      title: string;
      description: string;
      status: "open" | "in_progress" | "resolved";
      created_at: string;
    } | null;
  };
  announcements: Array<{
    id: number;
    title: string;
    content: string;
    created_at: string;
  }>;
  unreadNotificationsCount: number;
}

export default function TenantDashboard() {
  const [data, setData] = useState<TenantOverviewData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchTenantData() {
      try {
        const res = await fetch("/api/tenant/overview");
        const json = await res.json();
        if (json.success) {
          setData(json);
        }
      } catch (err) {
        console.error("Failed to load tenant overview", err);
      } finally {
        setLoading(false);
      }
    }
    fetchTenantData();
  }, []);

  const tenant = data?.tenant;
  const outstandingBill = data?.outstandingBill;
  const totalOutstanding =
    data?.totalOutstandingAmount ??
    (outstandingBill ? outstandingBill.amount : 0);
  const recentBills = data?.recentBills || [];
  const maintenance = data?.maintenance;
  const announcements = data?.announcements || [];

  return (
    <div className="p-4 sm:p-6 md:p-8 max-w-5xl mx-auto space-y-5 sm:space-y-6">
      {/* Mobile-First Header */}
      <div className="bg-white rounded-3xl p-5 sm:p-6 shadow-xs border border-gray-100 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1 text-[11px] font-bold text-blue-700 bg-blue-50 px-2.5 py-1 rounded-full border border-blue-100">
              <Sparkles className="w-3 h-3 text-blue-600" />
              Resident Portal
            </span>
            {tenant?.lease_expiry && (
              <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-100">
                <ShieldCheck className="w-3 h-3 text-emerald-600" />
                Active Lease
              </span>
            )}
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900 mt-2 tracking-tight">
            {loading ? "Welcome" : `Hi, ${tenant?.name || "Resident"} 👋`}
          </h1>
          <p className="text-gray-500 text-sm mt-1 flex items-center gap-1.5 font-medium">
            <Building2 className="w-4 h-4 text-blue-500 flex-shrink-0" />
            <span>
              {tenant
                ? `${tenant.unit_number} • ${tenant.building_name}`
                : "Apartment Resident"}
            </span>
          </p>
        </div>

        {/* {tenant?.monthly_rent && (
          <div className="bg-gray-50/80 rounded-2xl px-4 py-3 border border-gray-100 text-left sm:text-right w-full sm:w-auto">
            <span className="text-[10px] uppercase tracking-wider font-bold text-gray-400 block">Monthly Base Rent</span>
            <span className="text-lg font-extrabold text-gray-900">
              ₱ {Number(tenant.monthly_rent).toLocaleString('en-US', { minimumFractionDigits: 2 })}
            </span>
          </div>
        )} */}
      </div>

      {/* Main Billing Alert Banner (Mobile-First Touch Card) */}
      {loading ? (
        <div className="bg-white rounded-3xl p-8 border border-gray-100 flex items-center justify-center min-h-[160px]">
          <Loader2 className="w-6 h-6 animate-spin text-blue-600 mr-2" />
          <span className="text-sm text-gray-500 font-medium">
            Loading your account status...
          </span>
        </div>
      ) : totalOutstanding > 0 ? (
        <div className="bg-gradient-to-br from-amber-500 via-rose-500 to-rose-600 rounded-3xl p-6 sm:p-7 text-white shadow-md shadow-rose-500/10 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/20 backdrop-blur-md text-xs font-bold uppercase tracking-wider text-white">
              <AlertCircle className="w-4 h-4" />
              <span>Statement Due</span>
            </div>
            <p className="text-xs text-rose-100 font-medium">
              {outstandingBill
                ? `${outstandingBill.billing_type_name} (${outstandingBill.billing_cycle})`
                : "Pending Statements"}
            </p>
            <div>
              <span className="text-xs text-rose-100/90 font-medium block">
                Total Balance Due
              </span>
              <span className="text-3xl sm:text-4xl font-black tracking-tight text-white">
                ₱{" "}
                {totalOutstanding.toLocaleString("en-US", {
                  minimumFractionDigits: 2,
                })}
              </span>
            </div>
            {outstandingBill?.due_date && (
              <p className="text-xs text-rose-100 font-medium flex items-center gap-1">
                <Clock className="w-3.5 h-3.5" />
                <span>
                  Due by:{" "}
                  <strong className="text-white font-bold">
                    {outstandingBill.due_date}
                  </strong>
                </span>
              </p>
            )}
          </div>
          <div className="w-full md:w-auto flex flex-col sm:flex-row gap-2.5">
            <Link
              href="/tenant/bills"
              className="w-full sm:w-auto text-center px-6 py-3.5 rounded-2xl font-bold text-sm bg-white text-rose-600 hover:bg-rose-50 transition-all shadow-sm flex items-center justify-center gap-2 active:scale-95"
            >
              <FileText className="w-4 h-4" />
              <span>View Statements</span>
            </Link>
          </div>
        </div>
      ) : (
        <div className="bg-gradient-to-br from-emerald-500 to-teal-700 rounded-3xl p-6 sm:p-7 text-white shadow-md shadow-emerald-600/10 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div className="space-y-1.5">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/20 backdrop-blur-md text-xs font-bold uppercase tracking-wider text-white">
              <CheckCircle2 className="w-4 h-4" />
              <span>All Caught Up</span>
            </div>
            <h3 className="text-xl sm:text-2xl font-black tracking-tight">
              Zero Outstanding Balance
            </h3>
            <p className="text-xs text-emerald-100 max-w-md">
              Your account is in good standing with zero overdue balance. Thank
              you for keeping your rent up to date!
            </p>
          </div>
          <div className="bg-white/15 backdrop-blur-md px-5 py-3 rounded-2xl border border-white/20">
            <span className="text-[10px] uppercase font-bold text-emerald-100 block">
              Current Amount Due
            </span>
            <span className="text-2xl font-black text-white">₱ 0.00</span>
          </div>
        </div>
      )}

      {/* Quick Action Touch Buttons (Mobile-First 4-Card Grid) */}
      <div className="space-y-2">
        <h2 className="text-xs font-bold uppercase tracking-wider text-gray-400 px-1">
          Quick Actions
        </h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <Link
            href="/tenant/bills"
            className="bg-white p-4 rounded-2xl border border-gray-200 hover:border-blue-500 hover:shadow-xs transition-all flex flex-col items-center text-center group active:scale-95"
          >
            <div className="w-11 h-11 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center mb-2 group-hover:bg-blue-600 group-hover:text-white transition-colors">
              <FileText className="w-5 h-5" />
            </div>
            <span className="text-xs font-bold text-gray-800">Statements</span>
            <span className="text-[10px] text-gray-400 mt-0.5">
              Rent & Utilities
            </span>
          </Link>

          <Link
            href="/tenant/maintenance"
            className="bg-white p-4 rounded-2xl border border-gray-200 hover:border-amber-500 hover:shadow-xs transition-all flex flex-col items-center text-center group active:scale-95"
          >
            <div className="w-11 h-11 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center mb-2 group-hover:bg-amber-600 group-hover:text-white transition-colors">
              <Wrench className="w-5 h-5" />
            </div>
            <span className="text-xs font-bold text-gray-800">
              Request Repair
            </span>
            <span className="text-[10px] text-gray-400 mt-0.5">
              Submit maintenance
            </span>
          </Link>

          <Link
            href="/tenant/announcements"
            className="bg-white p-4 rounded-2xl border border-gray-200 hover:border-purple-500 hover:shadow-xs transition-all flex flex-col items-center text-center group active:scale-95 relative"
          >
            <div className="w-11 h-11 rounded-2xl bg-purple-50 text-purple-600 flex items-center justify-center mb-2 group-hover:bg-purple-600 group-hover:text-white transition-colors">
              <Bell className="w-5 h-5" />
            </div>
            <span className="text-xs font-bold text-gray-800">Notices</span>
            <span className="text-[10px] text-gray-400 mt-0.5">
              Building advisories
            </span>
          </Link>

          <Link
            href="/tenant/profile"
            className="bg-white p-4 rounded-2xl border border-gray-200 hover:border-teal-500 hover:shadow-xs transition-all flex flex-col items-center text-center group active:scale-95"
          >
            <div className="w-11 h-11 rounded-2xl bg-teal-50 text-teal-600 flex items-center justify-center mb-2 group-hover:bg-teal-600 group-hover:text-white transition-colors">
              <Home className="w-5 h-5" />
            </div>
            <span className="text-xs font-bold text-gray-800">Lease Info</span>
            <span className="text-[10px] text-gray-400 mt-0.5">
              Contract details
            </span>
          </Link>
        </div>
      </div>

      {/* Building Announcements Widget */}
      {announcements.length > 0 && (
        <div className="bg-white rounded-3xl p-5 sm:p-6 border border-gray-200 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center">
                <Bell className="w-4 h-4" />
              </div>
              <h2 className="text-sm sm:text-base font-bold text-gray-900">
                Building Notice
              </h2>
            </div>
            <Link
              href="/tenant/announcements"
              className="text-xs font-semibold text-blue-600 hover:underline flex items-center gap-0.5"
            >
              <span>All Notices</span>
              <ChevronRight className="w-3 h-3" />
            </Link>
          </div>

          <div className="bg-blue-50/50 rounded-2xl p-4 border border-blue-100/80 space-y-1.5">
            <div className="flex items-center justify-between gap-2">
              <h3 className="text-sm font-bold text-gray-900">
                {announcements[0].title}
              </h3>
              <span className="text-[10px] font-semibold text-gray-400 whitespace-nowrap">
                {new Date(announcements[0].created_at).toLocaleDateString(
                  "en-US",
                  { month: "short", day: "numeric" },
                )}
              </span>
            </div>
            <p className="text-xs text-gray-600 line-clamp-2 leading-relaxed">
              {announcements[0].content}
            </p>
          </div>
        </div>
      )}

      {/* Active Maintenance Alert if any */}
      {maintenance?.latestTicket && (
        <div className="bg-white rounded-3xl p-5 sm:p-6 border border-gray-200 shadow-xs">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Wrench className="w-4 h-4 text-amber-600" />
              <h2 className="text-sm font-bold text-gray-900">
                Recent Maintenance Request
              </h2>
            </div>
            <Link
              href="/tenant/maintenance"
              className="text-xs font-semibold text-blue-600 hover:underline"
            >
              View All
            </Link>
          </div>

          <div className="flex items-center justify-between bg-gray-50 rounded-2xl p-3.5 border border-gray-100">
            <div className="min-w-0 pr-3">
              <div className="flex items-center gap-2 mb-1">
                <span
                  className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                    maintenance.latestTicket.status === "resolved"
                      ? "bg-emerald-100 text-emerald-800"
                      : maintenance.latestTicket.status === "in_progress"
                        ? "bg-amber-100 text-amber-800"
                        : "bg-blue-100 text-blue-800"
                  }`}
                >
                  {maintenance.latestTicket.status.replace("_", " ")}
                </span>
                <span className="text-[11px] text-gray-400 font-medium">
                  #{maintenance.latestTicket.id}
                </span>
              </div>
              <p className="text-sm font-bold text-gray-900 truncate">
                {maintenance.latestTicket.title}
              </p>
            </div>
            <Link
              href="/tenant/maintenance"
              className="text-gray-400 hover:text-gray-600 p-1 flex-shrink-0"
            >
              <ChevronRight className="w-5 h-5" />
            </Link>
          </div>
        </div>
      )}

      {/* Recent Bills (Mobile-First Card List) */}
      <div className="bg-white rounded-3xl p-5 sm:p-6 border border-gray-200 shadow-xs space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-base font-bold text-gray-900">Recent Bills</h2>
            <p className="text-xs text-gray-400 mt-0.5">
              Your recent rent & utility statements
            </p>
          </div>
          <Link
            href="/tenant/bills"
            className="text-xs font-bold text-blue-600 hover:text-blue-700 flex items-center gap-1"
          >
            <span>View All</span>
            <ArrowRight className="w-3 h-3" />
          </Link>
        </div>

        {loading ? (
          <div className="py-12 text-center text-gray-400 flex flex-col items-center justify-center">
            <Loader2 className="w-6 h-6 animate-spin text-blue-600 mb-2" />
            <span className="text-xs">Loading billing records...</span>
          </div>
        ) : recentBills.length > 0 ? (
          <div className="space-y-3">
            {recentBills.map((b) => (
              <div
                key={b.id}
                className="bg-gray-50/70 hover:bg-gray-100/70 rounded-2xl p-4 border border-gray-100 transition-all flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3"
              >
                <div className="space-y-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-gray-900 truncate">
                      {b.billing_type_name}
                    </span>
                    <span className="text-[10px] text-gray-400 font-mono bg-white px-1.5 py-0.5 rounded border border-gray-200">
                      INV-{String(b.id).padStart(5, "0")}
                    </span>
                  </div>
                  <p className="text-xs text-gray-500 font-medium">
                    Due: {b.due_date} • {b.billing_cycle}
                  </p>
                </div>

                <div className="flex items-center justify-between sm:justify-end gap-3 w-full sm:w-auto pt-2 sm:pt-0 border-t sm:border-t-0 border-gray-200">
                  <div className="text-left sm:text-right">
                    <span className="text-sm sm:text-base font-extrabold text-gray-900 block">
                      ₱{" "}
                      {b.amount.toLocaleString("en-US", {
                        minimumFractionDigits: 2,
                      })}
                    </span>
                  </div>
                  <div>
                    <span
                      className={`inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-bold ${
                        b.status === "paid"
                          ? "bg-emerald-100 text-emerald-800"
                          : b.status === "overdue"
                            ? "bg-rose-100 text-rose-800"
                            : "bg-amber-100 text-amber-800"
                      }`}
                    >
                      {b.status === "paid"
                        ? "Paid"
                        : b.status === "overdue"
                          ? "Overdue"
                          : "Unpaid"}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="py-12 text-center text-gray-500 border border-dashed border-gray-200 rounded-2xl bg-gray-50/50">
            <FileText className="w-10 h-10 text-gray-300 mx-auto mb-2" />
            <h4 className="text-sm font-bold text-gray-800">
              No Billing Records Found
            </h4>
            <p className="text-xs text-gray-400 mt-1 max-w-sm mx-auto">
              You do not have any pending or historical billing statements on
              file.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
