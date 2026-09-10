'use client';

import { useState, useEffect, useMemo } from 'react';
import { 
  Wrench, 
  Plus, 
  Search, 
  RefreshCw, 
  Download, 
  Clock, 
  CheckCircle2, 
  AlertTriangle, 
  AlertCircle, 
  X, 
  Building2, 
  Home, 
  User, 
  Phone, 
  Image as ImageIcon,
  ExternalLink,
  Trash2,
  Edit3,
  ChevronRight,
  Filter,
  CheckCircle
} from 'lucide-react';

interface MaintenanceTicketItem {
  id: number;
  title: string;
  category: string;
  priority: string;
  description: string;
  status: 'open' | 'in_progress' | 'resolved';
  photos: string[];
  tenant_id: number;
  tenant_name: string;
  tenant_email: string;
  tenant_phone: string;
  unit_id: number;
  unit_number: string;
  building_id: number | null;
  building_name: string;
  building_address: string;
  created_at: string;
  updated_at?: string;
}

interface MaintenanceMetrics {
  total: number;
  open: number;
  inProgress: number;
  resolved: number;
}

interface BuildingOption {
  id: number;
  name: string;
}

interface UnitOption {
  id: number;
  unit_number: string;
  building_name?: string;
}

interface TenantOption {
  id: number;
  full_name: string;
  unit_id: number;
  unit_number: string;
}

