"use client";

import { useState, useEffect } from "react";
import {
  Settings,
  CreditCard,
  Mail,
  Palette,
  ShieldCheck,
  Activity,
  Save,
  RefreshCw,
  CheckCircle2,
  AlertCircle,
  Eye,
  EyeOff,
  Send,
  Zap,
  Database,
  Building2,
  Clock,
  FileUp,
  X,
  AlertTriangle,
  Bell,
  Check,
  FileText,
  Wrench,
  UserCheck,
  Receipt,
} from "lucide-react";
import {
  SystemSettingsRecord,
  NotificationEventsConfig,
} from "@/lib/settingsStore";

type ActiveTab = "payment" | "email" | "branding" | "security" | "diagnostics";

export default function SuperAdminSettingsPage() {
  const [activeTab, setActiveTab] = useState<ActiveTab>("email");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  const [saveSuccessMessage, setSaveSuccessMessage] = useState<string | null>(
    null,
  );

  // Form State
  const [formData, setFormData] = useState<SystemSettingsRecord>({
    id: 1,
    hitpay_api_key: "",
    hitpay_salt: "",
    hitpay_mode: "sandbox",
    currency: "PHP",
    tax_rate_default: 12.0,
    email_provider: "smtp",
    email_api_key: "",
    smtp_host: "",
    smtp_port: 505,
    smtp_user: "",
    default_sender_email: "",
    default_sender_name: "",
    email_signature: "",
    admin_alert_email: "",
    notification_events: {
      notify_billing_posted: true,
      notify_payment_received: true,
      notify_lease_contract: true,
      notify_maintenance_ticket: true,
      notify_subscription_renewal: true,
      send_welcome_email: true,
    },
    platform_name: "",
    support_email: "",
    support_phone: "",
    default_logo: "/assets/default-logo.png",
    default_colors: {
      primary: "#2563EB",
      secondary: "#10B981",
      accent: "#8B5CF6",
      sidebar_theme: "light",
    },
    maintenance_mode: false,
    allow_customer_registration: true,
    session_timeout_hours: 24,
    max_file_upload_mb: 10,
  });

  const [initialData, setInitialData] = useState<SystemSettingsRecord | null>(
    null,
  );

  // Key Visibility Toggles
  const [showHitpayKey, setShowHitpayKey] = useState(false);
  const [showHitpaySalt, setShowHitpaySalt] = useState(false);
  const [showEmailKey, setShowEmailKey] = useState(false);

  // Diagnostic Test States
  const [testEmailRecipient, setTestEmailRecipient] = useState("");
  const [testingEmail, setTestingEmail] = useState(false);
  const [emailTestResult, setEmailTestResult] = useState<{
    success: boolean;
    message: string;
    timestamp?: string;
  } | null>(null);

  const [testingHitpay, setTestingHitpay] = useState(false);
  const [hitpayTestResult, setHitpayTestResult] = useState<{
    success: boolean;
    message: string;
    timestamp?: string;
  } | null>(null);

  // Toast State
  const [toastMessage, setToastMessage] = useState<{
    text: string;
    type: "success" | "error";
  } | null>(null);

  const showToast = (text: string, type: "success" | "error" = "success") => {
    setToastMessage({ text, type });
    setTimeout(() => {
      setToastMessage(null);
    }, 4000);
  };

  // Fetch Settings
  const fetchSettings = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/super-admin/settings");
      const data = await res.json();
      if (data.success && data.settings) {
        setFormData(data.settings);
        setInitialData(data.settings);
        if (data.settings.support_email) {
          setTestEmailRecipient(data.settings.support_email);
        }
      }
    } catch (err: any) {
      showToast(err.message || "Failed to load global settings", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let isMounted = true;
    const load = async () => {
      try {
        const res = await fetch("/api/super-admin/settings");
        const data = await res.json();
        if (isMounted && data.success && data.settings) {
          setFormData(data.settings);
          setInitialData(data.settings);
          if (data.settings.support_email) {
            setTestEmailRecipient(data.settings.support_email);
          }
        }
      } catch (err: any) {
        if (isMounted)
          showToast(err.message || "Failed to load settings", "error");
      } finally {
        if (isMounted) setLoading(false);
      }
    };
    load();
    return () => {
      isMounted = false;
    };
  }, []);

  const handleChange = (field: keyof SystemSettingsRecord, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    setHasChanges(true);
    setSaveSuccessMessage(null);
  };

  const handleNotificationEventToggle = (
    eventKey: keyof NotificationEventsConfig,
  ) => {
    setFormData((prev) => ({
      ...prev,
      notification_events: {
        ...prev.notification_events,
        [eventKey]: !prev.notification_events[eventKey],
      },
    }));
    setHasChanges(true);
    setSaveSuccessMessage(null);
  };

  const handleColorChange = (
    colorKey: "primary" | "secondary" | "accent",
    value: string,
  ) => {
    setFormData((prev) => ({
      ...prev,
      default_colors: {
        ...prev.default_colors,
        [colorKey]: value,
      },
    }));
    setHasChanges(true);
    setSaveSuccessMessage(null);
  };

  // Save Settings
  const handleSaveSettings = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setSaving(true);
    setSaveSuccessMessage(null);
    try {
      const res = await fetch("/api/super-admin/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });
      const data = await res.json();
      if (!data.success)
        throw new Error(data.error || "Failed to update settings");

      setFormData(data.settings);
      setInitialData(data.settings);
      setHasChanges(false);
      const msg =
        data.message || "Settings and email configurations saved successfully!";
      setSaveSuccessMessage(msg);
      showToast(msg, "success");
    } catch (err: any) {
      showToast(err.message || "Error saving settings", "error");
    } finally {
      setSaving(false);
    }
  };

  // Discard Changes
  const handleDiscardChanges = () => {
    if (initialData) {
      setFormData(initialData);
      setHasChanges(false);
      setSaveSuccessMessage(null);
      showToast("Unsaved changes discarded.", "success");
    }
  };

  // Test Email Action
  const handleTestEmail = async () => {
    if (!testEmailRecipient.trim()) {
      showToast(
        "Please specify a destination email address for testing.",
        "error",
      );
      return;
    }
    setTestingEmail(true);
    setEmailTestResult(null);
    try {
      const res = await fetch("/api/super-admin/settings/test-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ recipient: testEmailRecipient.trim() }),
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.error || "Test email failed");

      setEmailTestResult({
        success: true,
        message: data.result.message,
        timestamp: data.result.timestamp,
      });
      showToast("Test email dispatched successfully!", "success");
    } catch (err: any) {
      setEmailTestResult({
        success: false,
        message: err.message || "Email dispatch failed",
      });
      showToast(err.message || "Email test failed", "error");
    } finally {
      setTestingEmail(false);
    }
  };

  // Test HitPay Gateway Action
  const handleTestHitpay = async () => {
    setTestingHitpay(true);
    setHitpayTestResult(null);
    try {
      const res = await fetch("/api/super-admin/settings/test-hitpay", {
        method: "POST",
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.error || "Gateway test failed");

      setHitpayTestResult({
        success: true,
        message: data.result.message,
        timestamp: data.result.timestamp,
      });
      showToast("HitPay API credentials verified!", "success");
    } catch (err: any) {
      setHitpayTestResult({
        success: false,
        message: err.message || "Connection failed",
      });
      showToast(err.message || "HitPay connection test failed", "error");
    } finally {
      setTestingHitpay(false);
    }
  };

  const navTabs = [
    {
      id: "email",
      name: "Email & Notifications",
      icon: Mail,
      tag: "SMTP/Resend",
    },
    {
      id: "payment",
      name: "Payment & Checkout",
      icon: CreditCard,
      tag: "HitPay",
    },
    {
      id: "branding",
      name: "Branding & Identity",
      icon: Palette,
      tag: "White-Label",
    },
    {
      id: "security",
      name: "Security & Access Policy",
      icon: ShieldCheck,
      tag: "Policy",
    },
    {
      id: "diagnostics",
      name: "System Diagnostics",
      icon: Activity,
      tag: "Live",
    },
  ];

  return (
    <div className="p-4 md:p-8 max-w-6xl mx-auto space-y-6 pb-28">
      {/* TOAST NOTIFICATION */}
      {toastMessage && (
        <div
          className={`fixed bottom-6 right-6 z-50 flex items-center gap-3 px-4 py-3 rounded-2xl shadow-xl border text-sm font-medium animate-in slide-in-from-bottom-4 duration-200 ${
            toastMessage.type === "success"
              ? "bg-emerald-900 text-white border-emerald-700 shadow-emerald-900/20"
              : "bg-red-900 text-white border-red-700 shadow-red-900/20"
          }`}
        >
          {toastMessage.type === "success" ? (
            <CheckCircle2 className="w-5 h-5 text-emerald-400 flex-shrink-0" />
          ) : (
            <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0" />
          )}
          <span>{toastMessage.text}</span>
          <button
            onClick={() => setToastMessage(null)}
            className="ml-2 text-gray-300 hover:text-white cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* TOP HEADER */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-6 rounded-2xl shadow-xs border border-gray-200/80">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-blue-50 rounded-xl text-blue-600">
              <Settings className="w-6 h-6" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900 tracking-tight">
              Global Platform Settings
            </h1>
          </div>
          <p className="text-sm text-gray-500 mt-1">
            Configure automated transactional email credentials, event
            notification triggers, payment gateways, and system policies.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={fetchSettings}
            className="p-2.5 text-gray-600 bg-gray-50 hover:bg-gray-100 border border-gray-200 rounded-xl transition-colors flex items-center gap-2 text-sm font-medium cursor-pointer"
            title="Reload Settings"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
            <span className="hidden sm:inline">Refresh</span>
          </button>

          <button
            onClick={() => handleSaveSettings()}
            disabled={saving}
            className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-semibold shadow-xs transition-all flex items-center gap-2 hover:shadow-md active:scale-98 cursor-pointer disabled:opacity-50"
          >
            {saving ? (
              <RefreshCw className="w-4 h-4 animate-spin" />
            ) : (
              <Save className="w-4 h-4" />
            )}
            <span>{saving ? "Saving..." : "Save Settings"}</span>
          </button>
        </div>
      </div>

      {/* SUCCESS CONFIRMATION BANNER */}
      {saveSuccessMessage && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl flex items-center justify-between text-emerald-800 text-xs font-semibold animate-in fade-in">
          <div className="flex items-center gap-2.5">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0" />
            <span>{saveSuccessMessage}</span>
          </div>
          <button
            onClick={() => setSaveSuccessMessage(null)}
            className="text-emerald-600 hover:text-emerald-800 p-1 cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* MAINTENANCE MODE ALERT BANNER (If Active) */}
      {formData.maintenance_mode && (
        <div className="p-4 bg-amber-50 border border-amber-200 rounded-2xl flex items-center justify-between text-amber-800 text-xs font-semibold animate-in fade-in">
          <div className="flex items-center gap-2.5">
            <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0" />
            <div>
              <p className="font-bold text-amber-900 text-sm">
                Platform Maintenance Mode is Currently ACTIVE
              </p>
              <p className="text-amber-700 font-normal mt-0.5">
                Non-admin subscribers and tenants will receive a maintenance
                notice during login.
              </p>
            </div>
          </div>
          <button
            onClick={() => handleChange("maintenance_mode", false)}
            className="px-3 py-1.5 bg-amber-200 hover:bg-amber-300 text-amber-900 rounded-xl font-bold transition-colors cursor-pointer"
          >
            Disable Now
          </button>
        </div>
      )}

      {/* NAVIGATION TABS */}
      <div className="flex border-b border-gray-200 overflow-x-auto gap-1 bg-white p-2 rounded-2xl shadow-xs border border-gray-200/80">
        {navTabs.map((tab) => {
          const isActive = activeTab === tab.id;
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as ActiveTab)}
              className={`flex items-center gap-2 px-4 py-3 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
                isActive
                  ? "bg-blue-50 text-blue-700 shadow-xs"
                  : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
              }`}
            >
              <Icon
                className={`w-4 h-4 ${isActive ? "text-blue-600" : "text-gray-400"}`}
              />
              <span>{tab.name}</span>
            </button>
          );
        })}
      </div>

      {/* TAB 1: EMAIL & NOTIFICATIONS */}
      {activeTab === "email" && (
        <div className="space-y-6 animate-in fade-in duration-200">
          {/* Email Server Configuration */}
          <div className="bg-white rounded-2xl shadow-xs border border-gray-200/80 p-6 space-y-6">
            <div className="border-b border-gray-100 pb-4 flex justify-between items-center">
              <div>
                <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                  <Mail className="w-5 h-5 text-blue-600" />
                  <span>Transactional Email Provider Credentials</span>
                </h3>
                <p className="text-xs text-gray-500 mt-0.5">
                  Configure SMTP server, Resend API, or SendGrid credentials for
                  platform emails.
                </p>
              </div>
            </div>

            {/* Provider Selection */}
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-2">
                Select Email Service Provider
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {[
                  {
                    id: "smtp",
                    label: "Custom SMTP Server",
                    sub: "Gmail, Postmark, AWS SES, Hostinger",
                  },
                  {
                    id: "resend",
                    label: "Resend API",
                    sub: "Modern transactional email service",
                  },
                  {
                    id: "sendgrid",
                    label: "SendGrid API",
                    sub: "Twilio SendGrid email relay",
                  },
                ].map((p) => (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => handleChange("email_provider", p.id)}
                    className={`p-3.5 rounded-xl border text-left transition-all cursor-pointer ${
                      formData.email_provider === p.id
                        ? "border-blue-600 bg-blue-50/50 ring-2 ring-blue-500/20"
                        : "border-gray-200 bg-white hover:bg-gray-50"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-xs text-gray-900">
                        {p.label}
                      </span>
                      {formData.email_provider === p.id && (
                        <CheckCircle2 className="w-4 h-4 text-blue-600" />
                      )}
                    </div>
                    <p className="text-[11px] text-gray-500 mt-1">{p.sub}</p>
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* API Key / SMTP Password */}
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-gray-700">
                  {formData.email_provider === "smtp"
                    ? "SMTP Password / App Password *"
                    : "API Secret Key *"}
                </label>
                <div className="relative">
                  <input
                    type={showEmailKey ? "text" : "password"}
                    value={formData.email_api_key}
                    onChange={(e) =>
                      handleChange("email_api_key", e.target.value)
                    }
                    placeholder={
                      formData.email_provider === "smtp"
                        ? "Enter SMTP password"
                        : "re_xxxxxxxxxxxxxxxxxxxxxx"
                    }
                    className="w-full pl-3.5 pr-10 py-2.5 border border-gray-300 rounded-xl text-sm font-mono text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                  />
                  <button
                    type="button"
                    onClick={() => setShowEmailKey(!showEmailKey)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600 cursor-pointer"
                  >
                    {showEmailKey ? (
                      <EyeOff className="w-4 h-4" />
                    ) : (
                      <Eye className="w-4 h-4" />
                    )}
                  </button>
                </div>
              </div>

              {/* SMTP Host */}
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-gray-700">
                  SMTP Host Server
                </label>
                <input
                  type="text"
                  value={formData.smtp_host}
                  onChange={(e) => handleChange("smtp_host", e.target.value)}
                  placeholder="smtp.resend.com or smtp.gmail.com"
                  className="w-full px-3.5 py-2.5 border border-gray-300 rounded-xl text-sm text-gray-900 focus:ring-2 focus:ring-blue-500 outline-none"
                />
              </div>

              {/* SMTP Port */}
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-gray-700">
                  SMTP Port
                </label>
                <input
                  type="number"
                  value={formData.smtp_port}
                  onChange={(e) =>
                    handleChange(
                      "smtp_port",
                      parseInt(e.target.value, 10) || 587,
                    )
                  }
                  placeholder="587 (TLS) or 465 (SSL)"
                  className="w-full px-3.5 py-2.5 border border-gray-300 rounded-xl text-sm text-gray-900 focus:ring-2 focus:ring-blue-500 outline-none"
                />
              </div>

              {/* SMTP User */}
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-gray-700">
                  SMTP Username / Account
                </label>
                <input
                  type="text"
                  value={formData.smtp_user}
                  onChange={(e) => handleChange("smtp_user", e.target.value)}
                  placeholder="resend or apikey or your email"
                  className="w-full px-3.5 py-2.5 border border-gray-300 rounded-xl text-sm text-gray-900 focus:ring-2 focus:ring-blue-500 outline-none"
                />
              </div>

              {/* Default Sender Email */}
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-gray-700">
                  Default Sender Email Address *
                </label>
                <input
                  type="email"
                  value={formData.default_sender_email}
                  onChange={(e) =>
                    handleChange("default_sender_email", e.target.value)
                  }
                  placeholder="notifications@apartmanager.com"
                  className="w-full px-3.5 py-2.5 border border-gray-300 rounded-xl text-sm text-gray-900 focus:ring-2 focus:ring-blue-500 outline-none"
                />
              </div>

              {/* Sender Name */}
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-gray-700">
                  Sender Display Name
                </label>
                <input
                  type="text"
                  value={formData.default_sender_name}
                  onChange={(e) =>
                    handleChange("default_sender_name", e.target.value)
                  }
                  placeholder="ApartManager Platform"
                  className="w-full px-3.5 py-2.5 border border-gray-300 rounded-xl text-sm text-gray-900 focus:ring-2 focus:ring-blue-500 outline-none"
                />
              </div>
            </div>

            {/* Email Signature & Admin CC Alert */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-gray-700">
                  Default Email Signature / Footer Note
                </label>
                <textarea
                  rows={3}
                  value={formData.email_signature || ""}
                  onChange={(e) =>
                    handleChange("email_signature", e.target.value)
                  }
                  placeholder="ApartManager SaaS - Simplifying Residential Property Management."
                  className="w-full px-3.5 py-2.5 border border-gray-300 rounded-xl text-xs text-gray-900 focus:ring-2 focus:ring-blue-500 outline-none"
                />
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-gray-700">
                  Admin CC / System Alert Recipient
                </label>
                <input
                  type="email"
                  value={formData.admin_alert_email || ""}
                  onChange={(e) =>
                    handleChange("admin_alert_email", e.target.value)
                  }
                  placeholder="alerts@apartmanager.com"
                  className="w-full px-3.5 py-2.5 border border-gray-300 rounded-xl text-sm text-gray-900 focus:ring-2 focus:ring-blue-500 outline-none"
                />
                <p className="text-[11px] text-gray-400">
                  Receives duplicate notifications for critical tenant and
                  billing events.
                </p>
              </div>
            </div>
          </div>

          {/* Automated Notification Event Triggers */}
          <div className="bg-white rounded-2xl shadow-xs border border-gray-200/80 p-6 space-y-6">
            <div className="border-b border-gray-100 pb-4">
              <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                <Bell className="w-5 h-5 text-indigo-600" />
                <span>Automated Event Notification Triggers</span>
              </h3>
              <p className="text-xs text-gray-500 mt-0.5">
                Enable or disable automated email triggers across the platform
                lifecycle.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Trigger 1: Billing Invoices */}
              <div
                onClick={() =>
                  handleNotificationEventToggle("notify_billing_posted")
                }
                className={`p-4 rounded-2xl border transition-all cursor-pointer flex items-start gap-3.5 ${
                  formData.notification_events?.notify_billing_posted
                    ? "border-blue-300 bg-blue-50/40 ring-1 ring-blue-500/20"
                    : "border-gray-200 bg-gray-50/60 opacity-80"
                }`}
              >
                <div
                  className={`p-2.5 rounded-xl ${formData.notification_events?.notify_billing_posted ? "bg-blue-600 text-white" : "bg-gray-200 text-gray-500"}`}
                >
                  <FileText className="w-5 h-5" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-bold text-gray-900">
                      Tenant Billing & Invoice Posting
                    </h4>
                    <input
                      type="checkbox"
                      checked={
                        !!formData.notification_events?.notify_billing_posted
                      }
                      onChange={() => {}}
                      className="rounded text-blue-600 focus:ring-blue-500"
                    />
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    Send automated statement of account and rent dues notices
                    when monthly bills are posted.
                  </p>
                </div>
              </div>

              {/* Trigger 2: Payment Receipts */}
              <div
                onClick={() =>
                  handleNotificationEventToggle("notify_payment_received")
                }
                className={`p-4 rounded-2xl border transition-all cursor-pointer flex items-start gap-3.5 ${
                  formData.notification_events?.notify_payment_received
                    ? "border-emerald-300 bg-emerald-50/40 ring-1 ring-emerald-500/20"
                    : "border-gray-200 bg-gray-50/60 opacity-80"
                }`}
              >
                <div
                  className={`p-2.5 rounded-xl ${formData.notification_events?.notify_payment_received ? "bg-emerald-600 text-white" : "bg-gray-200 text-gray-500"}`}
                >
                  <Receipt className="w-5 h-5" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-bold text-gray-900">
                      Official Payment Receipts
                    </h4>
                    <input
                      type="checkbox"
                      checked={
                        !!formData.notification_events?.notify_payment_received
                      }
                      onChange={() => {}}
                      className="rounded text-emerald-600 focus:ring-emerald-500"
                    />
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    Automatically dispatch official payment receipts with HitPay
                    reference codes to tenants upon collection.
                  </p>
                </div>
              </div>

              {/* Trigger 3: Lease Contracts */}
              <div
                onClick={() =>
                  handleNotificationEventToggle("notify_lease_contract")
                }
                className={`p-4 rounded-2xl border transition-all cursor-pointer flex items-start gap-3.5 ${
                  formData.notification_events?.notify_lease_contract
                    ? "border-indigo-300 bg-indigo-50/40 ring-1 ring-indigo-500/20"
                    : "border-gray-200 bg-gray-50/60 opacity-80"
                }`}
              >
                <div
                  className={`p-2.5 rounded-xl ${formData.notification_events?.notify_lease_contract ? "bg-indigo-600 text-white" : "bg-gray-200 text-gray-500"}`}
                >
                  <Building2 className="w-5 h-5" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-bold text-gray-900">
                      Digital Lease Agreement Delivery
                    </h4>
                    <input
                      type="checkbox"
                      checked={
                        !!formData.notification_events?.notify_lease_contract
                      }
                      onChange={() => {}}
                      className="rounded text-indigo-600 focus:ring-indigo-500"
                    />
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    Send digital tenancy agreement copies and assigned unit
                    lease terms to tenants upon onboarding.
                  </p>
                </div>
              </div>

              {/* Trigger 4: Maintenance Tickets */}
              <div
                onClick={() =>
                  handleNotificationEventToggle("notify_maintenance_ticket")
                }
                className={`p-4 rounded-2xl border transition-all cursor-pointer flex items-start gap-3.5 ${
                  formData.notification_events?.notify_maintenance_ticket
                    ? "border-amber-300 bg-amber-50/40 ring-1 ring-amber-500/20"
                    : "border-gray-200 bg-gray-50/60 opacity-80"
                }`}
              >
                <div
                  className={`p-2.5 rounded-xl ${formData.notification_events?.notify_maintenance_ticket ? "bg-amber-600 text-white" : "bg-gray-200 text-gray-500"}`}
                >
                  <Wrench className="w-5 h-5" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-bold text-gray-900">
                      Maintenance Request Alerts
                    </h4>
                    <input
                      type="checkbox"
                      checked={
                        !!formData.notification_events
                          ?.notify_maintenance_ticket
                      }
                      onChange={() => {}}
                      className="rounded text-amber-600 focus:ring-amber-500"
                    />
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    Alert property manager administrators immediately when
                    tenants file repair and maintenance requests.
                  </p>
                </div>
              </div>

              {/* Trigger 5: Plan Renewals */}
              <div
                onClick={() =>
                  handleNotificationEventToggle("notify_subscription_renewal")
                }
                className={`p-4 rounded-2xl border transition-all cursor-pointer flex items-start gap-3.5 ${
                  formData.notification_events?.notify_subscription_renewal
                    ? "border-purple-300 bg-purple-50/40 ring-1 ring-purple-500/20"
                    : "border-gray-200 bg-gray-50/60 opacity-80"
                }`}
              >
                <div
                  className={`p-2.5 rounded-xl ${formData.notification_events?.notify_subscription_renewal ? "bg-purple-600 text-white" : "bg-gray-200 text-gray-500"}`}
                >
                  <CreditCard className="w-5 h-5" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-bold text-gray-900">
                      SaaS Plan Renewal Reminders
                    </h4>
                    <input
                      type="checkbox"
                      checked={
                        !!formData.notification_events
                          ?.notify_subscription_renewal
                      }
                      onChange={() => {}}
                      className="rounded text-purple-600 focus:ring-purple-500"
                    />
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    Send upcoming billing notifications to property managers 7
                    days prior to monthly SaaS renewal.
                  </p>
                </div>
              </div>

              {/* Trigger 6: Welcome Credentials */}
              <div
                onClick={() =>
                  handleNotificationEventToggle("send_welcome_email")
                }
                className={`p-4 rounded-2xl border transition-all cursor-pointer flex items-start gap-3.5 ${
                  formData.notification_events?.send_welcome_email
                    ? "border-blue-300 bg-blue-50/40 ring-1 ring-blue-500/20"
                    : "border-gray-200 bg-gray-50/60 opacity-80"
                }`}
              >
                <div
                  className={`p-2.5 rounded-xl ${formData.notification_events?.send_welcome_email ? "bg-blue-600 text-white" : "bg-gray-200 text-gray-500"}`}
                >
                  <UserCheck className="w-5 h-5" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-bold text-gray-900">
                      Onboarding Welcome Credentials
                    </h4>
                    <input
                      type="checkbox"
                      checked={
                        !!formData.notification_events?.send_welcome_email
                      }
                      onChange={() => {}}
                      className="rounded text-blue-600 focus:ring-blue-500"
                    />
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    Dispatch initial portal login credentials and password setup
                    instructions on new account creation.
                  </p>
                </div>
              </div>
            </div>

            {/* Direct Save Button inside Tab */}
            <div className="pt-4 border-t border-gray-100 flex items-center justify-between">
              <span className="text-xs text-gray-500">
                {hasChanges
                  ? "⚠️ You have unsaved changes in email & notifications."
                  : "✅ All notification settings are up to date."}
              </span>
              <button
                type="button"
                onClick={() => handleSaveSettings()}
                disabled={saving}
                className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl shadow-xs transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50"
              >
                {saving ? (
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Save className="w-3.5 h-3.5" />
                )}
                <span>
                  {saving ? "Saving..." : "Save Email & Notification Settings"}
                </span>
              </button>
            </div>
          </div>

          {/* Test Email Dispatcher Card */}
          <div className="bg-white rounded-2xl shadow-xs border border-gray-200/80 p-6 space-y-4">
            <div className="flex items-center gap-2">
              <Send className="w-5 h-5 text-blue-600" />
              <h4 className="text-sm font-bold text-gray-900 uppercase tracking-wider">
                Live Test Email Dispatch Diagnostic
              </h4>
            </div>
            <p className="text-xs text-gray-500">
              Send an immediate test delivery to verify your SMTP or Resend
              credentials and sender identity.
            </p>

            <div className="flex flex-col sm:flex-row gap-3 pt-1">
              <input
                type="email"
                value={testEmailRecipient}
                onChange={(e) => setTestEmailRecipient(e.target.value)}
                placeholder="Enter email address (e.g. admin@building.com)..."
                className="flex-1 px-3.5 py-2.5 border border-gray-300 rounded-xl text-sm bg-white text-gray-900 focus:ring-2 focus:ring-blue-500 outline-none"
              />
              <button
                type="button"
                onClick={handleTestEmail}
                disabled={testingEmail}
                className="px-5 py-2.5 bg-gray-900 hover:bg-gray-800 text-white text-xs font-bold rounded-xl transition-all shadow-xs flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
              >
                {testingEmail && (
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                )}
                <span>
                  {testingEmail ? "Dispatching..." : "Dispatch Test Email"}
                </span>
              </button>
            </div>

            {emailTestResult && (
              <div
                className={`mt-3 p-3.5 rounded-xl border text-xs font-medium flex items-start gap-2.5 animate-in fade-in ${
                  emailTestResult.success
                    ? "bg-emerald-50 text-emerald-800 border-emerald-200"
                    : "bg-red-50 text-red-800 border-red-200"
                }`}
              >
                {emailTestResult.success ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0 mt-0.5" />
                ) : (
                  <AlertCircle className="w-4 h-4 text-red-600 flex-shrink-0 mt-0.5" />
                )}
                <div>
                  <p className="font-bold">
                    {emailTestResult.success
                      ? "Email Delivered Successfully"
                      : "Email Delivery Failed"}
                  </p>
                  <p className="mt-0.5">{emailTestResult.message}</p>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 2: PAYMENT & CHECKOUT */}
      {activeTab === "payment" && (
        <div className="space-y-6 animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl shadow-xs border border-gray-200/80 p-6 space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 border-b border-gray-100 pb-4">
              <div>
                <h3 className="text-lg font-bold text-gray-900">
                  HitPay Payment Gateway Integration
                </h3>
                <p className="text-xs text-gray-500 mt-0.5">
                  Process SaaS subscription payments, tenant billing, GCash,
                  Maya, and credit card checkouts.
                </p>
              </div>
              <button
                type="button"
                onClick={handleTestHitpay}
                disabled={testingHitpay}
                className="px-3.5 py-2 bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 rounded-xl text-xs font-semibold transition-colors flex items-center gap-1.5 cursor-pointer"
              >
                <Zap
                  className={`w-3.5 h-3.5 ${testingHitpay ? "animate-spin" : ""}`}
                />
                <span>
                  {testingHitpay ? "Verifying Gateway..." : "Test Connection"}
                </span>
              </button>
            </div>

            {/* Test Result Message */}
            {hitpayTestResult && (
              <div
                className={`p-4 rounded-xl border text-xs font-medium flex items-start gap-2.5 ${
                  hitpayTestResult.success
                    ? "bg-emerald-50 text-emerald-800 border-emerald-200"
                    : "bg-red-50 text-red-800 border-red-200"
                }`}
              >
                {hitpayTestResult.success ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0 mt-0.5" />
                ) : (
                  <AlertCircle className="w-4 h-4 text-red-600 flex-shrink-0 mt-0.5" />
                )}
                <div>
                  <p className="font-bold">
                    {hitpayTestResult.success
                      ? "Gateway Verified"
                      : "Gateway Verification Failed"}
                  </p>
                  <p className="mt-0.5">{hitpayTestResult.message}</p>
                </div>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* API Key */}
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-gray-700">
                  HitPay API Key (Server-Side)
                </label>
                <div className="relative">
                  <input
                    type={showHitpayKey ? "text" : "password"}
                    value={formData.hitpay_api_key}
                    onChange={(e) =>
                      handleChange("hitpay_api_key", e.target.value)
                    }
                    placeholder="pk_test_xxxxxxxxxxxxxxxxxxxxxxxx"
                    className="w-full pl-3.5 pr-10 py-2.5 border border-gray-300 rounded-xl text-sm font-mono text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                  />
                  <button
                    type="button"
                    onClick={() => setShowHitpayKey(!showHitpayKey)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600 cursor-pointer"
                  >
                    {showHitpayKey ? (
                      <EyeOff className="w-4 h-4" />
                    ) : (
                      <Eye className="w-4 h-4" />
                    )}
                  </button>
                </div>
                <p className="text-[11px] text-gray-400">
                  Obtain from your HitPay Dashboard &gt; Settings &gt; API Keys.
                </p>
              </div>

              {/* Salt Secret */}
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-gray-700">
                  Webhook Salt / Secret Key
                </label>
                <div className="relative">
                  <input
                    type={showHitpaySalt ? "text" : "password"}
                    value={formData.hitpay_salt}
                    onChange={(e) =>
                      handleChange("hitpay_salt", e.target.value)
                    }
                    placeholder="salt_sec_xxxxxxxxxxxxxxxxxxxxxxxx"
                    className="w-full pl-3.5 pr-10 py-2.5 border border-gray-300 rounded-xl text-sm font-mono text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                  />
                  <button
                    type="button"
                    onClick={() => setShowHitpaySalt(!showHitpaySalt)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600 cursor-pointer"
                  >
                    {showHitpaySalt ? (
                      <EyeOff className="w-4 h-4" />
                    ) : (
                      <Eye className="w-4 h-4" />
                    )}
                  </button>
                </div>
                <p className="text-[11px] text-gray-400">
                  Used to cryptographically verify payment webhook signatures.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 pt-2">
              {/* Environment Mode */}
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1.5">
                  Gateway Environment
                </label>
                <select
                  value={formData.hitpay_mode}
                  onChange={(e) => handleChange("hitpay_mode", e.target.value)}
                  className="w-full px-3.5 py-2.5 border border-gray-300 rounded-xl text-sm font-semibold text-gray-900 focus:ring-2 focus:ring-blue-500 outline-none cursor-pointer"
                >
                  <option value="sandbox">Sandbox (Testing / Testnet)</option>
                  <option value="production">
                    Production (Live Transactions)
                  </option>
                </select>
              </div>

              {/* Currency */}
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1.5">
                  Primary Billing Currency
                </label>
                <select
                  value={formData.currency}
                  onChange={(e) => handleChange("currency", e.target.value)}
                  className="w-full px-3.5 py-2.5 border border-gray-300 rounded-xl text-sm font-semibold text-gray-900 focus:ring-2 focus:ring-blue-500 outline-none cursor-pointer"
                >
                  <option value="PHP">PHP - Philippine Peso (₱)</option>
                  <option value="USD">USD - US Dollar ($)</option>
                  <option value="SGD">SGD - Singapore Dollar (S$)</option>
                </select>
              </div>

              {/* Tax Rate % */}
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1.5">
                  Default VAT / Tax Rate (%)
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  max="100"
                  value={formData.tax_rate_default}
                  onChange={(e) =>
                    handleChange(
                      "tax_rate_default",
                      parseFloat(e.target.value) || 0,
                    )
                  }
                  className="w-full px-3.5 py-2.5 border border-gray-300 rounded-xl text-sm font-semibold text-gray-900 focus:ring-2 focus:ring-blue-500 outline-none"
                />
              </div>
            </div>

            {/* Direct Save Button inside Tab */}
            <div className="pt-4 border-t border-gray-100 flex justify-end">
              <button
                type="button"
                onClick={() => handleSaveSettings()}
                disabled={saving}
                className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl shadow-xs transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50"
              >
                {saving ? (
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Save className="w-3.5 h-3.5" />
                )}
                <span>{saving ? "Saving..." : "Save Payment Settings"}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: BRANDING & IDENTITY */}
      {activeTab === "branding" && (
        <div className="space-y-6 animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl shadow-xs border border-gray-200/80 p-6 space-y-6">
            <div className="border-b border-gray-100 pb-4">
              <h3 className="text-lg font-bold text-gray-900">
                Platform White-Label Branding
              </h3>
              <p className="text-xs text-gray-500 mt-0.5">
                Customize global platform identity, application name, support
                contact, and theme color palette.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Platform Name */}
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-gray-700">
                  Platform SaaS Application Name
                </label>
                <input
                  type="text"
                  value={formData.platform_name}
                  onChange={(e) =>
                    handleChange("platform_name", e.target.value)
                  }
                  placeholder="ApartManager SaaS"
                  className="w-full px-3.5 py-2.5 border border-gray-300 rounded-xl text-sm text-gray-900 focus:ring-2 focus:ring-blue-500 outline-none"
                />
              </div>

              {/* Logo URL */}
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-gray-700">
                  Default Logo URL / Asset Path
                </label>
                <input
                  type="text"
                  value={formData.default_logo}
                  onChange={(e) => handleChange("default_logo", e.target.value)}
                  placeholder="/assets/default-logo.png"
                  className="w-full px-3.5 py-2.5 border border-gray-300 rounded-xl text-sm text-gray-900 focus:ring-2 focus:ring-blue-500 outline-none"
                />
              </div>

              {/* Support Email */}
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-gray-700">
                  Customer Support Email
                </label>
                <input
                  type="email"
                  value={formData.support_email}
                  onChange={(e) =>
                    handleChange("support_email", e.target.value)
                  }
                  placeholder="support@apartmanager.com"
                  className="w-full px-3.5 py-2.5 border border-gray-300 rounded-xl text-sm text-gray-900 focus:ring-2 focus:ring-blue-500 outline-none"
                />
              </div>

              {/* Support Phone */}
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-gray-700">
                  Customer Support Hotline
                </label>
                <input
                  type="text"
                  value={formData.support_phone}
                  onChange={(e) =>
                    handleChange("support_phone", e.target.value)
                  }
                  placeholder="+63 917 888 9999"
                  className="w-full px-3.5 py-2.5 border border-gray-300 rounded-xl text-sm text-gray-900 focus:ring-2 focus:ring-blue-500 outline-none"
                />
              </div>
            </div>

            {/* Color Palette */}
            <div className="pt-2 space-y-3">
              <h4 className="text-xs font-bold text-gray-700 uppercase tracking-wider">
                Platform Color Theme Tokens
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {/* Primary Color */}
                <div className="p-4 bg-gray-50 rounded-xl border border-gray-200/80 flex items-center justify-between">
                  <div>
                    <span className="text-xs font-bold text-gray-800 block">
                      Primary Brand Color
                    </span>
                    <span className="text-xs font-mono text-gray-500">
                      {formData.default_colors?.primary || "#2563EB"}
                    </span>
                  </div>
                  <input
                    type="color"
                    value={formData.default_colors?.primary || "#2563EB"}
                    onChange={(e) =>
                      handleColorChange("primary", e.target.value)
                    }
                    className="w-10 h-10 rounded-xl border-none cursor-pointer"
                  />
                </div>

                {/* Secondary Color */}
                <div className="p-4 bg-gray-50 rounded-xl border border-gray-200/80 flex items-center justify-between">
                  <div>
                    <span className="text-xs font-bold text-gray-800 block">
                      Secondary Accent Color
                    </span>
                    <span className="text-xs font-mono text-gray-500">
                      {formData.default_colors?.secondary || "#10B981"}
                    </span>
                  </div>
                  <input
                    type="color"
                    value={formData.default_colors?.secondary || "#10B981"}
                    onChange={(e) =>
                      handleColorChange("secondary", e.target.value)
                    }
                    className="w-10 h-10 rounded-xl border-none cursor-pointer"
                  />
                </div>

                {/* Accent Color */}
                <div className="p-4 bg-gray-50 rounded-xl border border-gray-200/80 flex items-center justify-between">
                  <div>
                    <span className="text-xs font-bold text-gray-800 block">
                      Highlight / Badge Color
                    </span>
                    <span className="text-xs font-mono text-gray-500">
                      {formData.default_colors?.accent || "#8B5CF6"}
                    </span>
                  </div>
                  <input
                    type="color"
                    value={formData.default_colors?.accent || "#8B5CF6"}
                    onChange={(e) =>
                      handleColorChange("accent", e.target.value)
                    }
                    className="w-10 h-10 rounded-xl border-none cursor-pointer"
                  />
                </div>
              </div>
            </div>

            {/* Direct Save Button inside Tab */}
            <div className="pt-4 border-t border-gray-100 flex justify-end">
              <button
                type="button"
                onClick={() => handleSaveSettings()}
                disabled={saving}
                className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl shadow-xs transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50"
              >
                {saving ? (
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Save className="w-3.5 h-3.5" />
                )}
                <span>{saving ? "Saving..." : "Save Branding Settings"}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: SECURITY & ACCESS POLICY */}
      {activeTab === "security" && (
        <div className="space-y-6 animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl shadow-xs border border-gray-200/80 p-6 space-y-6">
            <div className="border-b border-gray-100 pb-4">
              <h3 className="text-lg font-bold text-gray-900">
                Platform Security & Access Policies
              </h3>
              <p className="text-xs text-gray-500 mt-0.5">
                Configure platform session timeouts, self-serve subscriber
                registration, and maintenance modes.
              </p>
            </div>

            <div className="space-y-4">
              {/* Maintenance Mode Toggle */}
              <div className="p-4 bg-gray-50 rounded-xl border border-gray-200/80 flex items-center justify-between">
                <div className="space-y-0.5 max-w-xl">
                  <h4 className="text-xs font-bold text-gray-900">
                    System Maintenance Mode
                  </h4>
                  <p className="text-xs text-gray-500">
                    When active, only Super Administrators can access the
                    platform. Subscribers and tenants will see a maintenance
                    message.
                  </p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.maintenance_mode}
                    onChange={(e) =>
                      handleChange("maintenance_mode", e.target.checked)
                    }
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-amber-600"></div>
                </label>
              </div>

              {/* Public Registration Toggle */}
              <div className="p-4 bg-gray-50 rounded-xl border border-gray-200/80 flex items-center justify-between">
                <div className="space-y-0.5 max-w-xl">
                  <h4 className="text-xs font-bold text-gray-900">
                    Public Customer Self-Registration
                  </h4>
                  <p className="text-xs text-gray-500">
                    Allow property managers to self-signup from the landing
                    page. If disabled, only superadmins can invite customers.
                  </p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.allow_customer_registration}
                    onChange={(e) =>
                      handleChange(
                        "allow_customer_registration",
                        e.target.checked,
                      )
                    }
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                </label>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 pt-2">
              {/* Session Timeout */}
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-gray-700">
                  Admin Session Inactivity Timeout (Hours)
                </label>
                <div className="relative">
                  <input
                    type="number"
                    min="1"
                    max="720"
                    value={formData.session_timeout_hours}
                    onChange={(e) =>
                      handleChange(
                        "session_timeout_hours",
                        parseInt(e.target.value, 10) || 24,
                      )
                    }
                    className="w-full pl-3.5 pr-10 py-2.5 border border-gray-300 rounded-xl text-sm font-semibold text-gray-900 focus:ring-2 focus:ring-blue-500 outline-none"
                  />
                  <Clock className="w-4 h-4 text-gray-400 absolute right-3 top-3 pointer-events-none" />
                </div>
              </div>

              {/* Max Upload Size */}
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-gray-700">
                  Maximum File Upload Size (MB)
                </label>
                <div className="relative">
                  <input
                    type="number"
                    min="1"
                    max="100"
                    value={formData.max_file_upload_mb}
                    onChange={(e) =>
                      handleChange(
                        "max_file_upload_mb",
                        parseInt(e.target.value, 10) || 10,
                      )
                    }
                    className="w-full pl-3.5 pr-10 py-2.5 border border-gray-300 rounded-xl text-sm font-semibold text-gray-900 focus:ring-2 focus:ring-blue-500 outline-none"
                  />
                  <FileUp className="w-4 h-4 text-gray-400 absolute right-3 top-3 pointer-events-none" />
                </div>
              </div>
            </div>

            {/* Direct Save Button inside Tab */}
            <div className="pt-4 border-t border-gray-100 flex justify-end">
              <button
                type="button"
                onClick={() => handleSaveSettings()}
                disabled={saving}
                className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl shadow-xs transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50"
              >
                {saving ? (
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Save className="w-3.5 h-3.5" />
                )}
                <span>{saving ? "Saving..." : "Save Security Settings"}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* TAB 5: SYSTEM DIAGNOSTICS */}
      {activeTab === "diagnostics" && (
        <div className="space-y-6 animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl shadow-xs border border-gray-200/80 p-6 space-y-6">
            <div className="border-b border-gray-100 pb-4">
              <h3 className="text-lg font-bold text-gray-900">
                System Diagnostics & Infrastructure Health
              </h3>
              <p className="text-xs text-gray-500 mt-0.5">
                Real-time operational status of backend services, microservices,
                and external API gateways.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="p-4 bg-gray-50 rounded-xl border border-gray-200/80">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-gray-500">
                    Database Engine
                  </span>
                  <Database className="w-4 h-4 text-blue-600" />
                </div>
                <p className="text-base font-bold text-gray-900 mt-2">
                  MySQL via Sequelize
                </p>
                <p className="text-xs text-emerald-600 font-medium mt-0.5 flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-emerald-500" />
                  Connection Active & Synced
                </p>
              </div>

              <div className="p-4 bg-gray-50 rounded-xl border border-gray-200/80">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-gray-500">
                    HitPay Gateway
                  </span>
                  <CreditCard className="w-4 h-4 text-indigo-600" />
                </div>
                <p className="text-base font-bold text-gray-900 mt-2">
                  {formData.hitpay_mode.toUpperCase()}
                </p>
                <p className="text-xs text-blue-600 font-medium mt-0.5">
                  {formData.hitpay_api_key
                    ? "API Key Configured"
                    : "No Key Configured"}
                </p>
              </div>

              <div className="p-4 bg-gray-50 rounded-xl border border-gray-200/80">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-gray-500">
                    Email Gateway
                  </span>
                  <Mail className="w-4 h-4 text-purple-600" />
                </div>
                <p className="text-base font-bold text-gray-900 mt-2">
                  {formData.email_provider.toUpperCase()}
                </p>
                <p className="text-xs text-purple-600 font-medium mt-0.5">
                  Sender: {formData.default_sender_email || "Not configured"}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* FLOATING SAVE BAR (WHEN CHANGES EXIST) */}
      {hasChanges && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40 bg-gray-900 text-white px-6 py-3.5 rounded-2xl shadow-2xl border border-gray-700 flex items-center gap-6 animate-in slide-in-from-bottom-6 duration-200">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-400 animate-pulse" />
            <span className="text-xs font-semibold">
              You have unsaved changes
            </span>
          </div>

          <div className="flex items-center gap-2.5">
            <button
              onClick={handleDiscardChanges}
              className="px-3 py-1.5 text-xs font-semibold text-gray-300 hover:text-white hover:bg-gray-800 rounded-xl transition-colors cursor-pointer"
            >
              Discard
            </button>
            <button
              onClick={() => handleSaveSettings()}
              disabled={saving}
              className="px-4 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl transition-all shadow-xs flex items-center gap-1.5 cursor-pointer"
            >
              {saving && <RefreshCw className="w-3.5 h-3.5 animate-spin" />}
              <span>{saving ? "Saving..." : "Save Changes"}</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
