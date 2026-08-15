'use client';

import { useState, useEffect, useMemo } from 'react';
import { 
  Building2, 
  Home, 
  Plus, 
  Edit2, 
  Trash2, 
  Search, 
  AlertCircle, 
  RefreshCw, 
  MapPin, 
  CheckCircle2, 
  X, 
  ArrowRight,
  Users,
  Eye,
  Mail,
  Phone,
  Calendar,
  UserCheck,
  Info
} from 'lucide-react';
import { BuildingRecord, UnitRecord, UnitTenant } from '@/lib/propertiesStore';

export default function PropertiesPage() {
  const [activeTab, setActiveTab] = useState<'buildings' | 'units'>('buildings');
  
  const [buildings, setBuildings] = useState<BuildingRecord[]>([]);
  const [units, setUnits] = useState<UnitRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Search & Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedBuildingFilter, setSelectedBuildingFilter] = useState<string>('all');
  const [selectedUnitStatusFilter, setSelectedUnitStatusFilter] = useState<string>('all');

  // Modal Control States
  const [isBuildingModalOpen, setIsBuildingModalOpen] = useState(false);
  const [isUnitModalOpen, setIsUnitModalOpen] = useState(false);
  const [isUnitDetailModalOpen, setIsUnitDetailModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  
  const [editingBuilding, setEditingBuilding] = useState<BuildingRecord | null>(null);
  const [editingUnit, setEditingUnit] = useState<UnitRecord | null>(null);
  const [viewingUnit, setViewingUnit] = useState<UnitRecord | null>(null);
  const [deletingItem, setDeletingItem] = useState<{ type: 'building' | 'unit'; id: number; name: string } | null>(null);

  // Redirect Alert Notice
  const [redirectNotice, setRedirectNotice] = useState<string | null>(null);

  // Form States
  const [buildingFormData, setBuildingFormData] = useState({ name: '', address: '' });
  const [unitFormData, setUnitFormData] = useState({
    building_id: '',
    unit_number: '',
    status: 'vacant' as 'vacant' | 'occupied' | 'maintenance',
    monthly_rent: '15000'
  });

  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // Fetch Data
  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [bRes, uRes] = await Promise.all([
        fetch('/api/admin/buildings'),
        fetch('/api/admin/units')
      ]);
      const bData = await bRes.json();
      const uData = await uRes.json();

      if (bData.success) setBuildings(bData.buildings || []);
      if (uData.success) setUnits(uData.units || []);
    } catch (err: any) {
      setError(err.message || 'Error connecting to server');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Enforce redirection to Buildings if no buildings exist
  const handleTabChange = (tab: 'buildings' | 'units') => {
    if (tab === 'units' && buildings.length === 0) {
      setActiveTab('buildings');
      setRedirectNotice('No buildings exist yet. Please create at least one building before managing units.');
      return;
    }
    setRedirectNotice(null);
    setActiveTab(tab);
  };

  // Open Create Building Modal
  const handleOpenCreateBuilding = () => {
    setEditingBuilding(null);
    setBuildingFormData({ name: '', address: '' });
    setFormError(null);
    setIsBuildingModalOpen(true);
  };

  // Open Edit Building Modal
  const handleOpenEditBuilding = (b: BuildingRecord) => {
    setEditingBuilding(b);
    setBuildingFormData({ name: b.name, address: b.address });
    setFormError(null);
    setIsBuildingModalOpen(true);
  };

  // Open Create Unit Modal
  const handleOpenCreateUnit = () => {
    if (buildings.length === 0) {
      setRedirectNotice('No buildings exist yet. Please create a building first before adding a unit.');
      setActiveTab('buildings');
      handleOpenCreateBuilding();
      return;
    }

    setEditingUnit(null);
    setUnitFormData({
      building_id: buildings[0] ? buildings[0].id.toString() : '',
      unit_number: '',
      status: 'vacant',
      monthly_rent: '15000'
    });
    setFormError(null);
    setIsUnitModalOpen(true);
  };

  // Open Edit Unit Modal
  const handleOpenEditUnit = (u: UnitRecord) => {
    setEditingUnit(u);
    setUnitFormData({
      building_id: u.building_id.toString(),
      unit_number: u.unit_number,
      status: u.status,
      monthly_rent: u.monthly_rent.toString()
    });
    setFormError(null);
    setIsUnitModalOpen(true);
  };

  // Submit Building Form
  const handleSubmitBuilding = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!buildingFormData.name.trim()) {
      setFormError('Building name is required.');
      return;
    }
    if (!buildingFormData.address.trim()) {
      setFormError('Building address is required.');
      return;
    }

    setSubmitting(true);
    try {
      if (editingBuilding) {
        const res = await fetch(`/api/admin/buildings/${editingBuilding.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(buildingFormData)
        });
        const data = await res.json();
        if (!data.success) throw new Error(data.error || 'Failed to update building');
      } else {
        const res = await fetch('/api/admin/buildings', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(buildingFormData)
        });
        const data = await res.json();
        if (!data.success) throw new Error(data.error || 'Failed to create building');
      }

      setIsBuildingModalOpen(false);
      setRedirectNotice(null);
      fetchData();
    } catch (err: any) {
      setFormError(err.message || 'Failed to save building');
    } finally {
      setSubmitting(false);
    }
  };

  // Submit Unit Form
  const handleSubmitUnit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!unitFormData.building_id) {
      setFormError('Please select a building.');
      return;
    }
    if (!unitFormData.unit_number.trim()) {
      setFormError('Unit designation/number is required.');
      return;
    }
    if (!unitFormData.monthly_rent || isNaN(Number(unitFormData.monthly_rent)) || Number(unitFormData.monthly_rent) < 0) {
      setFormError('Please enter a valid monthly rent amount.');
      return;
    }

    setSubmitting(true);
    try {
      if (editingUnit) {
        const computedStatus = (editingUnit?.tenants && editingUnit.tenants.length > 0) ? 'occupied' : 'vacant';
        const res = await fetch(`/api/admin/units/${editingUnit.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            building_id: Number(unitFormData.building_id),
            unit_number: unitFormData.unit_number.trim(),
            status: computedStatus,
            monthly_rent: Number(unitFormData.monthly_rent)
          })
        });
        const data = await res.json();
        if (!data.success) throw new Error(data.error || 'Failed to update unit');
      } else {
        const res = await fetch('/api/admin/units', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            building_id: Number(unitFormData.building_id),
            unit_number: unitFormData.unit_number.trim(),
            status: 'vacant', // New unit has no tenants assigned initially
            monthly_rent: Number(unitFormData.monthly_rent)
          })
        });
        const data = await res.json();
        if (!data.success) throw new Error(data.error || 'Failed to create unit');
      }

      setIsUnitModalOpen(false);
      fetchData();
    } catch (err: any) {
      setFormError(err.message || 'Failed to save unit');
    } finally {
      setSubmitting(false);
    }
  };

  // Delete Action
  const handleDeleteConfirm = async () => {
    if (!deletingItem) return;
    try {
      const endpoint = deletingItem.type === 'building' 
        ? `/api/admin/buildings/${deletingItem.id}` 
        : `/api/admin/units/${deletingItem.id}`;
      
      const res = await fetch(endpoint, { method: 'DELETE' });
      const data = await res.json();
      if (data.success) {
        setIsDeleteModalOpen(false);
        setDeletingItem(null);
        fetchData();
      } else {
        alert(data.error || 'Failed to delete item');
      }
    } catch (err) {
      alert('Error deleting item');
    }
  };

  // Filtered Buildings & Units
  const filteredBuildings = useMemo(() => {
    if (!searchQuery.trim()) return buildings;
    const q = searchQuery.toLowerCase();
    return buildings.filter(b => b.name.toLowerCase().includes(q) || b.address.toLowerCase().includes(q));
  }, [buildings, searchQuery]);

  const filteredUnits = useMemo(() => {
    return units.filter(u => {
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesQuery = 
          u.unit_number.toLowerCase().includes(q) ||
          u.building_name?.toLowerCase().includes(q) ||
          u.tenants?.some(t => t.name.toLowerCase().includes(q) || t.email.toLowerCase().includes(q));
        if (!matchesQuery) return false;
      }
      if (selectedBuildingFilter !== 'all') {
        if (u.building_id.toString() !== selectedBuildingFilter) return false;
      }
      if (selectedUnitStatusFilter !== 'all') {
        if (u.status !== selectedUnitStatusFilter) return false;
      }
      return true;
    });
  }, [units, searchQuery, selectedBuildingFilter, selectedUnitStatusFilter]);

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto space-y-6">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-6 rounded-2xl shadow-sm border border-gray-200/80">
        <div>
          <div className="flex items-center gap-2">
            <Building2 className="w-7 h-7 text-blue-600" />
            <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Buildings & Units Module</h1>
          </div>
          <p className="text-sm text-gray-500 mt-1">
            Manage building properties, configure unit details, and inspect tenant occupancy rosters.
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

          {activeTab === 'buildings' ? (
            <button 
              onClick={handleOpenCreateBuilding}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2.5 rounded-xl text-sm font-semibold shadow-sm transition-all flex items-center gap-2 hover:shadow-md active:scale-98"
            >
              <Plus className="w-4 h-4" />
              <span>Add Building</span>
            </button>
          ) : (
            <button 
              onClick={handleOpenCreateUnit}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2.5 rounded-xl text-sm font-semibold shadow-sm transition-all flex items-center gap-2 hover:shadow-md active:scale-98"
            >
              <Plus className="w-4 h-4" />
              <span>Add Unit</span>
            </button>
          )}
        </div>
      </div>

      {/* Redirect Alert Notice if trying to create units without buildings */}
      {redirectNotice && (
        <div className="p-4 bg-amber-50 border border-amber-200 rounded-2xl flex items-start justify-between gap-3 animate-in fade-in duration-200">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
            <div>
              <h4 className="text-sm font-bold text-amber-900">Building Required</h4>
              <p className="text-xs text-amber-700 mt-0.5">{redirectNotice}</p>
            </div>
          </div>
          <button 
            onClick={() => setRedirectNotice(null)}
            className="text-amber-500 hover:text-amber-700 p-1"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Module Navigation Tabs */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200/80 overflow-hidden">
        <div className="border-b border-gray-200 bg-gray-50/70 px-4 pt-3">
          <nav className="flex space-x-2" aria-label="Property Tabs">
            <button
              onClick={() => handleTabChange('buildings')}
              className={`py-3 px-6 rounded-t-xl font-semibold text-sm transition-all flex items-center gap-2.5 border-t-2 border-x ${
                activeTab === 'buildings'
                  ? 'bg-white border-t-blue-600 border-x-gray-200 text-blue-700 shadow-xs -mb-px'
                  : 'border-transparent text-gray-500 hover:text-gray-800 hover:bg-gray-100/50'
              }`}
            >
              <Building2 className="w-4 h-4" />
              <span>Buildings</span>
              <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${
                activeTab === 'buildings' ? 'bg-blue-100 text-blue-800' : 'bg-gray-200 text-gray-600'
              }`}>
                {buildings.length}
              </span>
            </button>

            <button
              onClick={() => handleTabChange('units')}
              className={`py-3 px-6 rounded-t-xl font-semibold text-sm transition-all flex items-center gap-2.5 border-t-2 border-x ${
                activeTab === 'units'
                  ? 'bg-white border-t-blue-600 border-x-gray-200 text-blue-700 shadow-xs -mb-px'
                  : 'border-transparent text-gray-500 hover:text-gray-800 hover:bg-gray-100/50'
              }`}
            >
              <Home className="w-4 h-4" />
              <span>Units</span>
              <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${
                activeTab === 'units' ? 'bg-blue-100 text-blue-800' : 'bg-gray-200 text-gray-600'
              }`}>
                {units.length}
              </span>
            </button>
          </nav>
        </div>

        {/* Filters Bar */}
        <div className="p-4 border-b border-gray-200 flex flex-col md:flex-row gap-3 justify-between items-stretch md:items-center bg-gray-50/40">
          <div className="relative flex-1 max-w-md">
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-400">
              <Search className="w-4 h-4" />
            </div>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={activeTab === 'buildings' ? 'Search buildings by name or address...' : 'Search units by number, building, or tenant name...'}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-xl bg-white text-sm text-gray-900 placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
            />
            {searchQuery && (
              <button onClick={() => setSearchQuery('')} className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600">
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {activeTab === 'units' && (
            <div className="flex flex-wrap items-center gap-2">
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

              <select
                value={selectedUnitStatusFilter}
                onChange={(e) => setSelectedUnitStatusFilter(e.target.value)}
                className="bg-white border border-gray-300 text-sm font-medium text-gray-700 py-2 px-3 rounded-xl focus:outline-none cursor-pointer"
              >
                <option value="all">All Statuses</option>
                <option value="vacant">Vacant</option>
                <option value="occupied">Occupied</option>
                <option value="maintenance">Maintenance</option>
              </select>
            </div>
          )}
        </div>

        {/* TAB 1: BUILDINGS VIEW */}
        {activeTab === 'buildings' && (
          <div className="p-6">
            {loading ? (
              <div className="p-12 text-center text-gray-500 space-y-3">
                <RefreshCw className="w-8 h-8 text-blue-500 animate-spin mx-auto" />
                <p className="text-sm font-medium text-gray-600">Loading buildings...</p>
              </div>
            ) : filteredBuildings.length === 0 ? (
              <div className="p-12 text-center text-gray-500 space-y-4 max-w-md mx-auto">
                <div className="w-16 h-16 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center mx-auto">
                  <Building2 className="w-8 h-8" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-gray-900">No Buildings Created Yet</h3>
                  <p className="text-xs text-gray-500 mt-1">
                    Before adding individual units, you must first create a building property entry.
                  </p>
                </div>
                <button
                  onClick={handleOpenCreateBuilding}
                  className="inline-flex items-center px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold shadow-sm transition-all"
                >
                  <Plus className="w-4 h-4 mr-1.5" />
                  Create First Building
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                {filteredBuildings.map((building) => {
                  const totalUnits = building.units_count || 0;
                  const occupiedUnits = building.occupied_units || 0;
                  const occupancyPercent = totalUnits > 0 ? Math.round((occupiedUnits / totalUnits) * 100) : 0;

                  return (
                    <div 
                      key={building.id}
                      className="bg-white rounded-2xl shadow-xs border border-gray-200/90 overflow-hidden hover:shadow-md transition-shadow group flex flex-col justify-between"
                    >
                      <div className="p-6">
                        <div className="flex justify-between items-start">
                          <div className="flex items-center gap-3">
                            <div className="p-3 bg-blue-50 text-blue-600 rounded-xl flex-shrink-0">
                              <Building2 className="w-6 h-6" />
                            </div>
                            <div>
                              <h3 className="font-bold text-gray-900 text-base group-hover:text-blue-600 transition-colors">
                                {building.name}
                              </h3>
                              <p className="text-xs text-gray-500 flex items-center gap-1 mt-0.5">
                                <MapPin className="w-3.5 h-3.5 text-gray-400" />
                                <span>{building.address}</span>
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-1">
                            <button 
                              onClick={() => handleOpenEditBuilding(building)}
                              className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                              title="Edit Building Details"
                            >
                              <Edit2 className="w-4 h-4" />
                            </button>
                            <button 
                              onClick={() => {
                                setDeletingItem({ type: 'building', id: building.id, name: building.name });
                                setIsDeleteModalOpen(true);
                              }}
                              className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                              title="Delete Building"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>

                        {/* Building Occupancy Meter */}
                        <div className="mt-6 space-y-2">
                          <div className="flex justify-between items-center text-xs font-semibold">
                            <span className="text-gray-500">Unit Occupancy</span>
                            <span className="text-gray-900">{occupiedUnits} / {totalUnits} Units</span>
                          </div>
                          <div className="w-full bg-gray-100 rounded-full h-2 overflow-hidden">
                            <div 
                              className={`h-2 rounded-full transition-all duration-500 ${
                                occupancyPercent > 80 ? 'bg-emerald-500' : occupancyPercent > 40 ? 'bg-blue-500' : 'bg-amber-500'
                              }`}
                              style={{ width: `${occupancyPercent}%` }}
                            />
                          </div>
                        </div>
                      </div>

                      <div className="bg-gray-50/80 px-6 py-3 border-t border-gray-100 flex justify-between items-center text-xs font-medium text-gray-600">
                        <span>{totalUnits} Configured Units</span>
                        <button
                          onClick={() => {
                            setSelectedBuildingFilter(building.id.toString());
                            setActiveTab('units');
                          }}
                          className="text-blue-600 hover:text-blue-800 font-semibold flex items-center gap-1"
                        >
                          <span>Manage Units</span>
                          <ArrowRight className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* TAB 2: UNITS VIEW */}
        {activeTab === 'units' && (
          <div className="overflow-x-auto">
            {loading ? (
              <div className="p-12 text-center text-gray-500 space-y-3">
                <RefreshCw className="w-8 h-8 text-blue-500 animate-spin mx-auto" />
                <p className="text-sm font-medium text-gray-600">Loading units...</p>
              </div>
            ) : filteredUnits.length === 0 ? (
              <div className="p-12 text-center text-gray-500 space-y-4 max-w-md mx-auto">
                <Home className="w-12 h-12 text-gray-300 mx-auto" />
                <div>
                  <h3 className="text-base font-bold text-gray-900">No Units Configured</h3>
                  <p className="text-xs text-gray-500 mt-1">
                    {searchQuery || selectedBuildingFilter !== 'all' || selectedUnitStatusFilter !== 'all'
                      ? 'No units match your selected search filter criteria.'
                      : 'Add your first property unit to assign default monthly rent and track occupancy.'}
                  </p>
                </div>
                <button
                  onClick={handleOpenCreateUnit}
                  className="inline-flex items-center px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold shadow-sm transition-all"
                >
                  <Plus className="w-4 h-4 mr-1.5" />
                  Add New Unit
                </button>
              </div>
            ) : (
              <table className="min-w-full divide-y divide-gray-200 text-left">
                <thead className="bg-gray-50/80">
                  <tr>
                    <th scope="col" className="px-6 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                      Unit Designation
                    </th>
                    <th scope="col" className="px-6 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                      Building Property
                    </th>
                    <th scope="col" className="px-6 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                      Assigned Tenants (Multi-tenant)
                    </th>
                    <th scope="col" className="px-6 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                      Monthly Rent (Default)
                    </th>
                    <th scope="col" className="px-6 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                      Occupancy Status
                    </th>
                    <th scope="col" className="px-6 py-3.5 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-100">
                  {filteredUnits.map((unit) => {
                    const tenantsList = unit.tenants || [];
                    const hasTenants = tenantsList.length > 0;

                    return (
                      <tr key={unit.id} className="hover:bg-gray-50/80 transition-colors">
                        {/* Unit Designation */}
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center gap-2.5">
                            <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center font-bold text-xs">
                              <Home className="w-4 h-4" />
                            </div>
                            <span className="text-sm font-bold text-gray-900">{unit.unit_number}</span>
                          </div>
                        </td>

                        {/* Building */}
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="text-sm font-medium text-gray-700 flex items-center gap-1.5">
                            <Building2 className="w-4 h-4 text-gray-400" />
                            {unit.building_name}
                          </span>
                        </td>

                        {/* Assigned Tenants (Multi-tenant support) */}
                        <td className="px-6 py-4 whitespace-nowrap">
                          {hasTenants ? (
                            <div className="flex items-center gap-2">
                              <div className="flex -space-x-2 overflow-hidden">
                                {tenantsList.slice(0, 3).map((t, idx) => (
                                  <div 
                                    key={t.id || idx}
                                    className="inline-block h-7 w-7 rounded-full bg-blue-600 text-white font-bold text-xs flex items-center justify-center ring-2 ring-white"
                                    title={`${t.name} (${t.email})`}
                                  >
                                    {t.name ? t.name.substring(0, 2).toUpperCase() : 'TN'}
                                  </div>
                                ))}
                              </div>
                              <div>
                                <span className="text-xs font-bold text-gray-900 block">
                                  {tenantsList[0]?.name}
                                </span>
                                {tenantsList.length > 1 && (
                                  <span className="text-[11px] font-semibold text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded-full inline-block">
                                    +{tenantsList.length - 1} co-tenant{tenantsList.length > 2 ? 's' : ''}
                                  </span>
                                )}
                              </div>
                            </div>
                          ) : (
                            <span className="text-xs text-gray-400 italic flex items-center gap-1">
                              <Users className="w-3.5 h-3.5 text-gray-300" />
                              No active tenants
                            </span>
                          )}
                        </td>

                        {/* Monthly Rent */}
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="text-sm font-bold text-emerald-700">
                            ₱ {Number(unit.monthly_rent).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                          </span>
                          <span className="text-xs text-gray-400 block font-normal">/ month</span>
                        </td>

                        {/* Status */}
                        <td className="px-6 py-4 whitespace-nowrap">
                          {unit.status === 'occupied' || hasTenants ? (
                            <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                              <CheckCircle2 className="w-3 h-3 mr-1 text-emerald-600" />
                              Occupied
                            </span>
                          ) : unit.status === 'maintenance' ? (
                            <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200">
                              <AlertCircle className="w-3 h-3 mr-1 text-amber-600" />
                              Maintenance
                            </span>
                          ) : (
                            <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200">
                              <Home className="w-3 h-3 mr-1 text-blue-600" />
                              Vacant
                            </span>
                          )}
                        </td>

                        {/* Actions */}
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <div className="flex items-center justify-end gap-1">
                            {/* View Unit Details & Tenant Roster button */}
                            <button
                              onClick={() => {
                                setViewingUnit(unit);
                                setIsUnitDetailModalOpen(true);
                              }}
                              className="p-1.5 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                              title="View Unit Details & Tenant Roster"
                            >
                              <Eye className="w-4 h-4" />
                            </button>

                            {/* Edit button */}
                            <button 
                              onClick={() => handleOpenEditUnit(unit)}
                              className="p-1.5 text-gray-500 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition-colors"
                              title="Edit Unit Details"
                            >
                              <Edit2 className="w-4 h-4" />
                            </button>

                            {/* Delete button */}
                            <button 
                              onClick={() => {
                                setDeletingItem({ type: 'unit', id: unit.id, name: `${unit.unit_number} (${unit.building_name})` });
                                setIsDeleteModalOpen(true);
                              }}
                              className="p-1.5 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                              title="Delete Unit"
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
        )}
      </div>

      {/* VIEW UNIT DETAILS & MULTI-TENANT ROSTER MODAL */}
      {isUnitDetailModalOpen && viewingUnit && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl max-w-xl w-full shadow-2xl overflow-hidden border border-gray-200">
            <div className="px-6 py-4 bg-gray-900 text-white flex justify-between items-center">
              <div className="flex items-center gap-2">
                <Home className="w-5 h-5 text-blue-400" />
                <h3 className="text-base font-bold">{viewingUnit.unit_number} Details & Tenant Roster</h3>
              </div>
              <button 
                onClick={() => setIsUnitDetailModalOpen(false)}
                className="text-gray-400 hover:text-white p-1 rounded-lg hover:bg-gray-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-6">
              {/* Unit Summary Card */}
              <div className="grid grid-cols-3 gap-3 bg-gray-50 p-4 rounded-xl text-xs">
                <div>
                  <span className="text-gray-500 font-medium uppercase tracking-wider block">Property:</span>
                  <p className="font-bold text-gray-900 text-sm mt-0.5">{viewingUnit.building_name}</p>
                </div>
                <div>
                  <span className="text-gray-500 font-medium uppercase tracking-wider block">Monthly Rent:</span>
                  <p className="font-bold text-emerald-700 text-sm mt-0.5">₱ {Number(viewingUnit.monthly_rent).toLocaleString('en-US', { minimumFractionDigits: 2 })}</p>
                </div>
                <div>
                  <span className="text-gray-500 font-medium uppercase tracking-wider block">Occupancy:</span>
                  <p className="font-bold text-gray-900 text-sm mt-0.5 flex items-center gap-1">
                    <Users className="w-3.5 h-3.5 text-blue-600" />
                    {viewingUnit.tenants?.length || 0} Tenant{(viewingUnit.tenants?.length || 0) === 1 ? '' : 's'}
                  </p>
                </div>
              </div>

              {/* Tenant Roster Section */}
              <div>
                <div className="flex justify-between items-center mb-3">
                  <h4 className="text-sm font-bold text-gray-900 flex items-center gap-2">
                    <UserCheck className="w-4 h-4 text-blue-600" />
                    <span>Assigned Tenants Roster</span>
                  </h4>
                  <span className="text-xs font-semibold text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full">
                    {viewingUnit.tenants?.length || 0} Registered
                  </span>
                </div>

                {!viewingUnit.tenants || viewingUnit.tenants.length === 0 ? (
                  <div className="p-6 bg-gray-50/70 rounded-xl text-center text-gray-500 space-y-1">
                    <Users className="w-8 h-8 text-gray-300 mx-auto" />
                    <p className="text-xs font-medium text-gray-700">No Active Tenants Assigned</p>
                    <p className="text-[11px] text-gray-400">This unit is currently vacant. Assign tenants via Tenants & Leases module.</p>
                  </div>
                ) : (
                  <div className="space-y-3 max-h-60 overflow-y-auto pr-1">
                    {viewingUnit.tenants.map((t, idx) => (
                      <div key={t.id || idx} className="p-3.5 border border-gray-200 rounded-xl bg-white flex items-start justify-between gap-3 shadow-2xs">
                        <div className="flex items-start gap-3">
                          <div className="w-9 h-9 rounded-full bg-blue-100 text-blue-700 font-bold text-xs flex items-center justify-center flex-shrink-0 mt-0.5">
                            {t.name ? t.name.substring(0, 2).toUpperCase() : 'TN'}
                          </div>
                          <div>
                            <h5 className="text-sm font-bold text-gray-900">{t.name}</h5>
                            <div className="space-y-0.5 mt-1 text-xs text-gray-500">
                              <p className="flex items-center gap-1.5">
                                <Mail className="w-3 h-3 text-gray-400" />
                                <span>{t.email}</span>
                              </p>
                              {t.emergency_contact && (
                                <p className="flex items-center gap-1.5">
                                  <Phone className="w-3 h-3 text-gray-400" />
                                  <span>Emergency: {t.emergency_contact}</span>
                                </p>
                              )}
                              {t.move_in_date && (
                                <p className="flex items-center gap-1.5 text-gray-400">
                                  <Calendar className="w-3 h-3 text-gray-400" />
                                  <span>Move-in: {new Date(t.move_in_date).toLocaleDateString()}</span>
                                </p>
                              )}
                            </div>
                          </div>
                        </div>

                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                          Active Lease
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Footer */}
              <div className="flex justify-end pt-2 border-t border-gray-100">
                <button
                  onClick={() => setIsUnitDetailModalOpen(false)}
                  className="px-5 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-xl transition-colors"
                >
                  Close Details
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* CREATE / EDIT BUILDING MODAL */}
      {isBuildingModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl overflow-hidden border border-gray-200">
            <div className="px-6 py-4 bg-gray-50 border-b border-gray-200 flex justify-between items-center">
              <h3 className="text-lg font-bold text-gray-900">
                {editingBuilding ? 'Edit Building Details' : 'Add New Building'}
              </h3>
              <button onClick={() => setIsBuildingModalOpen(false)} className="text-gray-400 hover:text-gray-600 p-1 rounded-lg">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmitBuilding} className="p-6 space-y-4">
              {formError && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-red-700 text-xs font-semibold flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />
                  <span>{formError}</span>
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">
                  Building Name
                </label>
                <input
                  type="text"
                  value={buildingFormData.name}
                  onChange={(e) => setBuildingFormData(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="e.g. Sunrise Apartments"
                  className="w-full px-3.5 py-2 border border-gray-300 rounded-xl text-sm text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">
                  Address / Location
                </label>
                <input
                  type="text"
                  value={buildingFormData.address}
                  onChange={(e) => setBuildingFormData(prev => ({ ...prev, address: e.target.value }))}
                  placeholder="e.g. 123 Main Street, City"
                  className="w-full px-3.5 py-2 border border-gray-300 rounded-xl text-sm text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                  required
                />
              </div>

              <div className="pt-3 flex justify-end gap-3 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setIsBuildingModalOpen(false)}
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
                  <span>{editingBuilding ? 'Save Changes' : 'Create Building'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* CREATE / EDIT UNIT MODAL */}
      {isUnitModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl overflow-hidden border border-gray-200">
            <div className="px-6 py-4 bg-gray-50 border-b border-gray-200 flex justify-between items-center">
              <h3 className="text-lg font-bold text-gray-900">
                {editingUnit ? `Edit Unit (${editingUnit.unit_number})` : 'Add New Property Unit'}
              </h3>
              <button onClick={() => setIsUnitModalOpen(false)} className="text-gray-400 hover:text-gray-600 p-1 rounded-lg">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmitUnit} className="p-6 space-y-4">
              {formError && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-red-700 text-xs font-semibold flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />
                  <span>{formError}</span>
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">
                  Building Property
                </label>
                <select
                  value={unitFormData.building_id}
                  onChange={(e) => setUnitFormData(prev => ({ ...prev, building_id: e.target.value }))}
                  className="w-full px-3.5 py-2 border border-gray-300 rounded-xl text-sm text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                  required
                >
                  {buildings.map(b => (
                    <option key={b.id} value={b.id.toString()}>{b.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">
                  Unit Number / Name
                </label>
                <input
                  type="text"
                  value={unitFormData.unit_number}
                  onChange={(e) => setUnitFormData(prev => ({ ...prev, unit_number: e.target.value }))}
                  placeholder="e.g. Unit 204 or Apt 101"
                  className="w-full px-3.5 py-2 border border-gray-300 rounded-xl text-sm text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">
                  Monthly Rent (₱)
                </label>
                <div className="relative">
                  <span className="absolute left-3.5 top-2.5 text-gray-400 text-sm font-semibold">₱</span>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={unitFormData.monthly_rent}
                    onChange={(e) => setUnitFormData(prev => ({ ...prev, monthly_rent: e.target.value }))}
                    placeholder="15000.00"
                    className="w-full pl-8 pr-3.5 py-2 border border-gray-300 rounded-xl text-sm font-semibold text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                    required
                  />
                </div>
              </div>

              <div className="p-3.5 bg-blue-50/70 border border-blue-200/80 rounded-xl text-xs text-blue-900 flex items-start gap-2.5">
                <Info className="w-4 h-4 text-blue-600 flex-shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold block text-blue-950">Unit Status (Auto-Managed)</span>
                  <p className="mt-0.5 text-blue-800 leading-relaxed">
                    Status is automatically managed based on tenant presence: <strong>Occupied</strong> when assigned tenants exist, or <strong>Vacant</strong> when empty.
                  </p>
                </div>
              </div>

              <div className="pt-3 flex justify-end gap-3 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setIsUnitModalOpen(false)}
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
                  <span>{editingUnit ? 'Save Changes' : 'Create Unit'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* DELETE CONFIRMATION MODAL */}
      {isDeleteModalOpen && deletingItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl p-6 space-y-4 border border-gray-200 text-center">
            <div className="w-12 h-12 rounded-full bg-red-100 text-red-600 flex items-center justify-center mx-auto">
              <Trash2 className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-gray-900">Delete {deletingItem.type === 'building' ? 'Building' : 'Unit'}</h3>
              <p className="text-xs text-gray-500 mt-1">
                Are you sure you want to permanently delete <strong className="text-gray-800">{deletingItem.name}</strong>?
                {deletingItem.type === 'building' && ' Deleting a building will also delete its assigned units.'} This action cannot be undone.
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
                Yes, Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
