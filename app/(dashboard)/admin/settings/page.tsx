'use client';

import { useState, useEffect } from 'react';
import { 
  Building2, 
  Mail, 
  CreditCard, 
  Save, 
  RefreshCw, 
  CheckCircle2, 
  AlertCircle, 
  Send, 
  ShieldCheck, 
  Clock, 
  Bell, 
  X,
  FileText,
  Receipt,
  Wrench
} from 'lucide-react';
import { AdminSettingsRecord } from '@/lib/settingsStore';

export default function AdminSettingsPage() {
  const [activeTab, setActiveTab] = useState<'profile' | 'email' | 'billing'>('email');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);

  // Admin Settings State
  const [formData, setFormData] = useState<AdminSettingsRecord>({
    admin_id: 2,
    company_name: 'Sunrise Properties Management',
    contact_email: 'admin1@sunrise.com',
    support_phone: '+63 917 888 1234',
    company_address: 'Tower 1, Solar Way, Bonifacio Global City, Taguig',
    email_signature: 'Sunrise Properties - Quality Residential Management.',
    default_grace_period_days: 5,
    notification_events: {
      notify_billing_posted: true,
      notify_payment_received: true,
      notify_maintenance_ticket: true,
    },
    global_email_configured: true,
    global_email_provider: 'smtp',
    global_sender_email: 'sylvia@shieldhaus.uk'
  });

  const [initialData, setInitialData] = useState<AdminSettingsRecord | null>(null);

  // Test Email States
  const [testEmailRecipient, setTestEmailRecipient] = useState('');
  const [testingEmail, setTestingEmail] = useState(false);
  const [emailTestResult, setEmailTestResult] = useState<{ success: boolean; message: string; timestamp?: string } | null>(null);

  // Toast State
  const [toastMessage, setToastMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  const showToast = (text: string, type: 'success' | 'error' = 'success') => {
    setToastMessage({ text, type });
    setTimeout(() => {
      setToastMessage(null);
    }, 4000);
  };

  const fetchSettings = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/settings');
      const data = await res.json();
      if (data.success && data.settings) {
        setFormData(data.settings);
        setInitialData(data.settings);
        if (data.settings.contact_email) {
          setTestEmailRecipient(data.settings.contact_email);
        }
      }
    } catch (err: any) {
      showToast(err.message || 'Failed to load settings', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let isMounted = true;
    const load = async () => {
      try {
        const res = await fetch('/api/admin/settings');
        const data = await res.json();
        if (isMounted && data.success && data.settings) {
          setFormData(data.settings);
          setInitialData(data.settings);
          if (data.settings.contact_email) {
            setTestEmailRecipient(data.settings.contact_email);
          }
        }
      } catch (err: any) {
        if (isMounted) showToast(err.message || 'Failed to load settings', 'error');
      } finally {
        if (isMounted) setLoading(false);
      }
    };
    load();
    return () => { isMounted = false; };
  }, []);

  const handleChange = (field: keyof AdminSettingsRecord, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    setHasChanges(true);
  };

  const handleNotificationToggle = (eventKey: 'notify_billing_posted' | 'notify_payment_received' | 'notify_maintenance_ticket') => {
    setFormData(prev => ({
      ...prev,
      notification_events: {
        ...prev.notification_events,
        [eventKey]: !prev.notification_events[eventKey]
      }
    }));
    setHasChanges(true);
  };

  const handleSaveSettings = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setSaving(true);
    try {
      const res = await fetch('/api/admin/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.error || 'Failed to update preferences');

      setFormData(data.settings);
      setInitialData(data.settings);
      setHasChanges(false);
      showToast(data.message || 'Property management settings saved successfully!', 'success');
    } catch (err: any) {
      showToast(err.message || 'Error saving settings', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleTestEmail = async () => {
    if (!testEmailRecipient.trim()) {
      showToast('Please enter a recipient email address for testing.', 'error');
      return;
    }
    setTestingEmail(true);
    setEmailTestResult(null);
    try {
      const res = await fetch('/api/admin/settings/test-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ recipient: testEmailRecipient.trim() })
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.error || 'Test email failed');

      setEmailTestResult({
        success: true,
        message: data.message || 'Test email dispatched successfully!',
        timestamp: data.result?.timestamp
      });
      showToast('Test email sent successfully! Check your inbox.', 'success');
    } catch (err: any) {
      setEmailTestResult({
        success: false,
        message: err.message || 'Email delivery failed'
      });
      showToast(err.message || 'Email test failed', 'error');
    } finally {
      setTestingEmail(false);
    }
  };

  return (
    <div className="p-4 md:p-8 max-w-5xl mx-auto space-y-6 pb-24">
      {/* TOAST NOTIFICATION */}
      {toastMessage && (
        <div className={`fixed bottom-6 right-6 z-50 flex items-center gap-3 px-4 py-3 rounded-2xl shadow-xl border text-sm font-medium animate-in slide-in-from-bottom-4 duration-200 ${
          toastMessage.type === 'success' 
            ? 'bg-emerald-900 text-white border-emerald-700 shadow-emerald-900/20' 
            : 'bg-red-900 text-white border-red-700 shadow-red-900/20'
        }`}>
          {toastMessage.type === 'success' ? (
            <CheckCircle2 className="w-5 h-5 text-emerald-400 flex-shrink-0" />
          ) : (
            <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0" />
          )}
          <span>{toastMessage.text}</span>
          <button onClick={() => setToastMessage(null)} className="ml-2 text-gray-300 hover:text-white cursor-pointer">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* TOP HEADER */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-6 rounded-2xl shadow-xs border border-gray-200/80">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-blue-50 rounded-xl text-blue-600">
              <Building2 className="w-6 h-6" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Property Management Settings</h1>
          </div>
          <p className="text-sm text-gray-500 mt-1">
            Configure company branding, tenant transactional notifications, email verification, and billing defaults.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button 
            onClick={fetchSettings}
            className="p-2.5 text-gray-600 bg-gray-50 hover:bg-gray-100 border border-gray-200 rounded-xl transition-colors flex items-center gap-2 text-sm font-medium cursor-pointer"
            title="Reload Settings"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            <span className="hidden sm:inline">Refresh</span>
          </button>

          <button 
            onClick={() => handleSaveSettings()}
            disabled={saving}
            className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-semibold shadow-xs transition-all flex items-center gap-2 hover:shadow-md cursor-pointer disabled:opacity-50"
          >
            {saving ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            <span>{saving ? 'Saving...' : 'Save Preferences'}</span>
          </button>
        </div>
      </div>

      {/* NAVIGATION TABS */}
      <div className="flex border-b border-gray-200 overflow-x-auto gap-1 bg-white p-2 rounded-2xl shadow-xs border border-gray-200/80">
        {[
          { id: 'email', name: 'Email & Notifications', icon: Mail },
          { id: 'profile', name: 'Company Profile & Branding', icon: Building2 },
          { id: 'billing', name: 'Billing & Grace Periods', icon: CreditCard }
        ].map((tab) => {
          const isActive = activeTab === tab.id;
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center gap-2 px-4 py-3 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
                isActive
                  ? 'bg-blue-50 text-blue-700 shadow-xs'
                  : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
              }`}
            >
              <Icon className={`w-4 h-4 ${isActive ? 'text-blue-600' : 'text-gray-400'}`} />
              <span>{tab.name}</span>
            </button>
          );
        })}
      </div>

      {/* TAB 1: EMAIL & NOTIFICATIONS */}
      {activeTab === 'email' && (
        <div className="space-y-6 animate-in fade-in duration-200">
          {/* Global Service Active Banner */}
          <div className="p-5 bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200/80 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-start gap-3.5">
              <div className="p-2.5 bg-blue-600 text-white rounded-xl shadow-xs flex-shrink-0">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-bold text-sm text-gray-900">Platform Global Email Gateway</h3>
                  <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 text-[10px] font-extrabold rounded-full">
                    CONNECTED & ACTIVE
                  </span>
                </div>
                <p className="text-xs text-gray-600 mt-1">
                  Your property management account uses the platform-wide high-deliverability email infrastructure ({formData.global_email_provider?.toUpperCase()}) to dispatch statements and receipts to tenants.
                </p>
                <p className="text-[11px] font-mono text-gray-500 mt-1">
                  Default Sender: <strong className="text-gray-700">{formData.global_sender_email}</strong>
                </p>
              </div>
            </div>
          </div>

          {/* Email Settings Box */}
          <div className="bg-white rounded-2xl shadow-xs border border-gray-200/80 p-6 space-y-6">
            <div className="border-b border-gray-100 pb-4">
              <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                <Mail className="w-5 h-5 text-blue-600" />
                <span>Tenant Communication Preferences</span>
              </h3>
              <p className="text-xs text-gray-500 mt-0.5">
                Customize how your property management company appears in tenant invoice emails and PDF statements.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-gray-700">Display Name in Tenant Emails</label>
                <input
                  type="text"
                  value={formData.company_name}
                  onChange={(e) => handleChange('company_name', e.target.value)}
                  placeholder="e.g. Sunrise Residences Management"
                  className="w-full px-3.5 py-2.5 border border-gray-300 rounded-xl text-sm text-gray-900 focus:ring-2 focus:ring-blue-500 outline-none"
                />
                <p className="text-[11px] text-gray-400">Shows as the sender name when bills and receipts are dispatched.</p>
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-gray-700">Reply-To Email Address</label>
                <input
                  type="email"
                  value={formData.contact_email}
                  onChange={(e) => handleChange('contact_email', e.target.value)}
                  placeholder="admin1@sunrise.com"
                  className="w-full px-3.5 py-2.5 border border-gray-300 rounded-xl text-sm text-gray-900 focus:ring-2 focus:ring-blue-500 outline-none"
                />
                <p className="text-[11px] text-gray-400">When tenants reply to billing emails, responses will be routed here.</p>
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-gray-700">Email Signature / Invoice Footer Note</label>
              <textarea
                rows={2}
                value={formData.email_signature}
                onChange={(e) => handleChange('email_signature', e.target.value)}
                placeholder="Sunrise Properties - Quality Residential Management."
                className="w-full px-3.5 py-2.5 border border-gray-300 rounded-xl text-xs text-gray-900 focus:ring-2 focus:ring-blue-500 outline-none"
              />
            </div>
          </div>

          {/* Automated Notification Event Triggers */}
          <div className="bg-white rounded-2xl shadow-xs border border-gray-200/80 p-6 space-y-6">
            <div className="border-b border-gray-100 pb-4">
              <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                <Bell className="w-5 h-5 text-indigo-600" />
                <span>Automated Email Notification Triggers</span>
              </h3>
              <p className="text-xs text-gray-500 mt-0.5">
                Toggle automatic email dispatches to tenants for billing and maintenance events.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Trigger 1: Billing Invoices */}
              <div 
                onClick={() => handleNotificationToggle('notify_billing_posted')}
                className={`p-4 rounded-2xl border transition-all cursor-pointer flex flex-col justify-between ${
                  formData.notification_events?.notify_billing_posted
                    ? 'border-blue-300 bg-blue-50/40 ring-1 ring-blue-500/20'
                    : 'border-gray-200 bg-gray-50/60 opacity-80'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className={`p-2 rounded-xl ${formData.notification_events?.notify_billing_posted ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-500'}`}>
                    <FileText className="w-4 h-4" />
                  </div>
                  <input
                    type="checkbox"
                    checked={!!formData.notification_events?.notify_billing_posted}
                    onChange={() => {}}
                    className="rounded text-blue-600 focus:ring-blue-500"
                  />
                </div>
                <h4 className="text-xs font-bold text-gray-900">Post Bill & Statement PDF</h4>
                <p className="text-[11px] text-gray-500 mt-1">
                  Automatically email Statement of Account PDF when a bill is published.
                </p>
              </div>

              {/* Trigger 2: Payment Receipts */}
              <div 
                onClick={() => handleNotificationToggle('notify_payment_received')}
                className={`p-4 rounded-2xl border transition-all cursor-pointer flex flex-col justify-between ${
                  formData.notification_events?.notify_payment_received
                    ? 'border-emerald-300 bg-emerald-50/40 ring-1 ring-emerald-500/20'
                    : 'border-gray-200 bg-gray-50/60 opacity-80'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className={`p-2 rounded-xl ${formData.notification_events?.notify_payment_received ? 'bg-emerald-600 text-white' : 'bg-gray-200 text-gray-500'}`}>
                    <Receipt className="w-4 h-4" />
                  </div>
                  <input
                    type="checkbox"
                    checked={!!formData.notification_events?.notify_payment_received}
                    onChange={() => {}}
                    className="rounded text-emerald-600 focus:ring-emerald-500"
                  />
                </div>
                <h4 className="text-xs font-bold text-gray-900">Official Payment Receipts</h4>
                <p className="text-[11px] text-gray-500 mt-1">
                  Automatically email official collection receipt upon payment recording.
                </p>
              </div>

              {/* Trigger 3: Maintenance Tickets */}
              <div 
                onClick={() => handleNotificationToggle('notify_maintenance_ticket')}
                className={`p-4 rounded-2xl border transition-all cursor-pointer flex flex-col justify-between ${
                  formData.notification_events?.notify_maintenance_ticket
                    ? 'border-amber-300 bg-amber-50/40 ring-1 ring-amber-500/20'
                    : 'border-gray-200 bg-gray-50/60 opacity-80'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className={`p-2 rounded-xl ${formData.notification_events?.notify_maintenance_ticket ? 'bg-amber-600 text-white' : 'bg-gray-200 text-gray-500'}`}>
                    <Wrench className="w-4 h-4" />
                  </div>
                  <input
                    type="checkbox"
                    checked={!!formData.notification_events?.notify_maintenance_ticket}
                    onChange={() => {}}
                    className="rounded text-amber-600 focus:ring-amber-500"
                  />
                </div>
                <h4 className="text-xs font-bold text-gray-900">Maintenance Request Alerts</h4>
                <p className="text-[11px] text-gray-500 mt-1">
                  Alert property managers via email when a tenant submits a repair request.
                </p>
              </div>
            </div>
          </div>

          {/* Test Email Dispatcher Card */}
          <div className="bg-white rounded-2xl shadow-xs border border-gray-200/80 p-6 space-y-4">
            <div className="flex items-center gap-2">
              <Send className="w-5 h-5 text-blue-600" />
              <h4 className="text-sm font-bold text-gray-900 uppercase tracking-wider">
                Admin Test Email Verification
              </h4>
            </div>
            <p className="text-xs text-gray-500">
              Verify that email delivery from your property manager account is working by sending a test message to your inbox.
            </p>

            <div className="flex flex-col sm:flex-row gap-3 pt-1">
              <input
                type="email"
                value={testEmailRecipient}
                onChange={(e) => setTestEmailRecipient(e.target.value)}
                placeholder="Enter email to test (e.g. admin@sunrise.com)..."
                className="flex-1 px-3.5 py-2.5 border border-gray-300 rounded-xl text-sm bg-white text-gray-900 focus:ring-2 focus:ring-blue-500 outline-none"
              />
              <button
                type="button"
                onClick={handleTestEmail}
                disabled={testingEmail}
                className="px-5 py-2.5 bg-gray-900 hover:bg-gray-800 text-white text-xs font-bold rounded-xl transition-all shadow-xs flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
              >
                {testingEmail && <RefreshCw className="w-3.5 h-3.5 animate-spin" />}
                <span>{testingEmail ? 'Dispatching...' : 'Dispatch Test Email'}</span>
              </button>
            </div>

            {emailTestResult && (
              <div className={`mt-3 p-3.5 rounded-xl border text-xs font-medium flex items-start gap-2.5 animate-in fade-in ${
                emailTestResult.success 
                  ? 'bg-emerald-50 text-emerald-800 border-emerald-200' 
                  : 'bg-red-50 text-red-800 border-red-200'
              }`}>
                {emailTestResult.success ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0 mt-0.5" />
                ) : (
                  <AlertCircle className="w-4 h-4 text-red-600 flex-shrink-0 mt-0.5" />
                )}
                <div>
                  <p className="font-bold">{emailTestResult.success ? 'Email Delivered Successfully' : 'Email Delivery Failed'}</p>
                  <p className="mt-0.5">{emailTestResult.message}</p>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 2: PROFILE & BRANDING */}
      {activeTab === 'profile' && (
        <div className="space-y-6 animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl shadow-xs border border-gray-200/80 p-6 space-y-6">
            <div className="border-b border-gray-100 pb-4">
              <h3 className="text-lg font-bold text-gray-900">Property Management Company Information</h3>
              <p className="text-xs text-gray-500 mt-0.5">
                Official details shown in statements, lease contracts, and tenant portal headers.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-gray-700">Company / Organization Name</label>
                <input
                  type="text"
                  value={formData.company_name}
                  onChange={(e) => handleChange('company_name', e.target.value)}
                  placeholder="Sunrise Properties Management"
                  className="w-full px-3.5 py-2.5 border border-gray-300 rounded-xl text-sm text-gray-900 focus:ring-2 focus:ring-blue-500 outline-none"
                />
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-gray-700">Contact / Management Email</label>
                <input
                  type="email"
                  value={formData.contact_email}
                  onChange={(e) => handleChange('contact_email', e.target.value)}
                  placeholder="admin1@sunrise.com"
                  className="w-full px-3.5 py-2.5 border border-gray-300 rounded-xl text-sm text-gray-900 focus:ring-2 focus:ring-blue-500 outline-none"
                />
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-gray-700">Hotline / Support Phone</label>
                <input
                  type="text"
                  value={formData.support_phone}
                  onChange={(e) => handleChange('support_phone', e.target.value)}
                  placeholder="+63 917 888 1234"
                  className="w-full px-3.5 py-2.5 border border-gray-300 rounded-xl text-sm text-gray-900 focus:ring-2 focus:ring-blue-500 outline-none"
                />
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-gray-700">Business Office Address</label>
                <input
                  type="text"
                  value={formData.company_address}
                  onChange={(e) => handleChange('company_address', e.target.value)}
                  placeholder="Tower 1, Solar Way, Bonifacio Global City, Taguig"
                  className="w-full px-3.5 py-2.5 border border-gray-300 rounded-xl text-sm text-gray-900 focus:ring-2 focus:ring-blue-500 outline-none"
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: BILLING RULES & GRACE PERIOD */}
      {activeTab === 'billing' && (
        <div className="space-y-6 animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl shadow-xs border border-gray-200/80 p-6 space-y-6">
            <div className="border-b border-gray-100 pb-4">
              <h3 className="text-lg font-bold text-gray-900">Default Billing & Grace Period Preferences</h3>
              <p className="text-xs text-gray-500 mt-0.5">
                Configure default payment grace periods and automated invoice generation rules.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-gray-700">Default Payment Grace Period (Days)</label>
                <div className="relative">
                  <input
                    type="number"
                    min="0"
                    max="60"
                    value={formData.default_grace_period_days}
                    onChange={(e) => handleChange('default_grace_period_days', parseInt(e.target.value, 10) || 0)}
                    className="w-full pl-3.5 pr-10 py-2.5 border border-gray-300 rounded-xl text-sm font-semibold text-gray-900 focus:ring-2 focus:ring-blue-500 outline-none"
                  />
                  <Clock className="w-4 h-4 text-gray-400 absolute right-3 top-3 pointer-events-none" />
                </div>
                <p className="text-[11px] text-gray-400">Number of days after due date before late payment penalties apply.</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
