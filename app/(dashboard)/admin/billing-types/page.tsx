'use client';

import { useState, useEffect, useMemo } from 'react';
import { 
  Sliders, 
  Plus, 
  Search, 
  Edit3, 
  Trash2, 
  RefreshCw, 
  X, 
  AlertCircle, 
  CheckCircle2, 
  Clock, 
  DollarSign, 
  Percent, 
  FileText,
  CreditCard,
  Calendar,
  Layers,
  ArrowLeft
} from 'lucide-react';
import Link from 'next/link';
import { BillingTypeRecord } from '@/lib/billingsStore';

export default function BillingTypesPage() {
  const [billingTypes, setBillingTypes] = useState<BillingTypeRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Search & Filter
  const [searchQuery, setSearchQuery] = useState('');

  // Modal Controls
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [editingType, setEditingType] = useState<BillingTypeRecord | null>(null);
  const [deletingType, setDeletingType] = useState<BillingTypeRecord | null>(null);

  // Form State
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    due_date_type: 'days_after_posting' as 'fixed_day' | 'days_after_posting',
    due_date_value: '15',
    late_fee_type: 'none' as 'none' | 'fixed' | 'percentage',
    late_fee_amount: '0',
    grace_period_days: '0',
    tax_percentage: '0',
    transfer_fee: '0',
    has_meter_reading: false,
    has_electricity: false,
    has_water: false,
    rate_per_unit: '0',
    electricity_rate_per_unit: '12.50',
    water_rate_per_unit: '45.00',
    allow_partial: false,
    auto_generate: false
  });
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // Fetch Billing Types
  const fetchBillingTypes = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/admin/billing-types');
      const data = await res.json();
      if (data.success) {
        setBillingTypes(data.billingTypes || []);
      } else {
        setError(data.error || 'Failed to fetch billing types');
      }
    } catch (err: any) {
      setError(err.message || 'Error connecting to server');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBillingTypes();
  }, []);

  // Filtered Billing Types
  const filteredTypes = useMemo(() => {
    if (!searchQuery.trim()) return billingTypes;
    const q = searchQuery.toLowerCase();
    return billingTypes.filter(t => 
      t.name.toLowerCase().includes(q) ||
      (t.description && t.description.toLowerCase().includes(q))
    );
  }, [billingTypes, searchQuery]);

  // Open Create Modal
  const handleOpenCreateModal = () => {
    setEditingType(null);
    setFormData({
      name: '',
      description: '',
      due_date_type: 'days_after_posting',
      due_date_value: '15',
      late_fee_type: 'fixed',
      late_fee_amount: '100',
      grace_period_days: '3',
      tax_percentage: '0',
      transfer_fee: '0',
      has_meter_reading: true,
      has_electricity: true,
      has_water: true,
      rate_per_unit: '12.50',
      electricity_rate_per_unit: '12.50',
      water_rate_per_unit: '45.00',
      allow_partial: true,
      auto_generate: false
    });
    setFormError(null);
    setIsModalOpen(true);
  };

  // Open Edit Modal
  const handleOpenEditModal = (bt: BillingTypeRecord) => {
    setEditingType(bt);
    setFormData({
      name: bt.name,
      description: bt.description || '',
      due_date_type: bt.due_date_type || 'days_after_posting',
      due_date_value: (bt.due_date_value || 15).toString(),
      late_fee_type: bt.late_fee_type || 'none',
      late_fee_amount: (bt.late_fee_amount || 0).toString(),
      grace_period_days: (bt.grace_period_days || 0).toString(),
      tax_percentage: (bt.tax_percentage || 0).toString(),
      transfer_fee: (bt.transfer_fee || 0).toString(),
      has_meter_reading: Boolean(bt.has_meter_reading),
      has_electricity: Boolean(bt.has_electricity ?? bt.has_meter_reading),
      has_water: Boolean(bt.has_water ?? bt.has_meter_reading),
      rate_per_unit: (bt.rate_per_unit || 0).toString(),
      electricity_rate_per_unit: (bt.electricity_rate_per_unit || 12.50).toString(),
      water_rate_per_unit: (bt.water_rate_per_unit || 45.00).toString(),
      allow_partial: Boolean(bt.allow_partial),
      auto_generate: Boolean(bt.auto_generate)
    });
    setFormError(null);
    setIsModalOpen(true);
  };

  // Submit Form
  const handleSubmitForm = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!formData.name.trim()) {
      setFormError('Category name is required.');
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        name: formData.name.trim(),
        description: formData.description.trim(),
        due_date_type: formData.due_date_type,
        due_date_value: Number(formData.due_date_value || 15),
        late_fee_type: formData.late_fee_type,
        late_fee_amount: Number(formData.late_fee_amount || 0),
        grace_period_days: Number(formData.grace_period_days || 0),
        tax_percentage: Number(formData.tax_percentage || 0),
        transfer_fee: Number(formData.transfer_fee || 0),
        has_electricity: formData.has_electricity,
        has_water: formData.has_water,
        // Keep has_meter_reading synced for backward compat
        has_meter_reading: formData.has_electricity || formData.has_water,
        rate_per_unit: Number(formData.rate_per_unit || 0),
        electricity_rate_per_unit: Number(formData.electricity_rate_per_unit || 12.50),
        water_rate_per_unit: Number(formData.water_rate_per_unit || 45.00),
        allow_partial: formData.allow_partial,
        auto_generate: formData.auto_generate
      };

      if (editingType) {
        // UPDATE
        const res = await fetch(`/api/admin/billing-types/${editingType.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
        const data = await res.json();
        if (!data.success) throw new Error(data.error || 'Failed to update billing type');
      } else {
        // CREATE
        const res = await fetch('/api/admin/billing-types', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
        const data = await res.json();
        if (!data.success) throw new Error(data.error || 'Failed to create billing type');
      }

      setIsModalOpen(false);
      fetchBillingTypes();
    } catch (err: any) {
      setFormError(err.message || 'An error occurred while saving');
    } finally {
      setSubmitting(false);
    }
  };

  const [isDeleting, setIsDeleting] = useState(false);

  // Delete Confirm
  const handleDeleteConfirm = async () => {
    if (!deletingType) return;
    setIsDeleting(true);
    try {
      const res = await fetch(`/api/admin/billing-types/${deletingType.id}`, {
        method: 'DELETE'
      });
      const data = await res.json();
      if (data.success) {
        setIsDeleteModalOpen(false);
        setDeletingType(null);
        fetchBillingTypes();
      } else {
        alert(data.error || 'Failed to delete billing type');
      }
    } catch (err) {
      alert('Error deleting billing type');
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto space-y-6">
      {/* Back Link & Header */}
      <div className="space-y-4">
        <Link 
          href="/admin/billings"
          className="inline-flex items-center text-xs font-semibold text-blue-600 hover:text-blue-800 gap-1"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Billings Dashboard</span>
        </Link>

        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-6 rounded-2xl shadow-sm border border-gray-200/80">
          <div>
            <div className="flex items-center gap-2">
              <Sliders className="w-7 h-7 text-blue-600" />
              <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Billing Types & Configurations</h1>
            </div>
            <p className="text-sm text-gray-500 mt-1">
              Set calculation rules for due dates, late payment penalties, taxes, and transaction fees.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <button 
              onClick={fetchBillingTypes}
              className="p-2.5 text-gray-600 bg-gray-50 hover:bg-gray-100 border border-gray-200 rounded-xl transition-colors flex items-center gap-2 text-sm font-medium"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              <span className="hidden sm:inline">Refresh</span>
            </button>

            <button 
              onClick={handleOpenCreateModal}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2.5 rounded-xl text-sm font-semibold shadow-sm transition-all flex items-center gap-2 shadow-xs"
            >
              <Plus className="w-4 h-4" />
              <span>Create Billing Type</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main Table */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200/80 overflow-hidden">
        {/* Search Bar */}
        <div className="p-4 border-b border-gray-200 bg-gray-50/50">
          <div className="relative max-w-md">
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-400">
              <Search className="w-4 h-4" />
            </div>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search billing types by name or description..."
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-xl bg-white text-sm text-gray-900 placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
            />
            {searchQuery && (
              <button onClick={() => setSearchQuery('')} className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600">
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        {/* Content Table */}
        <div className="overflow-x-auto">
          {loading ? (
            <div className="p-12 text-center text-gray-500 space-y-3">
              <RefreshCw className="w-8 h-8 text-blue-500 animate-spin mx-auto" />
              <p className="text-sm font-medium text-gray-600">Loading billing types...</p>
            </div>
          ) : filteredTypes.length === 0 ? (
            <div className="p-12 text-center text-gray-500 space-y-3">
              <Layers className="w-12 h-12 text-gray-300 mx-auto" />
              <p className="text-base font-semibold text-gray-800">No Billing Types Found</p>
              <button onClick={handleOpenCreateModal} className="mt-2 inline-flex items-center px-4 py-2 bg-blue-600 text-white text-xs font-semibold rounded-xl">
                <Plus className="w-4 h-4 mr-1.5" />
                Add First Category
              </button>
            </div>
          ) : (
            <table className="min-w-full divide-y divide-gray-200 text-left">
              <thead className="bg-gray-50/80">
                <tr>
                  <th scope="col" className="px-6 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    Category Name & Details
                  </th>
                  <th scope="col" className="px-6 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    Due Date Rule
                  </th>
                  <th scope="col" className="px-6 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    Late Fee Penalty
                  </th>
                  <th scope="col" className="px-6 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    Taxes & Fees
                  </th>
                  <th scope="col" className="px-6 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    Settings
                  </th>
                  <th scope="col" className="px-6 py-3.5 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-100">
                {filteredTypes.map((type) => (
                  <tr key={type.id} className="hover:bg-gray-50/80 transition-colors">
                    {/* Category Name & Desc */}
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-bold text-gray-900">{type.name}</div>
                      <div className="text-xs text-gray-500 max-w-xs truncate">{type.description || 'No description provided'}</div>
                    </td>

                    {/* Due Date Rule */}
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-xs font-semibold text-gray-800 flex items-center gap-1">
                        <Calendar className="w-3.5 h-3.5 text-blue-600" />
                        <span>
                          {type.due_date_type === 'fixed_day' 
                            ? `Day ${type.due_date_value} of each month`
                            : `${type.due_date_value} days after posting`}
                        </span>
                      </div>
                    </td>

                    {/* Late Fee Rule */}
                    <td className="px-6 py-4 whitespace-nowrap">
                      {type.late_fee_type === 'none' ? (
                        <span className="text-xs text-gray-400 italic">No Late Fee</span>
                      ) : (
                        <div>
                          <div className="text-xs font-bold text-red-600">
                            {type.late_fee_type === 'fixed' 
                              ? `₱${Number(type.late_fee_amount).toLocaleString()} Fixed`
                              : `${type.late_fee_amount}% of Total`}
                          </div>
                          {type.grace_period_days > 0 && (
                            <div className="text-[11px] text-gray-500">{type.grace_period_days} days grace period</div>
                          )}
                        </div>
                      )}
                    </td>

                    {/* Taxes & Transfer Fees */}
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-xs font-semibold text-gray-800">
                        {type.tax_percentage > 0 ? (
                          <span className="text-blue-700 bg-blue-50 px-2 py-0.5 rounded-full inline-block mr-1 font-bold">
                            {type.tax_percentage}% VAT
                          </span>
                        ) : (
                          <span className="text-gray-400">Tax Exemption</span>
                        )}
                      </div>
                      <div className="text-xs text-gray-500 mt-0.5">
                        {type.transfer_fee > 0 ? `+₱${Number(type.transfer_fee).toLocaleString()} Fee` : 'No Transfer Fee'}
                      </div>
                    </td>

                    {/* Settings Badges */}
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex flex-col gap-1 text-[11px]">
                        {type.has_electricity && (
                          <span className="text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full font-medium w-fit">
                            ⚡ Electricity
                          </span>
                        )}
                        {type.has_water && (
                          <span className="text-blue-700 bg-blue-50 px-2 py-0.5 rounded-full font-medium w-fit">
                            💧 Water
                          </span>
                        )}
                        {type.allow_partial && (
                          <span className="text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full font-medium w-fit">
                            Partial Paid Allowed
                          </span>
                        )}
                        {type.auto_generate && (
                          <span className="text-purple-700 bg-purple-50 px-2 py-0.5 rounded-full font-medium w-fit">
                            Auto-Generate Monthly
                          </span>
                        )}
                      </div>
                    </td>

                    {/* Actions */}
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => handleOpenEditModal(type)}
                          className="p-1.5 text-gray-500 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition-colors"
                          title="Edit Configuration"
                        >
                          <Edit3 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => { setDeletingType(type); setIsDeleteModalOpen(true); }}
                          className="p-1.5 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          title="Delete Category"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* CREATE / EDIT BILLING TYPE MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl max-w-xl w-full shadow-2xl overflow-hidden border border-gray-200">
            <div className="px-6 py-4 bg-gray-50 border-b border-gray-200 flex justify-between items-center">
              <h3 className="text-lg font-bold text-gray-900">
                {editingType ? `Edit Category: ${editingType.name}` : 'Configure New Billing Type'}
              </h3>
              <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-gray-600 p-1 rounded-lg">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmitForm} className="p-6 space-y-4 max-h-[80vh] overflow-y-auto">
              {formError && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-red-700 text-xs font-semibold flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />
                  <span>{formError}</span>
                </div>
              )}

              {/* Name & Description */}
              <div>
                <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">
                  Category Name *
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="e.g. Monthly Rent, Water Utility, Internet"
                  className="w-full px-3.5 py-2 border border-gray-300 rounded-xl text-sm text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">
                  Description
                </label>
                <input
                  type="text"
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Brief description of this billing category..."
                  className="w-full px-3.5 py-2 border border-gray-300 rounded-xl text-sm text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                />
              </div>

              {/* Due Date Configuration */}
              <div className="p-4 bg-gray-50/70 border border-gray-200 rounded-xl space-y-3">
                <h4 className="text-xs font-bold text-gray-900 uppercase tracking-wider flex items-center gap-1.5">
                  <Calendar className="w-4 h-4 text-blue-600" />
                  <span>Due Date Calculation Rule</span>
                </h4>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-semibold text-gray-600 mb-1">Rule Type</label>
                    <select
                      value={formData.due_date_type}
                      onChange={(e) => setFormData(prev => ({ ...prev, due_date_type: e.target.value as any }))}
                      className="w-full px-3 py-1.5 border border-gray-300 rounded-lg text-xs bg-white focus:outline-none"
                    >
                      <option value="days_after_posting">Days After Posting</option>
                      <option value="fixed_day">Fixed Day of Month</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-gray-600 mb-1">
                      {formData.due_date_type === 'fixed_day' ? 'Day of Month (1-31)' : 'Days Count'}
                    </label>
                    <input
                      type="number"
                      min="1"
                      max="31"
                      value={formData.due_date_value}
                      onChange={(e) => setFormData(prev => ({ ...prev, due_date_value: e.target.value }))}
                      className="w-full px-3 py-1.5 border border-gray-300 rounded-lg text-xs bg-white focus:outline-none font-semibold"
                    />
                  </div>
                </div>
              </div>

              {/* Late Fee Penalty Configuration */}
              <div className="p-4 bg-gray-50/70 border border-gray-200 rounded-xl space-y-3">
                <h4 className="text-xs font-bold text-gray-900 uppercase tracking-wider flex items-center gap-1.5">
                  <AlertCircle className="w-4 h-4 text-red-600" />
                  <span>Late Fee Penalty Rule</span>
                </h4>
                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="block text-[11px] font-semibold text-gray-600 mb-1">Fee Type</label>
                    <select
                      value={formData.late_fee_type}
                      onChange={(e) => setFormData(prev => ({ ...prev, late_fee_type: e.target.value as any }))}
                      className="w-full px-3 py-1.5 border border-gray-300 rounded-lg text-xs bg-white focus:outline-none"
                    >
                      <option value="none">No Late Fee</option>
                      <option value="fixed">Fixed Amount (₱)</option>
                      <option value="percentage">Percentage (%)</option>
                    </select>
                  </div>

                  {formData.late_fee_type !== 'none' && (
                    <>
                      <div>
                        <label className="block text-[11px] font-semibold text-gray-600 mb-1">
                          {formData.late_fee_type === 'fixed' ? 'Fee Amount (₱)' : 'Percentage (%)'}
                        </label>
                        <input
                          type="number"
                          step="0.01"
                          min="0"
                          value={formData.late_fee_amount}
                          onChange={(e) => setFormData(prev => ({ ...prev, late_fee_amount: e.target.value }))}
                          className="w-full px-3 py-1.5 border border-gray-300 rounded-lg text-xs bg-white focus:outline-none font-semibold text-red-600"
                        />
                      </div>

                      <div>
                        <label className="block text-[11px] font-semibold text-gray-600 mb-1">Grace Period (Days)</label>
                        <input
                          type="number"
                          min="0"
                          value={formData.grace_period_days}
                          onChange={(e) => setFormData(prev => ({ ...prev, grace_period_days: e.target.value }))}
                          className="w-full px-3 py-1.5 border border-gray-300 rounded-lg text-xs bg-white focus:outline-none font-semibold"
                        />
                      </div>
                    </>
                  )}
                </div>
              </div>

              {/* Taxes and Transfer Fees */}
              <div className="p-4 bg-gray-50/70 border border-gray-200 rounded-xl space-y-3">
                <h4 className="text-xs font-bold text-gray-900 uppercase tracking-wider flex items-center gap-1.5">
                  <Percent className="w-4 h-4 text-blue-600" />
                  <span>Taxes & Gateway Transfer Fees</span>
                </h4>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-semibold text-gray-600 mb-1">Tax Percentage (%)</label>
                    <input
                      type="number"
                      step="0.1"
                      min="0"
                      max="100"
                      value={formData.tax_percentage}
                      onChange={(e) => setFormData(prev => ({ ...prev, tax_percentage: e.target.value }))}
                      placeholder="e.g. 12 for 12% VAT"
                      className="w-full px-3 py-1.5 border border-gray-300 rounded-lg text-xs bg-white focus:outline-none font-semibold"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-gray-600 mb-1">Processing / Transfer Fee (₱)</label>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      value={formData.transfer_fee}
                      onChange={(e) => setFormData(prev => ({ ...prev, transfer_fee: e.target.value }))}
                      placeholder="e.g. 50.00"
                      className="w-full px-3 py-1.5 border border-gray-300 rounded-lg text-xs bg-white focus:outline-none font-semibold"
                    />
                  </div>
                </div>
              </div>

              {/* Utility Charges Configuration */}
              <div className="p-4 bg-blue-50/60 border border-blue-200 rounded-xl space-y-3">
                <h4 className="text-xs font-bold text-blue-950 uppercase tracking-wider flex items-center gap-1.5">
                  <DollarSign className="w-4 h-4 text-blue-600" />
                  <span>Utility Charges Configuration</span>
                </h4>
                <p className="text-[10px] text-blue-800">
                  Enable the utilities applicable to this billing type. When enabled, the configured rate will auto-populate in the billing form.
                </p>

                {/* Electricity Toggle */}
                <div className={`rounded-xl border p-3 space-y-2 transition-colors ${formData.has_electricity ? 'bg-amber-50/60 border-amber-200' : 'bg-white border-gray-200'}`}>
                  <div className="flex items-center justify-between">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={formData.has_electricity}
                        onChange={(e) => setFormData(prev => ({ ...prev, has_electricity: e.target.checked }))}
                        className="w-4 h-4 accent-amber-500 rounded"
                      />
                      <span className="text-[11px] font-bold text-amber-900 flex items-center gap-1">⚡ Electricity Charge</span>
                    </label>
                    {formData.has_electricity && (
                      <span className="text-[10px] text-amber-700 font-semibold bg-amber-100/70 px-2 py-0.5 rounded-full">
                        ₱{formData.electricity_rate_per_unit}/kWh
                      </span>
                    )}
                  </div>
                  {formData.has_electricity && (
                    <div>
                      <label className="block text-[10px] font-semibold text-amber-800 mb-1">Default Rate (₱ / kWh)</label>
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        value={formData.electricity_rate_per_unit}
                        onChange={(e) => setFormData(prev => ({ ...prev, electricity_rate_per_unit: e.target.value }))}
                        placeholder="12.50"
                        className="w-full px-3 py-1.5 border border-amber-300 rounded-lg text-xs bg-white focus:outline-none font-extrabold text-amber-700"
                      />
                    </div>
                  )}
                </div>

                {/* Water Toggle */}
                <div className={`rounded-xl border p-3 space-y-2 transition-colors ${formData.has_water ? 'bg-blue-50/80 border-blue-200' : 'bg-white border-gray-200'}`}>
                  <div className="flex items-center justify-between">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={formData.has_water}
                        onChange={(e) => setFormData(prev => ({ ...prev, has_water: e.target.checked }))}
                        className="w-4 h-4 accent-blue-500 rounded"
                      />
                      <span className="text-[11px] font-bold text-blue-900 flex items-center gap-1">💧 Water Charge</span>
                    </label>
                    {formData.has_water && (
                      <span className="text-[10px] text-blue-700 font-semibold bg-blue-100/70 px-2 py-0.5 rounded-full">
                        ₱{formData.water_rate_per_unit}/cu.m
                      </span>
                    )}
                  </div>
                  {formData.has_water && (
                    <div>
                      <label className="block text-[10px] font-semibold text-blue-800 mb-1">Default Rate (₱ / cu.m)</label>
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        value={formData.water_rate_per_unit}
                        onChange={(e) => setFormData(prev => ({ ...prev, water_rate_per_unit: e.target.value }))}
                        placeholder="45.00"
                        className="w-full px-3 py-1.5 border border-blue-300 rounded-lg text-xs bg-white focus:outline-none font-extrabold text-blue-700"
                      />
                    </div>
                  )}
                </div>
              </div>

              {/* Checkbox Toggles */}
              <div className="flex flex-col gap-2 pt-1">
                <label className="flex items-center gap-2 cursor-pointer text-xs font-medium text-gray-700">
                  <input
                    type="checkbox"
                    checked={formData.allow_partial}
                    onChange={(e) => setFormData(prev => ({ ...prev, allow_partial: e.target.checked }))}
                    className="w-4 h-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
                  />
                  <span>Allow Tenants to Make Partial Installment Payments</span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer text-xs font-medium text-gray-700">
                  <input
                    type="checkbox"
                    checked={formData.auto_generate}
                    onChange={(e) => setFormData(prev => ({ ...prev, auto_generate: e.target.checked }))}
                    className="w-4 h-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
                  />
                  <span>Auto-Generate Monthly Draft Billings Automatically</span>
                </label>
              </div>

              {/* Modal Buttons */}
              <div className="pt-4 flex justify-end gap-3 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-xl transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2 text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-xl transition-all shadow-sm flex items-center gap-2 disabled:opacity-50"
                >
                  {submitting && <RefreshCw className="w-4 h-4 animate-spin" />}
                  <span>{editingType ? 'Save Changes' : 'Create Billing Type'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* DELETE CONFIRMATION MODAL */}
      {isDeleteModalOpen && deletingType && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl p-6 space-y-4 border border-gray-200 text-center">
            <div className="w-12 h-12 rounded-full bg-red-100 text-red-600 flex items-center justify-center mx-auto">
              <Trash2 className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-gray-900">Delete Billing Category</h3>
              <p className="text-xs text-gray-500 mt-1">
                Are you sure you want to delete <strong className="text-gray-800">{deletingType.name}</strong>? This will remove the fee rules configuration for this type.
              </p>
            </div>

            <div className="flex justify-center gap-3 pt-2">
              <button
                onClick={() => setIsDeleteModalOpen(false)}
                className="px-4 py-2 text-xs font-medium text-gray-700 hover:bg-gray-100 rounded-xl transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteConfirm}
                disabled={isDeleting}
                className="px-5 py-2 text-xs font-semibold text-white bg-red-600 hover:bg-red-700 rounded-xl transition-colors shadow-sm flex items-center gap-2 disabled:opacity-50"
              >
                {isDeleting ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Deleting...</span>
                  </>
                ) : (
                  <span>Yes, Delete</span>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
