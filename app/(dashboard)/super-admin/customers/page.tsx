'use client';

import { useState, useEffect, useMemo } from 'react';
import { 
  Users, 
  Plus, 
  Search, 
  Building2, 
  CreditCard, 
  RefreshCw, 
  Download, 
  Edit3, 
  Trash2, 
  Eye, 
  ShieldCheck, 
  ShieldAlert, 
  Mail, 
  Phone, 
  Building, 
  CheckCircle2, 
  AlertCircle, 
  X, 
  ChevronRight, 
  Lock, 
  Home, 
  TrendingUp, 
  Layers, 
  Sparkles,
  Ban,
  Check
} from 'lucide-react';
import { CustomerRecord, SubscriptionTierRecord } from '@/lib/customersStore';

export default function CustomersPage() {
  const [customers, setCustomers] = useState<CustomerRecord[]>([]);
  const [tiers, setTiers] = useState<SubscriptionTierRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalCustomers: 0,
    activeCustomers: 0,
    suspendedCustomers: 0,
    totalBuildings: 0,
    totalUnits: 0,
    totalTenants: 0,
    totalMRR: 0,
    tierDistribution: { Starter: 0, Pro: 0, Enterprise: 0 }
  });

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTierFilter, setSelectedTierFilter] = useState<string>('all');
  const [selectedStatusFilter, setSelectedStatusFilter] = useState<string>('all');

  // Modals
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

  const [editingCustomer, setEditingCustomer] = useState<CustomerRecord | null>(null);
  const [viewingCustomer, setViewingCustomer] = useState<CustomerRecord | null>(null);
  const [deletingCustomer, setDeletingCustomer] = useState<CustomerRecord | null>(null);

  // Form State
  const [formData, setFormData] = useState({
    name: '',
    company_name: '',
    email: '',
    phone: '',
    password: '',
    tier_id: 1,
    status: 'active' as 'active' | 'suspended',
    include_building: false,
    building_name: '',
    building_address: ''
  });
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [togglingId, setTogglingId] = useState<number | null>(null);

  // Toast State
  const [toastMessage, setToastMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  const showToast = (text: string, type: 'success' | 'error' = 'success') => {
    setToastMessage({ text, type });
    setTimeout(() => {
      setToastMessage(null);
    }, 4000);
  };

  // Fetch Customers and Tiers
  const fetchData = async () => {
    setLoading(true);
    try {
      const [cRes, tRes] = await Promise.all([
        fetch('/api/super-admin/customers'),
        fetch('/api/super-admin/tiers')
      ]);
      const cData = await cRes.json();
      const tData = await tRes.json();

      if (cData.success) {
        setCustomers(cData.customers || []);
        if (cData.stats) setStats(cData.stats);
      }
      if (tData.success) {
        setTiers(tData.tiers || []);
      }
    } catch (err: any) {
      showToast(err.message || 'Failed to load customer records', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let isMounted = true;
    const load = async () => {
      try {
        const [cRes, tRes] = await Promise.all([
          fetch('/api/super-admin/customers'),
          fetch('/api/super-admin/tiers')
        ]);
        const cData = await cRes.json();
        const tData = await tRes.json();

        if (isMounted) {
          if (cData.success) {
            setCustomers(cData.customers || []);
            if (cData.stats) setStats(cData.stats);
          }
          if (tData.success) {
            setTiers(tData.tiers || []);
          }
        }
      } catch (err: any) {
        if (isMounted) {
          showToast(err.message || 'Failed to load customer records', 'error');
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };
    load();
    return () => {
      isMounted = false;
    };
  }, []);

  // Filtered List
  const filteredCustomers = useMemo(() => {
    return customers.filter(c => {
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchesQuery =
          c.name.toLowerCase().includes(q) ||
          c.email.toLowerCase().includes(q) ||
          c.company_name.toLowerCase().includes(q) ||
          (c.buildings && c.buildings.some(b => b.name.toLowerCase().includes(q) || b.address.toLowerCase().includes(q)));
        if (!matchesQuery) return false;
      }

      if (selectedTierFilter !== 'all') {
        if (c.tier_id.toString() !== selectedTierFilter) return false;
      }

      if (selectedStatusFilter !== 'all') {
        if (c.status !== selectedStatusFilter) return false;
      }

      return true;
    });
  }, [customers, searchQuery, selectedTierFilter, selectedStatusFilter]);

  // Open Create Modal
  const handleOpenCreateModal = () => {
    setEditingCustomer(null);
    setFormData({
      name: '',
      company_name: '',
      email: '',
      phone: '',
      password: '',
      tier_id: tiers[0]?.id || 1,
      status: 'active',
      include_building: false,
      building_name: '',
      building_address: ''
    });
    setFormError(null);
    setIsFormModalOpen(true);
  };

  // Open Edit Modal
  const handleOpenEditModal = (c: CustomerRecord) => {
    setEditingCustomer(c);
    setFormData({
      name: c.name,
      company_name: c.company_name,
      email: c.email,
      phone: c.phone || '',
      password: '',
      tier_id: c.tier_id,
      status: c.status === 'suspended' ? 'suspended' : 'active',
      include_building: false,
      building_name: '',
      building_address: ''
    });
    setFormError(null);
    setIsFormModalOpen(true);
  };

  // Submit Create / Edit Form
  const handleSubmitForm = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!formData.name.trim()) {
      setFormError('Customer contact name is required.');
      return;
    }
    if (!formData.email.trim()) {
      setFormError('Email address is required.');
      return;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email.trim())) {
      setFormError('Please enter a valid email address.');
      return;
    }

    setSubmitting(true);
    try {
      if (editingCustomer) {
        // UPDATE
        const res = await fetch(`/api/super-admin/customers/${editingCustomer.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: formData.name.trim(),
            company_name: formData.company_name.trim() || undefined,
            email: formData.email.trim(),
            phone: formData.phone.trim() || undefined,
            password: formData.password.trim() || undefined,
            tier_id: formData.tier_id,
            status: formData.status
          })
        });
        const data = await res.json();
        if (!data.success) throw new Error(data.error || 'Failed to update customer');

        showToast(`Customer "${formData.name}" updated successfully!`, 'success');
        if (viewingCustomer && viewingCustomer.id === editingCustomer.id) {
          setViewingCustomer(data.customer);
        }
      } else {
        // CREATE
        const res = await fetch('/api/super-admin/customers', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: formData.name.trim(),
            company_name: formData.company_name.trim() || undefined,
            email: formData.email.trim(),
            phone: formData.phone.trim() || undefined,
            password: formData.password.trim() || undefined,
            tier_id: formData.tier_id,
            status: formData.status,
            building_name: formData.include_building ? formData.building_name.trim() : undefined,
            building_address: formData.include_building ? formData.building_address.trim() : undefined
          })
        });
        const data = await res.json();
        if (!data.success) throw new Error(data.error || 'Failed to create customer');

        showToast(`Customer "${formData.name}" added successfully!`, 'success');
      }

      setIsFormModalOpen(false);
      fetchData();
    } catch (err: any) {
      setFormError(err.message || 'An error occurred while saving.');
    } finally {
      setSubmitting(false);
    }
  };

  // Toggle Suspend / Reactivate Status
  const handleToggleStatus = async (c: CustomerRecord) => {
    setTogglingId(c.id);
    try {
      const res = await fetch(`/api/super-admin/customers/${c.id}/toggle-status`, {
        method: 'POST'
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.error || 'Failed to update status');

      showToast(
        `Account for "${c.name}" has been ${data.customer.status === 'active' ? 'Reactivated' : 'Suspended'}.`,
        'success'
      );
      
      // Update local state smoothly
      setCustomers(prev => prev.map(item => item.id === c.id ? { ...item, status: data.customer.status } : item));
      if (viewingCustomer && viewingCustomer.id === c.id) {
        setViewingCustomer(prev => prev ? { ...prev, status: data.customer.status } : null);
      }
      fetchData();
    } catch (err: any) {
      showToast(err.message || 'Failed to change customer status', 'error');
    } finally {
      setTogglingId(null);
    }
  };

  // Delete Customer
  const handleDeleteConfirm = async () => {
    if (!deletingCustomer) return;
    try {
      const res = await fetch(`/api/super-admin/customers/${deletingCustomer.id}`, {
        method: 'DELETE'
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.error || 'Failed to delete customer');

      showToast(`Customer "${deletingCustomer.name}" has been removed.`, 'success');
      setIsDeleteModalOpen(false);
      if (viewingCustomer?.id === deletingCustomer.id) {
        setIsDetailModalOpen(false);
        setViewingCustomer(null);
      }
      setDeletingCustomer(null);
      fetchData();
    } catch (err: any) {
      showToast(err.message || 'Failed to delete customer', 'error');
    }
  };

  // Export CSV
  const handleExportCSV = () => {
    const headers = [
      'Customer ID',
      'Contact Name',
      'Company Name',
      'Email',
      'Phone',
      'Subscription Tier',
      'Tier Price (PHP)',
      'Status',
      'Buildings Count',
      'Units Count',
      'Active Tenants',
      'Registered Date'
    ];

    const rows = filteredCustomers.map(c => [
      `#${c.id}`,
      `"${c.name}"`,
      `"${c.company_name}"`,
      `"${c.email}"`,
      `"${c.phone || ''}"`,
      `"${c.tier_name}"`,
      c.tier_price,
      c.status.toUpperCase(),
      c.buildings_count,
      c.units_count,
      c.tenants_count,
      new Date(c.created_at).toLocaleDateString()
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `customers_subscribers_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const getTierBadgeStyle = (tierName: string) => {
    switch (tierName?.toLowerCase()) {
      case 'enterprise':
        return 'bg-purple-50 text-purple-700 border-purple-200 ring-1 ring-purple-500/20';
      case 'pro':
        return 'bg-blue-50 text-blue-700 border-blue-200 ring-1 ring-blue-500/20';
      case 'starter':
      default:
        return 'bg-gray-100 text-gray-700 border-gray-200';
    }
  };

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto space-y-6">
      {/* TOAST BANNER */}
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
          <button onClick={() => setToastMessage(null)} className="ml-2 text-gray-300 hover:text-white">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* TOP HEADER */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-6 rounded-2xl shadow-xs border border-gray-200/80">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-blue-50 rounded-xl text-blue-600">
              <Users className="w-6 h-6" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Customers & Subscribers</h1>
          </div>
          <p className="text-sm text-gray-500 mt-1">
            Manage Property Managers, SaaS subscriber tiers, account limits, and platform access.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <button 
            onClick={fetchData}
            className="p-2.5 text-gray-600 bg-gray-50 hover:bg-gray-100 border border-gray-200 rounded-xl transition-colors flex items-center gap-2 text-sm font-medium cursor-pointer"
            title="Refresh List"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            <span className="hidden sm:inline">Refresh</span>
          </button>

          <button 
            onClick={handleExportCSV}
            className="p-2.5 text-gray-700 bg-white hover:bg-gray-50 border border-gray-300 rounded-xl transition-colors flex items-center gap-2 text-sm font-medium shadow-xs cursor-pointer"
          >
            <Download className="w-4 h-4 text-gray-500" />
            <span>Export CSV</span>
          </button>

          <button 
            onClick={handleOpenCreateModal}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2.5 rounded-xl text-sm font-semibold shadow-xs transition-all flex items-center gap-2 hover:shadow-md active:scale-98 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Add Customer</span>
          </button>
        </div>
      </div>

      {/* STATS OVERVIEW */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Customers */}
        <div className="bg-white p-5 rounded-2xl border border-gray-200/80 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Total Subscribers</span>
            <div className="p-2 rounded-lg bg-blue-50 text-blue-600">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <p className="text-2xl font-extrabold text-gray-900">{stats.totalCustomers || customers.length}</p>
            <div className="flex items-center gap-1.5 mt-1 text-xs text-gray-500">
              <span className="text-emerald-600 font-semibold">{stats.activeCustomers} Active</span>
              <span>•</span>
              <span className="text-amber-600 font-semibold">{stats.suspendedCustomers} Suspended</span>
            </div>
          </div>
        </div>

        {/* Managed Buildings */}
        <div className="bg-white p-5 rounded-2xl border border-gray-200/80 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Managed Properties</span>
            <div className="p-2 rounded-lg bg-indigo-50 text-indigo-600">
              <Building2 className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <p className="text-2xl font-extrabold text-indigo-600">{stats.totalBuildings}</p>
            <p className="text-xs text-gray-500 mt-1">Across {stats.totalUnits} total rental units</p>
          </div>
        </div>

        {/* Total Tenants Onboarded */}
        <div className="bg-white p-5 rounded-2xl border border-gray-200/80 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Active Tenants</span>
            <div className="p-2 rounded-lg bg-emerald-50 text-emerald-600">
              <Home className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <p className="text-2xl font-extrabold text-emerald-600">{stats.totalTenants}</p>
            <p className="text-xs text-gray-500 mt-1">Leaseholders in platform</p>
          </div>
        </div>

        {/* Monthly Recurring Revenue */}
        <div className="bg-white p-5 rounded-2xl border border-gray-200/80 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">SaaS MRR</span>
            <div className="p-2 rounded-lg bg-purple-50 text-purple-600">
              <CreditCard className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <p className="text-2xl font-extrabold text-purple-700">₱{stats.totalMRR.toLocaleString()}</p>
            <p className="text-xs text-purple-600 font-medium mt-1">From active plan subscriptions</p>
          </div>
        </div>
      </div>

      {/* DATA TABLE CONTAINER */}
      <div className="bg-white rounded-2xl shadow-xs border border-gray-200/80 overflow-hidden">
        {/* Controls & Filter Bar */}
        <div className="p-4 border-b border-gray-200 flex flex-col md:flex-row gap-3 justify-between items-stretch md:items-center bg-gray-50/50">
          <div className="relative flex-1 max-w-md">
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-400">
              <Search className="w-4 h-4" />
            </div>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by Admin Name, Company, Email, or Building..."
              className="w-full pl-10 pr-8 py-2 border border-gray-300 rounded-xl bg-white text-sm text-gray-900 placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
            />
            {searchQuery && (
              <button 
                onClick={() => setSearchQuery('')} 
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            {/* Tier Filter */}
            <div className="flex items-center gap-1.5">
              <span className="text-xs font-medium text-gray-500 hidden sm:inline">Tier:</span>
              <select
                value={selectedTierFilter}
                onChange={(e) => setSelectedTierFilter(e.target.value)}
                className="bg-white border border-gray-300 text-xs font-semibold text-gray-700 py-2 px-3 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none cursor-pointer"
              >
                <option value="all">All Tiers</option>
                {tiers.map(t => (
                  <option key={t.id} value={t.id.toString()}>{t.name} (₱{t.price.toLocaleString()})</option>
                ))}
              </select>
            </div>

            {/* Status Filter */}
            <div className="flex items-center gap-1.5">
              <span className="text-xs font-medium text-gray-500 hidden sm:inline">Status:</span>
              <select
                value={selectedStatusFilter}
                onChange={(e) => setSelectedStatusFilter(e.target.value)}
                className="bg-white border border-gray-300 text-xs font-semibold text-gray-700 py-2 px-3 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none cursor-pointer"
              >
                <option value="all">All Status</option>
                <option value="active">Active</option>
                <option value="suspended">Suspended</option>
                <option value="inactive">Inactive</option>
              </select>
            </div>
          </div>
        </div>

        {/* Table Content */}
        <div className="overflow-x-auto">
          {loading ? (
            <div className="p-12 text-center text-gray-500 space-y-3">
              <RefreshCw className="w-8 h-8 text-blue-500 animate-spin mx-auto" />
              <p className="text-sm font-medium text-gray-600">Loading subscribers & platform customers...</p>
            </div>
          ) : filteredCustomers.length === 0 ? (
            <div className="p-12 text-center text-gray-500 space-y-3">
              <Users className="w-12 h-12 text-gray-300 mx-auto" />
              <p className="text-base font-semibold text-gray-800">No customer records found</p>
              <p className="text-xs text-gray-500 max-w-sm mx-auto">
                {searchQuery || selectedTierFilter !== 'all' || selectedStatusFilter !== 'all'
                  ? 'No property manager accounts match your selected filter criteria.'
                  : 'Get started by creating your first SaaS subscriber account.'}
              </p>
              <button
                onClick={handleOpenCreateModal}
                className="mt-2 inline-flex items-center px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold cursor-pointer"
              >
                <Plus className="w-4 h-4 mr-1.5" />
                Add First Customer
              </button>
            </div>
          ) : (
            <table className="min-w-full divide-y divide-gray-200 text-left">
              <thead className="bg-gray-50/80">
                <tr>
                  <th scope="col" className="px-6 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    Customer / Organization
                  </th>
                  <th scope="col" className="px-6 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    Subscription Tier
                  </th>
                  <th scope="col" className="px-6 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    Managed Properties
                  </th>
                  <th scope="col" className="px-6 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    Tenants
                  </th>
                  <th scope="col" className="px-6 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th scope="col" className="px-6 py-3.5 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-100">
                {filteredCustomers.map((customer) => {
                  const isSuspended = customer.status === 'suspended';
                  const initials = customer.name
                    ? customer.name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase()
                    : 'PM';

                  return (
                    <tr key={customer.id} className="hover:bg-gray-50/80 transition-colors group">
                      {/* Customer Info */}
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold text-xs border flex-shrink-0 ${
                            isSuspended 
                              ? 'bg-red-50 text-red-700 border-red-200' 
                              : 'bg-blue-50 text-blue-700 border-blue-200'
                          }`}>
                            {initials}
                          </div>
                          <div className="ml-3.5">
                            <div className="text-sm font-bold text-gray-900 group-hover:text-blue-600 transition-colors flex items-center gap-1.5">
                              <span>{customer.company_name || customer.name}</span>
                            </div>
                            <div className="text-xs text-gray-500 flex items-center gap-1 mt-0.5">
                              <span className="font-medium text-gray-700">{customer.name}</span>
                              <span>•</span>
                              <Mail className="w-3 h-3 text-gray-400 inline" />
                              <span>{customer.email}</span>
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Tier Info */}
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex flex-col items-start gap-1">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold border ${getTierBadgeStyle(customer.tier_name)}`}>
                            {customer.tier_name}
                          </span>
                          <span className="text-xs text-gray-500">
                            ₱{customer.tier_price.toLocaleString()}<span className="text-gray-400">/mo</span>
                          </span>
                        </div>
                      </td>

                      {/* Buildings and Units */}
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-bold text-gray-900 flex items-center gap-1.5">
                          <Building2 className="w-4 h-4 text-gray-500" />
                          <span>{customer.buildings_count} {customer.buildings_count === 1 ? 'Building' : 'Buildings'}</span>
                        </div>
                        <div className="text-xs text-gray-500 mt-0.5">
                          {customer.units_count} total rental units
                        </div>
                      </td>

                      {/* Tenants */}
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-semibold bg-gray-100 text-gray-800">
                          <Users className="w-3 h-3 mr-1.5 text-gray-500" />
                          {customer.tenants_count} Active
                        </span>
                      </td>

                      {/* Status */}
                      <td className="px-6 py-4 whitespace-nowrap">
                        {customer.status === 'active' ? (
                          <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 mr-1.5 animate-pulse" />
                            Active
                          </span>
                        ) : customer.status === 'suspended' ? (
                          <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-red-50 text-red-700 border border-red-200">
                            <span className="w-1.5 h-1.5 rounded-full bg-red-500 mr-1.5" />
                            Suspended
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-gray-100 text-gray-600 border border-gray-200">
                            Inactive
                          </span>
                        )}
                      </td>

                      {/* Actions */}
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <div className="flex items-center justify-end gap-1">
                          {/* View Details */}
                          <button
                            onClick={() => { setViewingCustomer(customer); setIsDetailModalOpen(true); }}
                            className="p-1.5 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors flex items-center gap-1 text-xs font-semibold cursor-pointer"
                            title="View Customer Profile & Properties"
                          >
                            <Eye className="w-4 h-4 text-blue-600" />
                            <span className="hidden sm:inline">Details</span>
                          </button>

                          {/* Quick Toggle Suspend */}
                          <button
                            onClick={() => handleToggleStatus(customer)}
                            disabled={togglingId === customer.id}
                            className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                              isSuspended
                                ? 'text-emerald-600 hover:bg-emerald-50'
                                : 'text-amber-600 hover:bg-amber-50'
                            }`}
                            title={isSuspended ? 'Reactivate Customer' : 'Suspend Customer'}
                          >
                            {togglingId === customer.id ? (
                              <RefreshCw className="w-4 h-4 animate-spin" />
                            ) : isSuspended ? (
                              <Check className="w-4 h-4 text-emerald-600" />
                            ) : (
                              <Ban className="w-4 h-4 text-amber-600" />
                            )}
                          </button>

                          {/* Edit Customer */}
                          <button
                            onClick={() => handleOpenEditModal(customer)}
                            className="p-1.5 text-gray-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors cursor-pointer"
                            title="Edit Subscriber & Plan"
                          >
                            <Edit3 className="w-4 h-4" />
                          </button>

                          {/* Delete Customer */}
                          <button
                            onClick={() => { setDeletingCustomer(customer); setIsDeleteModalOpen(true); }}
                            className="p-1.5 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
                            title="Delete Customer Account"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* CREATE / EDIT CUSTOMER MODAL */}
      {isFormModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-in fade-in duration-200 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-xl w-full shadow-2xl overflow-hidden border border-gray-200 my-8">
            {/* Modal Header */}
            <div className="px-6 py-4 bg-gray-50 border-b border-gray-200 flex justify-between items-center">
              <div>
                <h3 className="text-lg font-bold text-gray-900">
                  {editingCustomer ? `Edit Customer (${editingCustomer.name})` : 'Create New Subscriber Account'}
                </h3>
                <p className="text-xs text-gray-500 mt-0.5">
                  {editingCustomer ? 'Update customer profile, subscription plan, and status.' : 'Register a new property manager customer on your SaaS platform.'}
                </p>
              </div>
              <button 
                onClick={() => setIsFormModalOpen(false)} 
                className="text-gray-400 hover:text-gray-600 p-1.5 rounded-lg hover:bg-gray-200 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleSubmitForm} className="p-6 space-y-4">
              {formError && (
                <div className="p-3.5 bg-red-50 border border-red-200 rounded-xl text-red-700 text-xs font-semibold flex items-center gap-2 animate-in fade-in">
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />
                  <span>{formError}</span>
                </div>
              )}

              {/* 1. Basic Information */}
              <div className="space-y-3">
                <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider border-b border-gray-100 pb-1">
                  1. Contact & Organization Information
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">Contact Person Name *</label>
                    <input
                      type="text"
                      value={formData.name}
                      onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                      placeholder="e.g. Robert Fox"
                      className="w-full px-3.5 py-2 border border-gray-300 rounded-xl text-sm text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">Company / Group Name</label>
                    <input
                      type="text"
                      value={formData.company_name}
                      onChange={(e) => setFormData(prev => ({ ...prev, company_name: e.target.value }))}
                      placeholder="e.g. Sunrise Property Group"
                      className="w-full px-3.5 py-2 border border-gray-300 rounded-xl text-sm text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">Email Address (Login) *</label>
                    <input
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                      placeholder="e.g. admin@sunriseproperties.com"
                      className="w-full px-3.5 py-2 border border-gray-300 rounded-xl text-sm text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">Phone Number</label>
                    <input
                      type="text"
                      value={formData.phone}
                      onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                      placeholder="e.g. +63 917 123 4567"
                      className="w-full px-3.5 py-2 border border-gray-300 rounded-xl text-sm text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    {editingCustomer ? 'Reset Password (Leave blank to keep current)' : 'Account Password'}
                  </label>
                  <div className="relative">
                    <input
                      type="password"
                      value={formData.password}
                      onChange={(e) => setFormData(prev => ({ ...prev, password: e.target.value }))}
                      placeholder={editingCustomer ? 'Enter new password or leave blank' : 'Default is password123'}
                      className="w-full px-3.5 py-2 pl-9 border border-gray-300 rounded-xl text-sm text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                    />
                    <Lock className="w-4 h-4 text-gray-400 absolute left-3 top-2.5 pointer-events-none" />
                  </div>
                </div>
              </div>

              {/* 2. Subscription Plan & Status */}
              <div className="space-y-3 pt-2">
                <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider border-b border-gray-100 pb-1">
                  2. Subscription Tier & Access
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">Assigned Tier Plan *</label>
                    <select
                      value={formData.tier_id}
                      onChange={(e) => setFormData(prev => ({ ...prev, tier_id: Number(e.target.value) }))}
                      className="w-full px-3.5 py-2 border border-gray-300 rounded-xl text-sm text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none font-medium cursor-pointer"
                      required
                    >
                      {tiers.map(t => (
                        <option key={t.id} value={t.id}>
                          {t.name} - ₱{t.price.toLocaleString()}/mo ({t.max_buildings === 999 ? 'Unlimited' : t.max_buildings} buildings)
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">Account Status *</label>
                    <select
                      value={formData.status}
                      onChange={(e) => setFormData(prev => ({ ...prev, status: e.target.value as any }))}
                      className="w-full px-3.5 py-2 border border-gray-300 rounded-xl text-sm text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none font-medium cursor-pointer"
                      required
                    >
                      <option value="active">Active (Access Granted)</option>
                      <option value="suspended">Suspended (Access Restricted)</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* 3. Optional Initial Property Onboarding (Only when creating) */}
              {!editingCustomer && (
                <div className="space-y-3 pt-2">
                  <div className="flex items-center justify-between border-b border-gray-100 pb-1">
                    <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider">
                      3. Initial Managed Property (Optional)
                    </h4>
                    <label className="flex items-center gap-1.5 text-xs text-blue-600 font-semibold cursor-pointer">
                      <input
                        type="checkbox"
                        checked={formData.include_building}
                        onChange={(e) => setFormData(prev => ({ ...prev, include_building: e.target.checked }))}
                        className="rounded text-blue-600 focus:ring-blue-500"
                      />
                      <span>Add First Building</span>
                    </label>
                  </div>

                  {formData.include_building && (
                    <div className="p-3.5 bg-blue-50/50 rounded-xl border border-blue-100 space-y-3 animate-in fade-in">
                      <div>
                        <label className="block text-xs font-semibold text-gray-700 mb-1">Building / Property Name</label>
                        <input
                          type="text"
                          value={formData.building_name}
                          onChange={(e) => setFormData(prev => ({ ...prev, building_name: e.target.value }))}
                          placeholder="e.g. Sunrise Heights Tower"
                          className="w-full px-3.5 py-2 border border-gray-300 rounded-xl text-sm text-gray-900 bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-gray-700 mb-1">Building Address</label>
                        <input
                          type="text"
                          value={formData.building_address}
                          onChange={(e) => setFormData(prev => ({ ...prev, building_address: e.target.value }))}
                          placeholder="e.g. 123 Ayala Ave, Makati City"
                          className="w-full px-3.5 py-2 border border-gray-300 rounded-xl text-sm text-gray-900 bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                        />
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Submit Buttons */}
              <div className="pt-4 flex justify-end gap-3 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setIsFormModalOpen(false)}
                  className="px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-xl transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2 text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-xl transition-all shadow-xs flex items-center gap-2 disabled:opacity-50 cursor-pointer"
                >
                  {submitting && <RefreshCw className="w-4 h-4 animate-spin" />}
                  <span>{editingCustomer ? 'Save Changes' : 'Create Subscriber'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* CUSTOMER DETAILS MODAL / DRAWER */}
      {isDetailModalOpen && viewingCustomer && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-in fade-in duration-200 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-2xl w-full shadow-2xl overflow-hidden border border-gray-200 my-8">
            {/* Drawer Header */}
            <div className="px-6 py-5 bg-gradient-to-r from-gray-900 to-gray-800 text-white flex justify-between items-start">
              <div className="flex items-center gap-3.5">
                <div className="w-12 h-12 rounded-xl bg-white/10 flex items-center justify-center font-bold text-base text-white border border-white/20">
                  {viewingCustomer.name ? viewingCustomer.name.substring(0, 2).toUpperCase() : 'PM'}
                </div>
                <div>
                  <h3 className="text-lg font-bold">{viewingCustomer.company_name || viewingCustomer.name}</h3>
                  <div className="text-xs text-gray-300 flex items-center gap-2 mt-0.5">
                    <span>{viewingCustomer.name}</span>
                    <span>•</span>
                    <span>{viewingCustomer.email}</span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    setIsDetailModalOpen(false);
                    handleOpenEditModal(viewingCustomer);
                  }}
                  className="px-3 py-1.5 bg-white/10 hover:bg-white/20 text-xs font-semibold rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer"
                >
                  <Edit3 className="w-3.5 h-3.5" />
                  <span>Edit</span>
                </button>
                <button 
                  onClick={() => setIsDetailModalOpen(false)} 
                  className="text-gray-400 hover:text-white p-1.5 rounded-lg hover:bg-white/10 transition-colors cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Modal Body */}
            <div className="p-6 space-y-6">
              {/* Quick Metrics */}
              <div className="grid grid-cols-3 gap-3">
                <div className="bg-gray-50 p-3.5 rounded-xl border border-gray-100 text-center">
                  <span className="text-xs text-gray-500 font-medium">Subscription Tier</span>
                  <p className="text-sm font-bold text-blue-700 mt-1">{viewingCustomer.tier_name}</p>
                  <p className="text-xs text-gray-400">₱{viewingCustomer.tier_price.toLocaleString()}/mo</p>
                </div>
                <div className="bg-gray-50 p-3.5 rounded-xl border border-gray-100 text-center">
                  <span className="text-xs text-gray-500 font-medium">Buildings</span>
                  <p className="text-sm font-bold text-gray-900 mt-1">{viewingCustomer.buildings_count} Properties</p>
                  <p className="text-xs text-gray-400">{viewingCustomer.units_count} Total Units</p>
                </div>
                <div className="bg-gray-50 p-3.5 rounded-xl border border-gray-100 text-center">
                  <span className="text-xs text-gray-500 font-medium">Account Status</span>
                  <p className={`text-sm font-bold mt-1 ${viewingCustomer.status === 'active' ? 'text-emerald-600' : 'text-red-600'}`}>
                    {viewingCustomer.status.toUpperCase()}
                  </p>
                  <p className="text-xs text-gray-400">{viewingCustomer.tenants_count} Tenants</p>
                </div>
              </div>

              {/* Subscriber Contact Details */}
              <div className="border border-gray-200 rounded-xl p-4 space-y-3">
                <h4 className="text-xs font-bold text-gray-600 uppercase tracking-wider">
                  Contact & Account Information
                </h4>
                <div className="grid grid-cols-2 gap-4 text-xs">
                  <div>
                    <span className="text-gray-500 font-medium block">Contact Name:</span>
                    <span className="font-bold text-gray-900 mt-0.5 block">{viewingCustomer.name}</span>
                  </div>
                  <div>
                    <span className="text-gray-500 font-medium block">Primary Email:</span>
                    <span className="font-bold text-gray-900 mt-0.5 block">{viewingCustomer.email}</span>
                  </div>
                  <div>
                    <span className="text-gray-500 font-medium block">Phone Number:</span>
                    <span className="font-bold text-gray-900 mt-0.5 block">{viewingCustomer.phone || 'N/A'}</span>
                  </div>
                  <div>
                    <span className="text-gray-500 font-medium block">Joined Platform:</span>
                    <span className="font-bold text-gray-900 mt-0.5 block">
                      {new Date(viewingCustomer.created_at).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })}
                    </span>
                  </div>
                </div>
              </div>

              {/* Managed Buildings & Units List */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold text-gray-600 uppercase tracking-wider">
                    Managed Properties & Buildings ({viewingCustomer.buildings?.length || 0})
                  </h4>
                </div>

                {!viewingCustomer.buildings || viewingCustomer.buildings.length === 0 ? (
                  <div className="p-4 bg-gray-50 rounded-xl text-center text-xs text-gray-500">
                    No buildings registered yet under this subscriber.
                  </div>
                ) : (
                  <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                    {viewingCustomer.buildings.map((b) => (
                      <div key={b.id} className="p-3 bg-gray-50 rounded-xl border border-gray-200/80 flex items-center justify-between text-xs">
                        <div className="flex items-center gap-2.5">
                          <Building className="w-4 h-4 text-blue-600 flex-shrink-0" />
                          <div>
                            <p className="font-bold text-gray-900">{b.name}</p>
                            <p className="text-gray-500 text-[11px]">{b.address}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <span className="font-bold text-gray-900">{b.units_count} Units</span>
                          <p className="text-emerald-600 text-[11px] font-medium">{b.occupied_units || 0} Occupied</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Quick Actions Footer */}
              <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                <button
                  onClick={() => {
                    handleToggleStatus(viewingCustomer);
                  }}
                  className={`px-4 py-2 text-xs font-semibold rounded-xl transition-colors flex items-center gap-1.5 cursor-pointer ${
                    viewingCustomer.status === 'active'
                      ? 'bg-amber-50 text-amber-700 hover:bg-amber-100 border border-amber-200'
                      : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200'
                  }`}
                >
                  {viewingCustomer.status === 'active' ? (
                    <>
                      <Ban className="w-3.5 h-3.5" />
                      <span>Suspend Subscriber</span>
                    </>
                  ) : (
                    <>
                      <Check className="w-3.5 h-3.5" />
                      <span>Reactivate Subscriber</span>
                    </>
                  )}
                </button>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => {
                      setDeletingCustomer(viewingCustomer);
                      setIsDeleteModalOpen(true);
                    }}
                    className="px-3.5 py-2 text-xs font-semibold text-red-600 hover:bg-red-50 rounded-xl transition-colors flex items-center gap-1 cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Delete Account</span>
                  </button>
                  <button
                    onClick={() => setIsDetailModalOpen(false)}
                    className="px-4 py-2 text-xs font-semibold text-white bg-gray-900 hover:bg-gray-800 rounded-xl transition-colors cursor-pointer"
                  >
                    Close
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* DELETE CONFIRMATION MODAL */}
      {isDeleteModalOpen && deletingCustomer && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl p-6 space-y-4 border border-gray-200 text-center">
            <div className="w-12 h-12 rounded-full bg-red-100 text-red-600 flex items-center justify-center mx-auto">
              <Trash2 className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-gray-900">Delete Subscriber Account</h3>
              <p className="text-xs text-gray-500 mt-2 leading-relaxed">
                Are you sure you want to completely delete <strong className="text-gray-800">{deletingCustomer.name}</strong> ({deletingCustomer.company_name || deletingCustomer.email})?
              </p>
              <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-xl text-left text-xs text-red-700">
                ⚠️ This will permanently remove their user credentials, active subscription, and unassign all associated property records.
              </div>
            </div>

            <div className="flex justify-center gap-3 pt-2">
              <button
                onClick={() => setIsDeleteModalOpen(false)}
                className="px-4 py-2 text-xs font-medium text-gray-700 hover:bg-gray-100 rounded-xl transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteConfirm}
                className="px-5 py-2 text-xs font-semibold text-white bg-red-600 hover:bg-red-700 rounded-xl transition-colors shadow-xs cursor-pointer"
              >
                Yes, Delete Customer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