export default function AdminMaintenancePage() {
  const [tickets, setTickets] = useState<MaintenanceTicketItem[]>([]);
  const [metrics, setMetrics] = useState<MaintenanceMetrics>({
    total: 0,
    open: 0,
    inProgress: 0,
    resolved: 0
  });
  const [buildings, setBuildings] = useState<BuildingOption[]>([]);
  const [units, setUnits] = useState<UnitOption[]>([]);
  const [tenants, setTenants] = useState<TenantOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [statusFilter, setStatusFilter] = useState<'all' | 'open' | 'in_progress' | 'resolved'>('all');
  const [buildingFilter, setBuildingFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Modals
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [selectedTicketForDetail, setSelectedTicketForDetail] = useState<MaintenanceTicketItem | null>(null);
  const [updatingStatus, setUpdatingStatus] = useState(false);
  const [resolutionNote, setResolutionNote] = useState('');
  const [newStatus, setNewStatus] = useState<'open' | 'in_progress' | 'resolved'>('open');

  // Create Form State
  const [createUnitId, setCreateUnitId] = useState('');
  const [createTenantId, setCreateTenantId] = useState('');
  const [createTitle, setCreateTitle] = useState('');
  const [createCategory, setCreateCategory] = useState('Plumbing');
  const [createPriority, setCreatePriority] = useState('Normal');
  const [createDescription, setCreateDescription] = useState('');
  const [createPhotoUrl, setCreatePhotoUrl] = useState('');
  const [submittingCreate, setSubmittingCreate] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);

  // Lightbox
  const [activePhotoUrl, setActivePhotoUrl] = useState<string | null>(null);

  const fetchTickets = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/admin/maintenance?status=${statusFilter}&building_id=${buildingFilter}&query=${encodeURIComponent(searchQuery)}`);
      const data = await res.json();
      if (data.success) {
        setTickets(data.tickets || []);
        if (data.metrics) setMetrics(data.metrics);
      } else {
        throw new Error(data.error || 'Failed to load tickets');
      }
    } catch (err: any) {
      setError(err.message || 'Network error fetching maintenance tickets');
    } finally {
      setLoading(false);
    }
  };

  const fetchDependencies = async () => {
    try {
      const [bRes, uRes, tRes] = await Promise.all([
        fetch('/api/admin/buildings'),
        fetch('/api/admin/units'),
        fetch('/api/admin/tenants')
      ]);
      const bData = await bRes.json();
      const uData = await uRes.json();
      const tData = await tRes.json();

      if (bData.success) setBuildings(bData.buildings || []);
      if (uData.success) setUnits(uData.units || []);
      if (tData.success) setTenants(tData.tenants || []);
    } catch (e) {}
  };

  useEffect(() => {
    fetchDependencies();
  }, []);

  useEffect(() => {
    fetchTickets();
  }, [statusFilter, buildingFilter]);

  // Handle Search Debounce / Trigger
  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchTickets();
  };

  // Open detail / status update modal
  const openDetailModal = (ticket: MaintenanceTicketItem) => {
    setSelectedTicketForDetail(ticket);
    setNewStatus(ticket.status);
    setResolutionNote('');
  };

  // Submit Status Change
  const handleUpdateStatus = async (ticketId: number, targetStatus: 'open' | 'in_progress' | 'resolved', note?: string) => {
    setUpdatingStatus(true);
    try {
      const res = await fetch(`/api/admin/maintenance/${ticketId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: targetStatus,
          resolution_note: note || resolutionNote
        })
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.error || 'Failed to update status');

      // Update local state
      setTickets(prev => prev.map(t => {
        if (t.id === ticketId) {
          return {
            ...t,
            status: targetStatus,
            description: note ? `${t.description}\n\n[Admin Update]:\n${note}` : t.description
          };
        }
        return t;
      }));

      // Update metrics
      setMetrics(prev => {
        const next = { ...prev };
        // simple refresh
        return next;
      });

      setSelectedTicketForDetail(null);
      fetchTickets();
    } catch (err: any) {
      alert(err.message || 'Error updating status');
    } finally {
      setUpdatingStatus(false);
    }
  };

  // Delete ticket
  const handleDeleteTicket = async (ticketId: number) => {
    if (!confirm('Are you sure you want to permanently delete this maintenance ticket?')) return;
    try {
      const res = await fetch(`/api/admin/maintenance/${ticketId}`, { method: 'DELETE' });
      const data = await res.json();
      if (data.success) {
        setTickets(prev => prev.filter(t => t.id !== ticketId));
        if (selectedTicketForDetail?.id === ticketId) setSelectedTicketForDetail(null);
        fetchTickets();
      } else {
        alert(data.error || 'Failed to delete ticket');
      }
    } catch (e) {
      alert('Network error deleting ticket');
    }
  };

  // Handle Create Submit
  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreateError(null);

    if (!createUnitId) {
      setCreateError('Please select a property unit.');
      return;
    }
    if (!createTitle.trim()) {
      setCreateError('Subject title is required.');
      return;
    }
    if (!createDescription.trim()) {
      setCreateError('Description of the issue is required.');
      return;
    }

    setSubmittingCreate(true);
    try {
      const res = await fetch('/api/admin/maintenance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          unit_id: Number(createUnitId),
          tenant_id: createTenantId ? Number(createTenantId) : undefined,
          title: createTitle.trim(),
          category: createCategory,
          priority: createPriority,
          description: createDescription.trim(),
          photo_url: createPhotoUrl.trim() || undefined
        })
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.error || 'Failed to create ticket');

      setIsCreateModalOpen(false);
      // Reset form
      setCreateUnitId('');
      setCreateTenantId('');
      setCreateTitle('');
      setCreateDescription('');
      setCreatePhotoUrl('');
      fetchTickets();
    } catch (err: any) {
      setCreateError(err.message || 'Failed to create maintenance ticket');
    } finally {
      setSubmittingCreate(false);
    }
  };

  // Auto-fill tenant when unit selected in create modal
  const handleUnitSelectChange = (unitId: string) => {
    setCreateUnitId(unitId);
    const matchingTenant = tenants.find(t => t.unit_id === Number(unitId));
    if (matchingTenant) {
      setCreateTenantId(String(matchingTenant.id));
    }
  };

  // Export CSV
  const handleExportCSV = () => {
    const headers = ['Ticket ID', 'Status', 'Priority', 'Category', 'Subject', 'Property', 'Unit', 'Tenant Name', 'Tenant Phone', 'Created At'];
    const rows = tickets.map(t => [
      `#${t.id}`,
      t.status.toUpperCase(),
      t.priority,
      t.category,
      `"${t.title.replace(/"/g, '""')}"`,
      `"${t.building_name}"`,
      `"${t.unit_number}"`,
      `"${t.tenant_name}"`,
      `"${t.tenant_phone}"`,
      t.created_at
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `maintenance_tickets_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto space-y-6">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-6 rounded-3xl shadow-xs border border-gray-200">
        <div>
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-2xl bg-amber-500 text-white flex items-center justify-center shadow-md shadow-amber-500/20">
              <Wrench className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-2xl font-black text-gray-900 tracking-tight">Maintenance & Work Orders</h1>
              <p className="text-xs sm:text-sm text-gray-500 font-medium">
                Track, dispatch, and resolve property repairs and tenant requests.
              </p>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2.5 w-full sm:w-auto">
          <button
            onClick={fetchTickets}
            className="p-2.5 text-gray-600 bg-gray-50 hover:bg-gray-100 border border-gray-200 rounded-xl transition-colors flex items-center gap-2 text-xs font-bold"
            title="Refresh List"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            <span className="hidden sm:inline">Refresh</span>
          </button>

          <button
            onClick={handleExportCSV}
            className="p-2.5 text-gray-700 bg-white hover:bg-gray-50 border border-gray-300 rounded-xl transition-colors flex items-center gap-2 text-xs font-bold shadow-xs"
          >
            <Download className="w-4 h-4 text-gray-500" />
            <span>Export CSV</span>
          </button>

          <button
            onClick={() => setIsCreateModalOpen(true)}
            className="bg-amber-600 hover:bg-amber-700 text-white px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold shadow-sm transition-all flex items-center gap-2 active:scale-95"
          >
            <Plus className="w-4 h-4" />
            <span>New Work Order</span>
          </button>
        </div>
      </div>

      {/* Metrics KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total */}
        <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-gray-400">Total Orders</span>
            <div className="w-8 h-8 rounded-xl bg-gray-100 text-gray-600 flex items-center justify-center">
              <Wrench className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <p className="text-2xl sm:text-3xl font-black text-gray-900">{metrics.total}</p>
            <p className="text-[11px] text-gray-400 mt-0.5">Logged across properties</p>
          </div>
        </div>

        {/* Open */}
        <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-rose-600">Open / Pending</span>
            <div className="w-8 h-8 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center">
              <AlertCircle className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <p className="text-2xl sm:text-3xl font-black text-rose-600">{metrics.open}</p>
            <p className="text-[11px] text-rose-500 mt-0.5">Awaiting inspection</p>
          </div>
        </div>

        {/* In Progress */}
        <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-amber-600">In Progress</span>
            <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <p className="text-2xl sm:text-3xl font-black text-amber-600">{metrics.inProgress}</p>
            <p className="text-[11px] text-amber-600 mt-0.5">Being serviced</p>
          </div>
        </div>

        {/* Resolved */}
        <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-600">Resolved</span>
            <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <p className="text-2xl sm:text-3xl font-black text-emerald-600">{metrics.resolved}</p>
            <p className="text-[11px] text-emerald-600 mt-0.5">Completed repairs</p>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white rounded-3xl p-4 sm:p-5 border border-gray-200 shadow-xs space-y-4">
        <div className="flex flex-col md:flex-row gap-3 justify-between items-stretch md:items-center">
          {/* Status Tabs */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
            <button
              onClick={() => setStatusFilter('all')}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
                statusFilter === 'all'
                  ? 'bg-gray-900 text-white shadow-xs'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              All ({metrics.total})
            </button>
            <button
              onClick={() => setStatusFilter('open')}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
                statusFilter === 'open'
                  ? 'bg-rose-600 text-white shadow-xs'
                  : 'bg-rose-50 text-rose-700 hover:bg-rose-100'
              }`}
            >
              Open ({metrics.open})
            </button>
            <button
              onClick={() => setStatusFilter('in_progress')}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
                statusFilter === 'in_progress'
                  ? 'bg-amber-500 text-white shadow-xs'
                  : 'bg-amber-50 text-amber-700 hover:bg-amber-100'
              }`}
            >
              In Progress ({metrics.inProgress})
            </button>
            <button
              onClick={() => setStatusFilter('resolved')}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
                statusFilter === 'resolved'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
              }`}
            >
              Resolved ({metrics.resolved})
            </button>
          </div>

          {/* Building Dropdown & Search Input */}
          <div className="flex flex-col sm:flex-row items-center gap-2.5">
            <select
              value={buildingFilter}
              onChange={(e) => setBuildingFilter(e.target.value)}
              className="w-full sm:w-auto bg-white border border-gray-300 text-xs font-bold text-gray-700 py-2 px-3 rounded-xl focus:outline-none cursor-pointer"
            >
              <option value="all">All Properties</option>
              {buildings.map(b => (
                <option key={b.id} value={b.id.toString()}>{b.name}</option>
              ))}
            </select>

            <form onSubmit={handleSearchSubmit} className="relative w-full sm:w-64">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search ticket, unit, tenant..."
                className="w-full pl-8 pr-3 py-2 border border-gray-300 rounded-xl text-xs font-medium text-gray-900 placeholder-gray-400 focus:ring-2 focus:ring-amber-500 outline-none"
              />
              <Search className="w-3.5 h-3.5 text-gray-400 absolute left-2.5 top-3" />
            </form>
          </div>
        </div>

        {/* Tickets List */}
        {loading ? (
          <div className="p-16 text-center text-gray-400 flex flex-col items-center justify-center">
            <RefreshCw className="w-8 h-8 text-amber-500 animate-spin mb-3" />
            <p className="text-sm font-medium">Loading maintenance work orders...</p>
          </div>
        ) : tickets.length === 0 ? (
          <div className="p-16 text-center border border-dashed border-gray-200 rounded-2xl">
            <Wrench className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <h3 className="text-base font-bold text-gray-800">No Maintenance Tickets Found</h3>
            <p className="text-xs text-gray-500 mt-1 max-w-sm mx-auto">
              {statusFilter !== 'all' || buildingFilter !== 'all' || searchQuery
                ? 'No tickets match the selected filters.'
                : 'All maintenance orders are completed and your properties are in top shape!'}
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {tickets.map((ticket) => {
              const isOpen = ticket.status === 'open';
              const isInProgress = ticket.status === 'in_progress';
              const isResolved = ticket.status === 'resolved';

              return (
                <div
                  key={ticket.id}
                  className={`bg-white rounded-2xl border p-5 transition-all hover:shadow-xs flex flex-col lg:flex-row lg:items-center justify-between gap-4 ${
                    isOpen ? 'border-rose-200 bg-rose-50/10' : isInProgress ? 'border-amber-200 bg-amber-50/10' : 'border-gray-200'
                  }`}
                >
                  {/* Left Ticket Info */}
                  <div className="space-y-2 flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-mono text-xs font-bold text-gray-400 bg-gray-100 px-2 py-0.5 rounded-md">
                        #{ticket.id}
                      </span>

                      {/* Category Tag */}
                      <span className="text-[10px] font-extrabold uppercase tracking-wider px-2 py-0.5 rounded-md bg-blue-50 text-blue-700 border border-blue-100">
                        {ticket.category}
                      </span>

                      {/* Priority Tag */}
                      <span className={`text-[10px] font-extrabold uppercase tracking-wider px-2 py-0.5 rounded-md ${
                        ticket.priority.toLowerCase() === 'urgent' || ticket.priority.toLowerCase() === 'emergency'
                          ? 'bg-rose-100 text-rose-800 font-black animate-pulse'
                          : ticket.priority.toLowerCase() === 'high'
                          ? 'bg-amber-100 text-amber-800'
                          : 'bg-gray-100 text-gray-600'
                      }`}>
                        {ticket.priority} Priority
                      </span>

                      {/* Status Tag */}
                      <span className={`inline-flex items-center text-xs font-extrabold px-2.5 py-0.5 rounded-full ${
                        isResolved
                          ? 'bg-emerald-100 text-emerald-800'
                          : isInProgress
                          ? 'bg-amber-100 text-amber-800'
                          : 'bg-rose-100 text-rose-800'
                      }`}>
                        {isResolved ? <CheckCircle2 className="w-3.5 h-3.5 mr-1" /> : <Clock className="w-3.5 h-3.5 mr-1" />}
                        {ticket.status.replace('_', ' ').toUpperCase()}
                      </span>
                    </div>

                    {/* Title & Description */}
                    <div>
                      <h3 className="text-base font-bold text-gray-900">
                        {ticket.title}
                      </h3>
                      <p className="text-xs text-gray-600 mt-1 line-clamp-2 whitespace-pre-line leading-relaxed">
                        {ticket.description}
                      </p>
                    </div>

                    {/* Property & Tenant Meta */}
                    <div className="flex items-center gap-4 flex-wrap text-xs text-gray-500 pt-1">
                      <span className="font-bold text-gray-800 flex items-center gap-1">
                        <Home className="w-3.5 h-3.5 text-blue-600" />
                        {ticket.unit_number} ({ticket.building_name})
                      </span>

                      <span className="flex items-center gap-1 text-gray-600">
                        <User className="w-3.5 h-3.5 text-gray-400" />
                        {ticket.tenant_name}
                      </span>

                      {ticket.tenant_phone && (
                        <span className="flex items-center gap-1 text-gray-600">
                          <Phone className="w-3.5 h-3.5 text-gray-400" />
                          {ticket.tenant_phone}
                        </span>
                      )}

                      <span className="text-[11px] text-gray-400">
                        {new Date(ticket.created_at).toLocaleString('en-US', { dateStyle: 'medium', timeStyle: 'short' })}
                      </span>
                    </div>

                    {/* Attached Photos Thumbnail list */}
                    {ticket.photos && ticket.photos.length > 0 && (
                      <div className="flex items-center gap-2 pt-1">
                        <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider flex items-center gap-1">
                          <ImageIcon className="w-3 h-3" />
                          Photos ({ticket.photos.length}):
                        </span>
                        <div className="flex items-center gap-1.5 overflow-x-auto">
                          {ticket.photos.map((url, idx) => (
                            <button
                              key={idx}
                              type="button"
                              onClick={() => setActivePhotoUrl(url)}
                              className="w-9 h-9 rounded-lg border border-gray-200 overflow-hidden hover:opacity-80 transition-opacity flex-shrink-0"
                            >
                              <img src={url} alt={`Photo ${idx + 1}`} className="w-full h-full object-cover" />
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Right Actions */}
                  <div className="flex items-center lg:flex-col justify-end gap-2 pt-2 lg:pt-0 border-t lg:border-t-0 border-gray-100 flex-shrink-0">
                    {/* Status Toggle Quick Button */}
                    {isOpen && (
                      <button
                        onClick={() => handleUpdateStatus(ticket.id, 'in_progress')}
                        className="bg-amber-50 hover:bg-amber-100 text-amber-700 font-bold px-3 py-1.5 rounded-xl text-xs border border-amber-200 transition-colors flex items-center gap-1"
                      >
                        <Clock className="w-3.5 h-3.5" />
                        <span>Start Work</span>
                      </button>
                    )}

                    {isInProgress && (
                      <button
                        onClick={() => handleUpdateStatus(ticket.id, 'resolved')}
                        className="bg-emerald-50 hover:bg-emerald-100 text-emerald-700 font-bold px-3 py-1.5 rounded-xl text-xs border border-emerald-200 transition-colors flex items-center gap-1"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>Resolve</span>
                      </button>
                    )}

                    {isResolved && (
                      <button
                        onClick={() => handleUpdateStatus(ticket.id, 'open')}
                        className="bg-gray-50 hover:bg-gray-100 text-gray-600 font-bold px-3 py-1.5 rounded-xl text-xs border border-gray-200 transition-colors flex items-center gap-1"
                      >
                        <RefreshCw className="w-3.5 h-3.5" />
                        <span>Reopen</span>
                      </button>
                    )}

                    {/* Manage Details button */}
                    <button
                      onClick={() => openDetailModal(ticket)}
                      className="bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold px-3 py-1.5 rounded-xl text-xs transition-colors flex items-center gap-1"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                      <span>Details & Notes</span>
                    </button>

                    <button
                      onClick={() => handleDeleteTicket(ticket.id)}
                      className="p-1.5 text-gray-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                      title="Delete Ticket"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* DETAIL / STATUS UPDATE MODAL */}
      {selectedTicketForDetail && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl max-w-xl w-full shadow-2xl overflow-hidden border border-gray-200 max-h-[90vh] flex flex-col">
            <div className="px-6 py-4 bg-gray-50 border-b border-gray-200 flex justify-between items-center">
              <div>
                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                  Work Order #{selectedTicketForDetail.id}
                </span>
                <h3 className="text-base font-bold text-gray-900">{selectedTicketForDetail.title}</h3>
              </div>
              <button
                onClick={() => setSelectedTicketForDetail(null)}
                className="text-gray-400 hover:text-gray-600 p-1 rounded-xl"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4 overflow-y-auto">
              {/* Unit & Tenant Summary Box */}
              <div className="bg-gray-50 rounded-2xl p-4 border border-gray-200 text-xs grid grid-cols-2 gap-3">
                <div>
                  <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">Assigned Unit</span>
                  <span className="font-bold text-gray-900 block mt-0.5">{selectedTicketForDetail.unit_number}</span>
                  <span className="text-gray-500">{selectedTicketForDetail.building_name}</span>
                </div>
                <div>
                  <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">Resident</span>
                  <span className="font-bold text-gray-900 block mt-0.5">{selectedTicketForDetail.tenant_name}</span>
                  <span className="text-gray-500">{selectedTicketForDetail.tenant_phone || selectedTicketForDetail.tenant_email || 'No contact phone'}</span>
                </div>
              </div>

              {/* Full Description / Activity History */}
              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                  Issue Description & Log
                </label>
                <div className="bg-gray-50 rounded-2xl p-4 border border-gray-200 text-xs text-gray-800 whitespace-pre-line leading-relaxed max-h-48 overflow-y-auto font-sans">
                  {selectedTicketForDetail.description}
                </div>
              </div>

              {/* Photos Gallery */}
              {selectedTicketForDetail.photos && selectedTicketForDetail.photos.length > 0 && (
                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                    Attached Incident Photos ({selectedTicketForDetail.photos.length})
                  </label>
                  <div className="flex items-center gap-2 overflow-x-auto pb-1">
                    {selectedTicketForDetail.photos.map((url, i) => (
                      <button
                        key={i}
                        type="button"
                        onClick={() => setActivePhotoUrl(url)}
                        className="w-16 h-16 rounded-xl border border-gray-200 overflow-hidden hover:opacity-90 flex-shrink-0"
                      >
                        <img src={url} alt={`Photo ${i + 1}`} className="w-full h-full object-cover" />
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Update Status Form */}
              <div className="pt-2 border-t border-gray-200 space-y-3">
                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                    Change Ticket Status
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    <button
                      type="button"
                      onClick={() => setNewStatus('open')}
                      className={`py-2 px-3 rounded-xl text-xs font-bold border transition-all ${
                        newStatus === 'open'
                          ? 'bg-rose-600 text-white border-rose-600'
                          : 'bg-white text-gray-700 border-gray-200 hover:bg-gray-50'
                      }`}
                    >
                      Open
                    </button>
                    <button
                      type="button"
                      onClick={() => setNewStatus('in_progress')}
                      className={`py-2 px-3 rounded-xl text-xs font-bold border transition-all ${
                        newStatus === 'in_progress'
                          ? 'bg-amber-500 text-white border-amber-500'
                          : 'bg-white text-gray-700 border-gray-200 hover:bg-gray-50'
                      }`}
                    >
                      In Progress
                    </button>
                    <button
                      type="button"
                      onClick={() => setNewStatus('resolved')}
                      className={`py-2 px-3 rounded-xl text-xs font-bold border transition-all ${
                        newStatus === 'resolved'
                          ? 'bg-emerald-600 text-white border-emerald-600'
                          : 'bg-white text-gray-700 border-gray-200 hover:bg-gray-50'
                      }`}
                    >
                      Resolved
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    Add Progress Note / Contractor Log (Optional)
                  </label>
                  <textarea
                    rows={2}
                    value={resolutionNote}
                    onChange={(e) => setResolutionNote(e.target.value)}
                    placeholder="e.g. Plumber dispatched, leaking valve replaced with new unit."
                    className="w-full px-3.5 py-2 border border-gray-300 rounded-xl text-xs text-gray-900 focus:ring-2 focus:ring-amber-500 outline-none"
                  />
                  <span className="text-[10px] text-gray-400">Tenant will receive an in-app notification with this update note.</span>
                </div>
              </div>

              <div className="pt-3 flex justify-between items-center border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => handleDeleteTicket(selectedTicketForDetail.id)}
                  className="text-xs text-rose-600 hover:text-rose-700 font-bold flex items-center gap-1 p-1"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Delete Order</span>
                </button>

                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setSelectedTicketForDetail(null)}
                    className="px-4 py-2 text-xs font-bold text-gray-600 hover:bg-gray-100 rounded-xl"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    disabled={updatingStatus}
                    onClick={() => handleUpdateStatus(selectedTicketForDetail.id, newStatus, resolutionNote)}
                    className="px-5 py-2 text-xs font-bold text-white bg-amber-600 hover:bg-amber-700 rounded-xl transition-all shadow-sm active:scale-95 disabled:opacity-50"
                  >
                    {updatingStatus ? 'Updating...' : 'Save Ticket Updates'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* CREATE NEW WORK ORDER MODAL */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl max-w-lg w-full shadow-2xl overflow-hidden border border-gray-200 max-h-[90vh] flex flex-col">
            <div className="px-6 py-4 bg-gray-50 border-b border-gray-200 flex justify-between items-center">
              <div>
                <h3 className="text-base font-bold text-gray-900">New Maintenance Work Order</h3>
                <p className="text-xs text-gray-500">Log a repair or maintenance task for a unit.</p>
              </div>
              <button
                onClick={() => setIsCreateModalOpen(false)}
                className="text-gray-400 hover:text-gray-600 p-1 rounded-xl"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateSubmit} className="p-6 space-y-4 overflow-y-auto">
              {createError && (
                <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-xs font-semibold flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />
                  <span>{createError}</span>
                </div>
              )}

              {/* Property Unit Select */}
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Target Property Unit *</label>
                <select
                  value={createUnitId}
                  onChange={(e) => handleUnitSelectChange(e.target.value)}
                  className="w-full px-3.5 py-2 border border-gray-300 rounded-xl text-xs font-bold text-gray-900 focus:ring-2 focus:ring-amber-500 outline-none"
                  required
                >
                  <option value="" disabled>Select assigned unit...</option>
                  {units.map(u => (
                    <option key={u.id} value={u.id.toString()}>
                      {u.unit_number} ({u.building_name || 'Property'})
                    </option>
                  ))}
                </select>
              </div>

              {/* Tenant Assignment (Optional) */}
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Associated Resident (Optional)</label>
                <select
                  value={createTenantId}
                  onChange={(e) => setCreateTenantId(e.target.value)}
                  className="w-full px-3.5 py-2 border border-gray-300 rounded-xl text-xs font-medium text-gray-900 focus:ring-2 focus:ring-amber-500 outline-none"
                >
                  <option value="">No resident assigned / Building level</option>
                  {tenants.map(t => (
                    <option key={t.id} value={t.id.toString()}>
                      {t.full_name} ({t.unit_number})
                    </option>
                  ))}
                </select>
              </div>

              {/* Category & Priority Grid */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Issue Category</label>
                  <select
                    value={createCategory}
                    onChange={(e) => setCreateCategory(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-xl text-xs font-medium text-gray-900 outline-none"
                  >
                    <option value="Plumbing">Plumbing</option>
                    <option value="Electrical">Electrical</option>
                    <option value="Aircon/HVAC">Aircon / HVAC</option>
                    <option value="Carpentry">Carpentry & Locks</option>
                    <option value="Appliance">Appliance</option>
                    <option value="General">General Maintenance</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Priority Level</label>
                  <select
                    value={createPriority}
                    onChange={(e) => setCreatePriority(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-xl text-xs font-medium text-gray-900 outline-none"
                  >
                    <option value="Low">Low</option>
                    <option value="Normal">Normal</option>
                    <option value="High">High</option>
                    <option value="Urgent">Urgent / Emergency</option>
                  </select>
                </div>
              </div>

              {/* Title */}
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Subject Title *</label>
                <input
                  type="text"
                  value={createTitle}
                  onChange={(e) => setCreateTitle(e.target.value)}
                  placeholder="e.g. Bathroom sink pipe leakage"
                  className="w-full px-3.5 py-2 border border-gray-300 rounded-xl text-xs font-semibold text-gray-900 focus:ring-2 focus:ring-amber-500 outline-none"
                  required
                />
              </div>

              {/* Description */}
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Problem Description *</label>
                <textarea
                  rows={3}
                  value={createDescription}
                  onChange={(e) => setCreateDescription(e.target.value)}
                  placeholder="Detailed notes on what needs repair or servicing..."
                  className="w-full px-3.5 py-2 border border-gray-300 rounded-xl text-xs text-gray-900 focus:ring-2 focus:ring-amber-500 outline-none"
                  required
                />
              </div>

              {/* Photo URL */}
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Photo Reference URL (Optional)</label>
                <input
                  type="url"
                  value={createPhotoUrl}
                  onChange={(e) => setCreatePhotoUrl(e.target.value)}
                  placeholder="https://example.com/damage-photo.jpg"
                  className="w-full px-3.5 py-2 border border-gray-300 rounded-xl text-xs text-gray-900 focus:ring-2 focus:ring-amber-500 outline-none"
                />
              </div>

              <div className="pt-3 flex justify-end gap-2 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(false)}
                  className="px-4 py-2 text-xs font-bold text-gray-600 hover:bg-gray-100 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingCreate}
                  className="px-5 py-2 text-xs font-bold text-white bg-amber-600 hover:bg-amber-700 rounded-xl transition-all shadow-sm active:scale-95 disabled:opacity-50"
                >
                  {submittingCreate ? 'Saving...' : 'Create Work Order'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* LIGHTBOX PHOTO MODAL */}
      {activePhotoUrl && (
        <div 
          onClick={() => setActivePhotoUrl(null)}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-150 cursor-zoom-out"
        >
          <div className="relative max-w-3xl max-h-[85vh]">
            <img src={activePhotoUrl} alt="Inspection Photo" className="max-h-[85vh] max-w-full rounded-2xl object-contain shadow-2xl" />
            <button
              onClick={() => setActivePhotoUrl(null)}
              className="absolute top-3 right-3 bg-black/60 hover:bg-black text-white p-2 rounded-full"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
