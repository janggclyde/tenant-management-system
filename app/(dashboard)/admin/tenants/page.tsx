'use client';

import { useState, useEffect, useMemo } from 'react';
import { 
  Users, 
  Plus, 
  Search, 
  FileText, 
  RefreshCw, 
  Download, 
  Edit3, 
  Trash2, 
  Eye, 
  Building2, 
  Home, 
  Calendar, 
  Phone, 
  Mail, 
  UserCheck, 
  X, 
  AlertCircle, 
  Printer,
  CheckCircle2
} from 'lucide-react';
import { TenantRecord } from '@/lib/tenantsStore';
import { UnitRecord } from '@/lib/propertiesStore';

interface BuildingOption {
  id: number;
  name: string;
}

export default function TenantsPage() {
  const [tenants, setTenants] = useState<TenantRecord[]>([]);
  const [units, setUnits] = useState<UnitRecord[]>([]);
  const [buildings, setBuildings] = useState<BuildingOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedBuildingFilter, setSelectedBuildingFilter] = useState<string>('all');

  // Modals
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

  const [editingTenant, setEditingTenant] = useState<TenantRecord | null>(null);
  const [viewingTenant, setViewingTenant] = useState<TenantRecord | null>(null);
  const [deletingTenant, setDeletingTenant] = useState<TenantRecord | null>(null);

  // Form State
  const defaultMoveIn = new Date().toISOString().split('T')[0];
  const defaultMoveOut = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    email: '',
    emergency_contact: '',
    unit_id: '',
    move_in_date: defaultMoveIn,
    move_out_date: defaultMoveOut,
    document_url: ''
  });
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // Fetch Data
  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [tRes, uRes, bRes] = await Promise.all([
        fetch('/api/admin/tenants'),
        fetch('/api/admin/units'),
        fetch('/api/admin/buildings')
      ]);
      const tData = await tRes.json();
      const uData = await uRes.json();
      const bData = await bRes.json();

      if (tData.success) setTenants(tData.tenants || []);
      if (uData.success) setUnits(uData.units || []);
      if (bData.success) setBuildings(bData.buildings || []);
    } catch (err: any) {
      setError(err.message || 'Error fetching data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Filtered Tenants
  const filteredTenants = useMemo(() => {
    return tenants.filter(t => {
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchesQuery = 
          t.full_name.toLowerCase().includes(q) ||
          (t.email && t.email.toLowerCase().includes(q)) ||
          t.unit_number.toLowerCase().includes(q) ||
          t.building_name.toLowerCase().includes(q);
        if (!matchesQuery) return false;
      }
      if (selectedBuildingFilter !== 'all') {
        if (t.building_id.toString() !== selectedBuildingFilter) return false;
      }
      return true;
    });
  }, [tenants, searchQuery, selectedBuildingFilter]);

  // Open Create Tenant Modal
  const handleOpenCreateModal = () => {
    setEditingTenant(null);
    setFormData({
      first_name: '',
      last_name: '',
      email: '',
      emergency_contact: '',
      unit_id: units[0] ? units[0].id.toString() : '',
      move_in_date: defaultMoveIn,
      move_out_date: defaultMoveOut,
      document_url: ''
    });
    setFormError(null);
    setIsFormModalOpen(true);
  };

  // Open Edit Tenant Modal
  const handleOpenEditModal = (t: TenantRecord) => {
    setEditingTenant(t);
    setFormData({
      first_name: t.first_name || t.full_name.split(' ')[0] || '',
      last_name: t.last_name || t.full_name.split(' ').slice(1).join(' ') || '',
      email: t.email || '',
      emergency_contact: t.emergency_contact || '',
      unit_id: t.unit_id.toString(),
      move_in_date: t.move_in_date || defaultMoveIn,
      move_out_date: t.move_out_date || defaultMoveOut,
      document_url: t.document_url || ''
    });
    setFormError(null);
    setIsFormModalOpen(true);
  };

  // Submit Form (Create / Edit)
  const handleSubmitForm = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!formData.first_name.trim()) {
      setFormError('First name is required.');
      return;
    }
    if (!formData.last_name.trim()) {
      setFormError('Last name is required.');
      return;
    }
    if (!formData.email.trim()) {
      setFormError('Email address is required.');
      return;
    }
    if (!formData.unit_id) {
      setFormError('Please assign a property unit to the tenant.');
      return;
    }
    if (!formData.move_in_date) {
      setFormError('Lease move-in date is required.');
      return;
    }

    setSubmitting(true);
    try {
      if (editingTenant) {
        // UPDATE
        const res = await fetch(`/api/admin/tenants/${editingTenant.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            first_name: formData.first_name.trim(),
            last_name: formData.last_name.trim(),
            email: formData.email.trim(),
            emergency_contact: formData.emergency_contact.trim(),
            unit_id: Number(formData.unit_id),
            move_in_date: formData.move_in_date,
            move_out_date: formData.move_out_date
          })
        });
        const data = await res.json();
        if (!data.success) throw new Error(data.error || 'Failed to update tenant record');
      } else {
        // CREATE
        const res = await fetch('/api/admin/tenants', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            first_name: formData.first_name.trim(),
            last_name: formData.last_name.trim(),
            email: formData.email.trim(),
            emergency_contact: formData.emergency_contact.trim(),
            unit_id: Number(formData.unit_id),
            move_in_date: formData.move_in_date,
            move_out_date: formData.move_out_date,
            document_url: formData.document_url.trim()
          })
        });
        const data = await res.json();
        if (!data.success) throw new Error(data.error || 'Failed to create tenant record');
      }

      setIsFormModalOpen(false);
      fetchData();
    } catch (err: any) {
      setFormError(err.message || 'An error occurred while saving.');
    } finally {
      setSubmitting(false);
    }
  };

  // Delete Action
  const handleDeleteConfirm = async () => {
    if (!deletingTenant) return;
    try {
      const res = await fetch(`/api/admin/tenants/${deletingTenant.id}`, {
        method: 'DELETE'
      });
      const data = await res.json();
      if (data.success) {
        setIsDeleteModalOpen(false);
        setDeletingTenant(null);
        fetchData();
      } else {
        alert(data.error || 'Failed to delete tenant');
      }
    } catch (err) {
      alert('Error deleting tenant');
    }
  };

  // Export CSV
  const handleExportCSV = () => {
    const headers = ['Tenant ID', 'Full Name', 'Email', 'Emergency Contact', 'Unit', 'Building', 'Move In', 'Move Out', 'Status'];
    const rows = filteredTenants.map(t => [
      `#${t.id}`,
      `"${t.full_name}"`,
      `"${t.email}"`,
      `"${t.emergency_contact || ''}"`,
      `"${t.unit_number}"`,
      `"${t.building_name}"`,
      t.move_in_date || '',
      t.move_out_date || '',
      t.status
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `tenants_roster_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto space-y-6">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-6 rounded-2xl shadow-sm border border-gray-200/80">
        <div>
          <div className="flex items-center gap-2">
            <Users className="w-7 h-7 text-blue-600" />
            <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Tenants & Lease Contracts</h1>
          </div>
          <p className="text-sm text-gray-500 mt-1">
            Register tenant profiles, assign property units, and configure lease agreement terms.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <button 
            onClick={fetchData}
            className="p-2.5 text-gray-600 bg-gray-50 hover:bg-gray-100 border border-gray-200 rounded-xl transition-colors flex items-center gap-2 text-sm font-medium"
            title="Refresh List"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            <span className="hidden sm:inline">Refresh</span>
          </button>

          <button 
            onClick={handleExportCSV}
            className="p-2.5 text-gray-700 bg-white hover:bg-gray-50 border border-gray-300 rounded-xl transition-colors flex items-center gap-2 text-sm font-medium shadow-xs"
          >
            <Download className="w-4 h-4 text-gray-500" />
            <span>Export CSV</span>
          </button>

          <button 
            onClick={handleOpenCreateModal}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2.5 rounded-xl text-sm font-semibold shadow-sm transition-all flex items-center gap-2 hover:shadow-md active:scale-98"
          >
            <Plus className="w-4 h-4" />
            <span>Add Tenant</span>
          </button>
        </div>
      </div>

      {/* Metrics Bar */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-gray-200/80 shadow-xs">
          <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Active Tenants</span>
          <p className="text-2xl font-extrabold text-gray-900 mt-2">{tenants.length}</p>
          <p className="text-xs text-emerald-600 font-medium mt-1">Registered leaseholders</p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-gray-200/80 shadow-xs">
          <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Units Occupied</span>
          <p className="text-2xl font-extrabold text-blue-600 mt-2">
            {new Set(tenants.map(t => t.unit_id)).size}
          </p>
          <p className="text-xs text-gray-500 mt-1">Active property units</p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-gray-200/80 shadow-xs">
          <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Leases Active</span>
          <p className="text-2xl font-extrabold text-emerald-600 mt-2">
            {tenants.filter(t => t.status === 'active').length}
          </p>
          <p className="text-xs text-gray-500 mt-1">100% compliant</p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-gray-200/80 shadow-xs">
          <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Total Properties</span>
          <p className="text-2xl font-extrabold text-gray-900 mt-2">{buildings.length}</p>
          <p className="text-xs text-gray-500 mt-1">Managed buildings</p>
        </div>
      </div>

      {/* Tenants Table Container */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200/80 overflow-hidden">
        {/* Controls Bar */}
        <div className="p-4 border-b border-gray-200 flex flex-col md:flex-row gap-3 justify-between items-stretch md:items-center bg-gray-50/50">
          <div className="relative flex-1 max-w-md">
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-400">
              <Search className="w-4 h-4" />
            </div>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by Tenant Name, Email, Unit, or Building..."
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-xl bg-white text-sm text-gray-900 placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
            />
            {searchQuery && (
              <button onClick={() => setSearchQuery('')} className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600">
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          <div className="flex items-center gap-2">
            <select
              value={selectedBuildingFilter}
              onChange={(e) => setSelectedBuildingFilter(e.target.value)}
              className="bg-white border border-gray-300 text-sm font-medium text-gray-700 py-2 px-3 rounded-xl focus:outline-none cursor-pointer"
            >
              <option value="all">All Buildings</option>
              {buildings.map(b => (
                <option key={b.id} value={b.id.toString()}>{b.name}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Table Content */}
        <div className="overflow-x-auto">
          {loading ? (
            <div className="p-12 text-center text-gray-500 space-y-3">
              <RefreshCw className="w-8 h-8 text-blue-500 animate-spin mx-auto" />
              <p className="text-sm font-medium text-gray-600">Loading tenants & lease contracts...</p>
            </div>
          ) : filteredTenants.length === 0 ? (
            <div className="p-12 text-center text-gray-500 space-y-3">
              <Users className="w-12 h-12 text-gray-300 mx-auto" />
              <p className="text-base font-semibold text-gray-800">No tenant records found</p>
              <p className="text-xs text-gray-500 max-w-sm mx-auto">
                {searchQuery || selectedBuildingFilter !== 'all'
                  ? 'No tenants match your search filter criteria.'
                  : 'Get started by creating your first tenant profile and assigning a unit.'}
              </p>
              <button
                onClick={handleOpenCreateModal}
                className="mt-2 inline-flex items-center px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold"
              >
                <Plus className="w-4 h-4 mr-1.5" />
                Add First Tenant
              </button>
            </div>
          ) : (
            <table className="min-w-full divide-y divide-gray-200 text-left">
              <thead className="bg-gray-50/80">
                <tr>
                  <th scope="col" className="px-6 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    Tenant Profile
                  </th>
                  <th scope="col" className="px-6 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    Assigned Unit & Property
                  </th>
                  <th scope="col" className="px-6 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    Lease Duration
                  </th>
                  <th scope="col" className="px-6 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    Emergency Contact
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
                {filteredTenants.map((tenant) => (
                  <tr key={tenant.id} className="hover:bg-gray-50/80 transition-colors">
                    {/* Tenant Profile */}
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="w-10 h-10 rounded-full bg-blue-100 text-blue-700 font-bold text-xs flex items-center justify-center border border-blue-200 flex-shrink-0">
                          {tenant.full_name ? tenant.full_name.substring(0, 2).toUpperCase() : 'TN'}
                        </div>
                        <div className="ml-3">
                          <div className="text-sm font-bold text-gray-900">{tenant.full_name}</div>
                          <div className="text-xs text-gray-500 flex items-center gap-1">
                            <Mail className="w-3 h-3 text-gray-400" />
                            <span>{tenant.email}</span>
                          </div>
                        </div>
                      </div>
                    </td>

                    {/* Assigned Unit & Property */}
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-bold text-gray-900 flex items-center gap-1.5">
                        <Home className="w-4 h-4 text-blue-600" />
                        <span>{tenant.unit_number}</span>
                      </div>
                      <div className="text-xs text-gray-500 flex items-center gap-1 mt-0.5">
                        <Building2 className="w-3.5 h-3.5 text-gray-400" />
                        <span>{tenant.building_name}</span>
                      </div>
                    </td>

                    {/* Lease Duration */}
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-xs font-semibold text-gray-800 flex items-center gap-1">
                        <Calendar className="w-3.5 h-3.5 text-gray-400" />
                        <span>{tenant.move_in_date ? new Date(tenant.move_in_date).toLocaleDateString() : 'N/A'}</span>
                        <span className="text-gray-400">→</span>
                        <span>{tenant.move_out_date ? new Date(tenant.move_out_date).toLocaleDateString() : 'Indefinite'}</span>
                      </div>
                    </td>

                    {/* Emergency Contact */}
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-xs font-medium text-gray-700 flex items-center gap-1">
                        <Phone className="w-3.5 h-3.5 text-gray-400" />
                        {tenant.emergency_contact || 'N/A'}
                      </span>
                    </td>

                    {/* Status */}
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                        <UserCheck className="w-3 h-3 mr-1 text-emerald-600" />
                        Active
                      </span>
                    </td>

                    {/* Actions */}
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex items-center justify-end gap-1">
                        {/* View Contract Agreement */}
                        <button
                          onClick={() => { setViewingTenant(tenant); setIsDetailModalOpen(true); }}
                          className="p-1.5 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors flex items-center gap-1 text-xs font-semibold"
                          title="View Lease Contract"
                        >
                          <FileText className="w-4 h-4 text-blue-600" />
                          <span className="hidden sm:inline">Contract</span>
                        </button>

                        {/* Edit Tenant */}
                        <button
                          onClick={() => handleOpenEditModal(tenant)}
                          className="p-1.5 text-gray-500 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition-colors"
                          title="Edit Tenant & Lease Details"
                        >
                          <Edit3 className="w-4 h-4" />
                        </button>

                        {/* Delete Tenant */}
                        <button
                          onClick={() => { setDeletingTenant(tenant); setIsDeleteModalOpen(true); }}
                          className="p-1.5 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          title="Delete / Terminate Lease"
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

      {/* CREATE / EDIT TENANT FORM MODAL */}
      {isFormModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl max-w-xl w-full shadow-2xl overflow-hidden border border-gray-200">
            <div className="px-6 py-4 bg-gray-50 border-b border-gray-200 flex justify-between items-center">
              <div>
                <h3 className="text-lg font-bold text-gray-900">
                  {editingTenant ? `Edit Tenant (${editingTenant.full_name})` : 'Create New Tenant Profile'}
                </h3>
                <p className="text-xs text-gray-500 mt-0.5">Fill up tenant personal and contract lease details.</p>
              </div>
              <button onClick={() => setIsFormModalOpen(false)} className="text-gray-400 hover:text-gray-600 p-1 rounded-lg">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmitForm} className="p-6 space-y-4">
              {formError && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-red-700 text-xs font-semibold flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />
                  <span>{formError}</span>
                </div>
              )}

              {/* TENANT PERSONAL DETAILS */}
              <div className="space-y-3">
                <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider border-b border-gray-100 pb-1">
                  1. Tenant Personal Information
                </h4>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">First Name *</label>
                    <input
                      type="text"
                      value={formData.first_name}
                      onChange={(e) => setFormData(prev => ({ ...prev, first_name: e.target.value }))}
                      placeholder="e.g. John"
                      className="w-full px-3.5 py-2 border border-gray-300 rounded-xl text-sm text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">Last Name *</label>
                    <input
                      type="text"
                      value={formData.last_name}
                      onChange={(e) => setFormData(prev => ({ ...prev, last_name: e.target.value }))}
                      placeholder="e.g. Doe"
                      className="w-full px-3.5 py-2 border border-gray-300 rounded-xl text-sm text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">Email Address *</label>
                    <input
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                      placeholder="e.g. john.doe@example.com"
                      className="w-full px-3.5 py-2 border border-gray-300 rounded-xl text-sm text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">Emergency Contact Phone</label>
                    <input
                      type="text"
                      value={formData.emergency_contact}
                      onChange={(e) => setFormData(prev => ({ ...prev, emergency_contact: e.target.value }))}
                      placeholder="e.g. +63 917 123 4567"
                      className="w-full px-3.5 py-2 border border-gray-300 rounded-xl text-sm text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                    />
                  </div>
                </div>
              </div>

              {/* CONTRACT & LEASE DETAILS */}
              <div className="space-y-3 pt-2">
                <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider border-b border-gray-100 pb-1">
                  2. Lease Contract Details
                </h4>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Assigned Property Unit *</label>
                  <select
                    value={formData.unit_id}
                    onChange={(e) => setFormData(prev => ({ ...prev, unit_id: e.target.value }))}
                    className="w-full px-3.5 py-2 border border-gray-300 rounded-xl text-sm text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                    required
                  >
                    <option value="" disabled>Select assigned unit...</option>
                    {units.map(u => (
                      <option key={u.id} value={u.id.toString()}>
                        {u.unit_number} ({u.building_name}) - ₱{Number(u.monthly_rent).toLocaleString()}/mo
                      </option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">Move-In Date *</label>
                    <input
                      type="date"
                      value={formData.move_in_date}
                      onChange={(e) => setFormData(prev => ({ ...prev, move_in_date: e.target.value }))}
                      className="w-full px-3.5 py-2 border border-gray-300 rounded-xl text-sm text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">Move-Out Date (Expiration)</label>
                    <input
                      type="date"
                      value={formData.move_out_date}
                      onChange={(e) => setFormData(prev => ({ ...prev, move_out_date: e.target.value }))}
                      className="w-full px-3.5 py-2 border border-gray-300 rounded-xl text-sm text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Lease Document Link / Notes (Optional)</label>
                  <input
                    type="text"
                    value={formData.document_url}
                    onChange={(e) => setFormData(prev => ({ ...prev, document_url: e.target.value }))}
                    placeholder="https://drive.google.com/lease-agreement.pdf"
                    className="w-full px-3.5 py-2 border border-gray-300 rounded-xl text-sm text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                  />
                </div>
              </div>

              {/* Submit Buttons */}
              <div className="pt-4 flex justify-end gap-3 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setIsFormModalOpen(false)}
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
                  <span>{editingTenant ? 'Save Changes' : 'Create Tenant'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* VIEW LEASE CONTRACT AGREEMENT MODAL */}
      {isDetailModalOpen && viewingTenant && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl max-w-xl w-full shadow-2xl overflow-hidden border border-gray-200">
            <div className="px-6 py-4 bg-gray-900 text-white flex justify-between items-center">
              <div className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-blue-400" />
                <h3 className="text-base font-bold">Lease Agreement Contract</h3>
              </div>
              <button onClick={() => setIsDetailModalOpen(false)} className="text-gray-400 hover:text-white p-1 rounded-lg hover:bg-gray-800">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-6">
              <div className="text-center border-b border-gray-100 pb-4">
                <h4 className="text-lg font-extrabold text-gray-900">{viewingTenant.building_name}</h4>
                <p className="text-xs text-gray-500">Official Residential Tenancy Lease Contract</p>
              </div>

              <div className="grid grid-cols-2 gap-4 bg-gray-50 p-4 rounded-xl text-xs">
                <div>
                  <span className="text-gray-500 font-semibold uppercase tracking-wider block">Tenant Info:</span>
                  <p className="font-bold text-gray-900 text-sm mt-0.5">{viewingTenant.full_name}</p>
                  <p className="text-gray-600">{viewingTenant.email}</p>
                  <p className="text-gray-600">Contact: {viewingTenant.emergency_contact || 'N/A'}</p>
                </div>
                <div>
                  <span className="text-gray-500 font-semibold uppercase tracking-wider block">Assigned Unit:</span>
                  <p className="font-bold text-gray-900 text-sm mt-0.5">{viewingTenant.unit_number}</p>
                  <p className="text-gray-600">{viewingTenant.building_name}</p>
                  <p className="font-semibold text-emerald-700 mt-1">₱ {Number(viewingTenant.monthly_rent || 15000).toLocaleString()}/mo</p>
                </div>
              </div>

              <div className="border border-gray-200 rounded-xl p-4 space-y-2 text-xs">
                <div className="flex justify-between py-1 border-b border-gray-100">
                  <span className="text-gray-500">Lease Commencement (Move-In):</span>
                  <span className="font-bold text-gray-900">{viewingTenant.move_in_date ? new Date(viewingTenant.move_in_date).toLocaleDateString() : 'N/A'}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-gray-100">
                  <span className="text-gray-500">Lease Termination (Move-Out):</span>
                  <span className="font-bold text-gray-900">{viewingTenant.move_out_date ? new Date(viewingTenant.move_out_date).toLocaleDateString() : 'Indefinite'}</span>
                </div>
                <div className="flex justify-between py-1">
                  <span className="text-gray-500">Lease Status:</span>
                  <span className="font-bold text-emerald-600 flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    Active & Compliant
                  </span>
                </div>
              </div>

              <div className="flex justify-between items-center pt-2 border-t border-gray-100">
                <button
                  onClick={() => window.print()}
                  className="px-4 py-2 text-xs font-semibold text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-xl transition-colors flex items-center gap-1.5"
                >
                  <Printer className="w-4 h-4" />
                  <span>Print Lease Contract</span>
                </button>
                <button
                  onClick={() => setIsDetailModalOpen(false)}
                  className="px-5 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-xl transition-colors"
                >
                  Close Document
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* DELETE CONFIRMATION MODAL */}
      {isDeleteModalOpen && deletingTenant && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl p-6 space-y-4 border border-gray-200 text-center">
            <div className="w-12 h-12 rounded-full bg-red-100 text-red-600 flex items-center justify-center mx-auto">
              <Trash2 className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-gray-900">Terminate Lease & Delete Tenant</h3>
              <p className="text-xs text-gray-500 mt-1">
                Are you sure you want to delete <strong className="text-gray-800">{deletingTenant.full_name}</strong> and terminate their lease for {deletingTenant.unit_number}? This action cannot be undone.
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
                className="px-5 py-2 text-xs font-semibold text-white bg-red-600 hover:bg-red-700 rounded-xl transition-colors shadow-sm"
              >
                Yes, Delete Tenant
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
