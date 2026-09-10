"use client";

import { useState, useEffect, useMemo } from "react";
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
  CheckCircle2,
  CreditCard,
  Wrench,
  Shield,
  ExternalLink,
  MapPin,
  Clock,
  AlertTriangle,
  ChevronRight,
  Copy,
  Check,
} from "lucide-react";
import { TenantRecord, TenantDetailsData } from "@/lib/tenantsStore";
import { UnitRecord } from "@/lib/propertiesStore";

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
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedBuildingFilter, setSelectedBuildingFilter] =
    useState<string>("all");

  // Modals
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

  const [editingTenant, setEditingTenant] = useState<TenantRecord | null>(null);
  const [viewingTenant, setViewingTenant] = useState<TenantRecord | null>(null);
  const [deletingTenant, setDeletingTenant] = useState<TenantRecord | null>(
    null,
  );

  // Dossier & Modal Tab State
  const [activeDetailTab, setActiveDetailTab] = useState<
    "profile" | "lease" | "billings" | "maintenance"
  >("profile");
  const [dossierLoading, setDossierLoading] = useState(false);
  const [dossierData, setDossierData] = useState<TenantDetailsData | null>(
    null,
  );
  const [previewPhoto, setPreviewPhoto] = useState<string | null>(null);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  const handleCopy = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  // Form State
  const getDefaultMoveIn = () => new Date().toISOString().split("T")[0];

  const [formData, setFormData] = useState({
    first_name: "",
    last_name: "",
    email: "",
    phone: "",
    address: "",
    id_type: "",
    id_number: "",
    emergency_contact: "",
    unit_id: "",
    move_in_date: "",
    move_out_date: "",
    document_url: "",
    password: "",
  });

  useEffect(() => {
    setFormData((prev) => ({
      ...prev,
      move_in_date: getDefaultMoveIn(),
      move_out_date: "",
    }));
  }, []);
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // Fetch Data
  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [tRes, uRes, bRes] = await Promise.all([
        fetch("/api/admin/tenants"),
        fetch("/api/admin/units"),
        fetch("/api/admin/buildings"),
      ]);
      const tData = await tRes.json();
      const uData = await uRes.json();
      const bData = await bRes.json();

      if (tData.success) setTenants(tData.tenants || []);
      if (uData.success) setUnits(uData.units || []);
      if (bData.success) setBuildings(bData.buildings || []);
    } catch (err: any) {
      setError(err.message || "Error fetching data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Filtered Tenants
  const filteredTenants = useMemo(() => {
    return tenants.filter((t) => {
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchesQuery =
          t.full_name.toLowerCase().includes(q) ||
          (t.email && t.email.toLowerCase().includes(q)) ||
          (t.phone && t.phone.toLowerCase().includes(q)) ||
          t.unit_number.toLowerCase().includes(q) ||
          t.building_name.toLowerCase().includes(q);
        if (!matchesQuery) return false;
      }
      if (selectedBuildingFilter !== "all") {
        if (t.building_id.toString() !== selectedBuildingFilter) return false;
      }
      return true;
    });
  }, [tenants, searchQuery, selectedBuildingFilter]);

  // Open Tenant Dossier Modal
  const handleOpenTenantDossier = async (
    t: TenantRecord,
    initialTab: "profile" | "lease" | "billings" | "maintenance" = "profile",
  ) => {
    setViewingTenant(t);
    setActiveDetailTab(initialTab);
    setIsDetailModalOpen(true);
    setDossierLoading(true);
    setDossierData(null);
    try {
      const res = await fetch(`/api/admin/tenants/${t.id}`);
      const data = await res.json();
      if (data.success) {
        setDossierData(data);
      }
    } catch (err) {
      console.error("Error fetching tenant details:", err);
    } finally {
      setDossierLoading(false);
    }
  };

  // Open Create Tenant Modal
  const handleOpenCreateModal = () => {
    setEditingTenant(null);
    setFormData({
      first_name: "",
      last_name: "",
      email: "",
      phone: "",
      address: "",
      id_type: "",
      id_number: "",
      emergency_contact: "",
      unit_id: units[0] ? units[0].id.toString() : "",
      move_in_date: getDefaultMoveIn(),
      move_out_date: "",
      document_url: "",
      password: "",
    });
    setFormError(null);
    setIsFormModalOpen(true);
  };

  // Open Edit Tenant Modal
  const handleOpenEditModal = (t: TenantRecord) => {
    setEditingTenant(t);
    setFormData({
      first_name: t.first_name || t.full_name.split(" ")[0] || "",
      last_name: t.last_name || t.full_name.split(" ").slice(1).join(" ") || "",
      email: t.email || "",
      phone: t.phone || "",
      address: t.address || "",
      id_type: t.id_type || "",
      id_number: t.id_number || "",
      emergency_contact:
        t.emergency_contact === "N/A" ? "" : t.emergency_contact || "",
      unit_id: t.unit_id.toString(),
      move_in_date: t.move_in_date || getDefaultMoveIn(),
      move_out_date: t.move_out_date || "",
      document_url: t.document_url || "",
      password: "",
    });
    setFormError(null);
    setIsFormModalOpen(true);
  };

  // Submit Form (Create / Edit)
  const handleSubmitForm = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!formData.first_name.trim()) {
      setFormError("First name is required.");
      return;
    }
    if (!formData.last_name.trim()) {
      setFormError("Last name is required.");
      return;
    }

    if (!formData.unit_id) {
      setFormError("Please assign a property unit to the tenant.");
      return;
    }
    if (!formData.move_in_date) {
      setFormError("Lease move-in date is required.");
      return;
    }

    setSubmitting(true);
    try {
      if (editingTenant) {
        // UPDATE
        const res = await fetch(`/api/admin/tenants/${editingTenant.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            first_name: formData.first_name.trim(),
            last_name: formData.last_name.trim(),
            email: formData.email.trim(),
            phone: formData.phone.trim(),
            address: formData.address.trim(),
            id_type: formData.id_type.trim(),
            id_number: formData.id_number.trim(),
            emergency_contact: formData.emergency_contact.trim(),
            unit_id: Number(formData.unit_id),
            move_in_date: formData.move_in_date,
            move_out_date: formData.move_out_date
              ? formData.move_out_date
              : null,
            document_url: formData.document_url.trim(),
            password: formData.password.trim() || undefined,
          }),
        });
        const data = await res.json();
        if (!data.success)
          throw new Error(data.error || "Failed to update tenant record");
      } else {
        // CREATE
        const res = await fetch("/api/admin/tenants", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            first_name: formData.first_name.trim(),
            last_name: formData.last_name.trim(),
            email: formData.email.trim(),
            phone: formData.phone.trim(),
            address: formData.address.trim(),
            id_type: formData.id_type.trim(),
            id_number: formData.id_number.trim(),
            emergency_contact: formData.emergency_contact.trim(),
            unit_id: Number(formData.unit_id),
            move_in_date: formData.move_in_date,
            move_out_date: formData.move_out_date
              ? formData.move_out_date
              : null,
            document_url: formData.document_url.trim(),
            password: formData.password,
          }),
        });
        const data = await res.json();
        if (!data.success)
          throw new Error(data.error || "Failed to create tenant record");
      }

      setIsFormModalOpen(false);
      fetchData();
      if (viewingTenant) {
        handleOpenTenantDossier(viewingTenant, activeDetailTab);
      }
    } catch (err: any) {
      setFormError(err.message || "An error occurred while saving.");
    } finally {
      setSubmitting(false);
    }
  };

  const [isDeleting, setIsDeleting] = useState(false);

  // Delete Action
  const handleDeleteConfirm = async () => {
    if (!deletingTenant) return;
    setIsDeleting(true);
    try {
      const res = await fetch(`/api/admin/tenants/${deletingTenant.id}`, {
        method: "DELETE",
      });
      const data = await res.json();
      if (data.success) {
        setIsDeleteModalOpen(false);
        setDeletingTenant(null);
        fetchData();
      } else {
        alert(data.error || "Failed to delete tenant");
      }
    } catch (err) {
      alert("Error deleting tenant");
    } finally {
      setIsDeleting(false);
    }
  };

  // Export CSV
  const handleExportCSV = () => {
    const headers = [
      "Tenant ID",
      "Full Name",
      "Email",
      "Contact Number",
      "Unit",
      "Building",
      "Move In",
      "Move Out",
      "Status",
    ];
    const rows = filteredTenants.map((t) => [
      `#${t.id}`,
      `"${t.full_name}"`,
      `"${t.email}"`,
      `"${t.phone || ""}"`,
      `"${t.unit_number}"`,
      `"${t.building_name}"`,
      t.move_in_date || "",
      t.move_out_date || "",
      t.status,
    ]);

    const csvContent =
      "data:text/csv;charset=utf-8," +
      [headers.join(","), ...rows.map((e) => e.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute(
      "download",
      `tenants_roster_${new Date().toISOString().split("T")[0]}.csv`,
    );
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
            <h1 className="text-2xl font-bold text-gray-900 tracking-tight">
              Tenants & Lease Contracts
            </h1>
          </div>
          <p className="text-sm text-gray-500 mt-1">
            Register tenant profiles, assign property units, and configure lease
            agreement terms.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={fetchData}
            className="p-2.5 text-gray-600 bg-gray-50 hover:bg-gray-100 border border-gray-200 rounded-xl transition-colors flex items-center gap-2 text-sm font-medium"
            title="Refresh List"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
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
          <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
            Active Tenants
          </span>
          <p className="text-2xl font-extrabold text-gray-900 mt-2">
            {tenants.length}
          </p>
          <p className="text-xs text-emerald-600 font-medium mt-1">
            Registered leaseholders
          </p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-gray-200/80 shadow-xs">
          <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
            Units Occupied
          </span>
          <p className="text-2xl font-extrabold text-blue-600 mt-2">
            {new Set(tenants.map((t) => t.unit_id)).size}
          </p>
          <p className="text-xs text-gray-500 mt-1">Active property units</p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-gray-200/80 shadow-xs">
          <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
            Leases Active
          </span>
          <p className="text-2xl font-extrabold text-emerald-600 mt-2">
            {tenants.filter((t) => t.status === "active").length}
          </p>
          <p className="text-xs text-gray-500 mt-1">100% compliant</p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-gray-200/80 shadow-xs">
          <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
            Total Properties
          </span>
          <p className="text-2xl font-extrabold text-gray-900 mt-2">
            {buildings.length}
          </p>
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
              placeholder="Search by Tenant Name, Contact Number, Email, Unit, or Building..."
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-xl bg-white text-sm text-gray-900 placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600"
              >
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
              {buildings.map((b) => (
                <option key={b.id} value={b.id.toString()}>
                  {b.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Table Content */}
        <div className="overflow-x-auto">
          {loading ? (
            <div className="p-12 text-center text-gray-500 space-y-3">
              <RefreshCw className="w-8 h-8 text-blue-500 animate-spin mx-auto" />
              <p className="text-sm font-medium text-gray-600">
                Loading tenants & lease contracts...
              </p>
            </div>
          ) : filteredTenants.length === 0 ? (
            <div className="p-12 text-center text-gray-500 space-y-3">
              <Users className="w-12 h-12 text-gray-300 mx-auto" />
              <p className="text-base font-semibold text-gray-800">
                No tenant records found
              </p>
              <p className="text-xs text-gray-500 max-w-sm mx-auto">
                {searchQuery || selectedBuildingFilter !== "all"
                  ? "No tenants match your search filter criteria."
                  : "Get started by creating your first tenant profile and assigning a unit."}
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
                  <th
                    scope="col"
                    className="px-6 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wider"
                  >
                    Tenant Profile
                  </th>
                  <th
                    scope="col"
                    className="px-6 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wider"
                  >
                    Assigned Unit & Property
                  </th>
                  <th
                    scope="col"
                    className="px-6 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wider"
                  >
                    Lease Duration
                  </th>
                  <th
                    scope="col"
                    className="px-6 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wider"
                  >
                    Contact Number
                  </th>
                  <th
                    scope="col"
                    className="px-6 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wider"
                  >
                    Status
                  </th>
                  <th
                    scope="col"
                    className="px-6 py-3.5 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider"
                  >
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-100">
                {filteredTenants.map((tenant) => (
                  <tr
                    key={tenant.id}
                    className="hover:bg-gray-50/80 transition-colors"
                  >
                    {/* Tenant Profile */}
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="w-10 h-10 rounded-full bg-blue-100 text-blue-700 font-bold text-xs flex items-center justify-center border border-blue-200 flex-shrink-0">
                          {tenant.full_name
                            ? tenant.full_name.substring(0, 2).toUpperCase()
                            : "TN"}
                        </div>
                        <div className="ml-3">
                          <div className="text-sm font-bold text-gray-900">
                            {tenant.full_name}
                          </div>
                          <div className="text-xs text-gray-500 flex items-center gap-1">
                            <Mail className="w-3 h-3 text-gray-400" />
                            <span>{tenant.email || "No email on file"}</span>
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
                        <span>
                          {tenant.move_in_date
                            ? new Date(tenant.move_in_date).toLocaleDateString()
                            : "N/A"}
                        </span>
                        <span className="text-gray-400">→</span>
                        <span>
                          {tenant.move_out_date
                            ? new Date(
                                tenant.move_out_date,
                              ).toLocaleDateString()
                            : "Indefinite"}
                        </span>
                      </div>
                    </td>

                    {/* Contact Number */}
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-xs font-medium text-gray-700 flex items-center gap-1">
                        <Phone className="w-3.5 h-3.5 text-gray-400" />
                        {tenant.phone || "N/A"}
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
                        {/* View Dossier / Details */}
                        <button
                          onClick={() =>
                            handleOpenTenantDossier(tenant, "profile")
                          }
                          className="p-1.5 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors flex items-center gap-1 text-xs font-semibold"
                          title="View Complete Tenant Dossier"
                        >
                          <Eye className="w-4 h-4 text-blue-600" />
                          <span className="hidden sm:inline">Details</span>
                        </button>

                        {/* View Contract Agreement */}
                        <button
                          onClick={() =>
                            handleOpenTenantDossier(tenant, "lease")
                          }
                          className="p-1.5 text-gray-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors flex items-center gap-1 text-xs font-semibold"
                          title="View Lease Contract"
                        >
                          <FileText className="w-4 h-4 text-indigo-600" />
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
                          onClick={() => {
                            setDeletingTenant(tenant);
                            setIsDeleteModalOpen(true);
                          }}
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
                  {editingTenant
                    ? `Edit Tenant (${editingTenant.full_name})`
                    : "Create New Tenant Profile"}
                </h3>
                <p className="text-xs text-gray-500 mt-0.5">
                  Fill up tenant personal and contract lease details.
                </p>
              </div>
              <button
                onClick={() => setIsFormModalOpen(false)}
                className="text-gray-400 hover:text-gray-600 p-1 rounded-lg"
              >
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
                    <label className="block text-xs font-semibold text-gray-700 mb-1">
                      First Name *
                    </label>
                    <input
                      type="text"
                      value={formData.first_name}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          first_name: e.target.value,
                        }))
                      }
                      placeholder="e.g. John"
                      className="w-full px-3.5 py-2 border border-gray-300 rounded-xl text-sm text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">
                      Last Name *
                    </label>
                    <input
                      type="text"
                      value={formData.last_name}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          last_name: e.target.value,
                        }))
                      }
                      placeholder="e.g. Doe"
                      className="w-full px-3.5 py-2 border border-gray-300 rounded-xl text-sm text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">
                      Email Address (Optional)
                    </label>
                    <input
                      type="email"
                      value={formData.email}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          email: e.target.value,
                        }))
                      }
                      placeholder="e.g. john.doe@example.com"
                      className="w-full px-3.5 py-2 border border-gray-300 rounded-xl text-sm text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">
                      Mobile Phone Number
                    </label>
                    <input
                      type="tel"
                      value={formData.phone}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          phone: e.target.value,
                        }))
                      }
                      placeholder="e.g. 0917 123 4567"
                      className="w-full px-3.5 py-2 border border-gray-300 rounded-xl text-sm text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">
                      Registered Address (Optional)
                    </label>
                    <input
                      type="text"
                      value={formData.address}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          address: e.target.value,
                        }))
                      }
                      placeholder="e.g. Cebu City"
                      className="w-full px-3.5 py-2 border border-gray-300 rounded-xl text-sm text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">
                      Emergency Contact (Name & Phone)
                    </label>
                    <input
                      type="text"
                      value={formData.emergency_contact}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          emergency_contact: e.target.value,
                        }))
                      }
                      placeholder="e.g. Maria (0918 123 4567)"
                      className="w-full px-3.5 py-2 border border-gray-300 rounded-xl text-sm text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                    />
                  </div>
                </div>

                {/* <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">Government ID Type (Optional)</label>
                    <select
                      value={formData.id_type}
                      onChange={(e) => setFormData(prev => ({ ...prev, id_type: e.target.value }))}
                      className="w-full px-3.5 py-2 border border-gray-300 rounded-xl text-sm text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none bg-white"
                    >
                      <option value="">Select ID Type...</option>
                      <option value="Philippine National ID (PhilSys)">Philippine National ID (PhilSys)</option>
                      <option value="Passport">Passport</option>
                      <option value="Driver's License">Driver's License</option>
                      <option value="UMID">UMID</option>
                      <option value="SSS / GSIS ID">SSS / GSIS ID</option>
                      <option value="Postal ID">Postal ID</option>
                      <option value="PRC ID">PRC ID</option>
                      <option value="Voter's ID">Voter's ID</option>
                      <option value="Other Government ID">Other Government ID</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">ID Number / Reference (Optional)</label>
                    <input
                      type="text"
                      value={formData.id_number}
                      onChange={(e) => setFormData(prev => ({ ...prev, id_number: e.target.value }))}
                      placeholder="e.g. 1234-5678-9012-3456"
                      className="w-full px-3.5 py-2 border border-gray-300 rounded-xl text-sm text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                    />
                  </div>
                </div> */}

                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    {editingTenant
                      ? "Reset Password (Optional)"
                      : "Password (Optional)"}
                  </label>
                  <input
                    type="password"
                    value={formData.password}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        password: e.target.value,
                      }))
                    }
                    placeholder={
                      editingTenant
                        ? "Leave empty to keep current password"
                        : "Leave empty to auto-generate"
                    }
                    className="w-full px-3.5 py-2 border border-gray-300 rounded-xl text-sm text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                  />
                  {editingTenant && (
                    <p className="text-[11px] text-gray-400 mt-1">
                      Enter a new password if you want to reset or change the
                      tenant's login password.
                    </p>
                  )}
                </div>
              </div>

              {/* CONTRACT & LEASE DETAILS */}
              <div className="space-y-3 pt-2">
                <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider border-b border-gray-100 pb-1">
                  2. Lease Contract Details
                </h4>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    Assigned Property Unit *
                  </label>
                  <select
                    value={formData.unit_id}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        unit_id: e.target.value,
                      }))
                    }
                    className="w-full px-3.5 py-2 border border-gray-300 rounded-xl text-sm text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                    required
                  >
                    <option value="" disabled>
                      Select assigned unit...
                    </option>
                    {units.map((u) => (
                      <option key={u.id} value={u.id.toString()}>
                        {u.unit_number} ({u.building_name}) - ₱
                        {Number(u.monthly_rent).toLocaleString()}/mo
                      </option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">
                      Move-In Date *
                    </label>
                    <input
                      type="date"
                      value={formData.move_in_date}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          move_in_date: e.target.value,
                        }))
                      }
                      className="w-full px-3.5 py-2 border border-gray-300 rounded-xl text-sm text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">
                      Move-Out Date (Optional / Indefinite)
                    </label>
                    <input
                      type="date"
                      value={formData.move_out_date}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          move_out_date: e.target.value,
                        }))
                      }
                      className="w-full px-3.5 py-2 border border-gray-300 rounded-xl text-sm text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                    />
                    <p className="text-[11px] text-gray-400 mt-1">
                      Leave empty for open-ended or indefinite tenancy (default
                      is null).
                    </p>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    Lease Document Link / Notes (Optional)
                  </label>
                  <input
                    type="text"
                    value={formData.document_url}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        document_url: e.target.value,
                      }))
                    }
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
                  <span>
                    {editingTenant ? "Save Changes" : "Create Tenant"}
                  </span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* TENANT DOSSIER & DETAILS MODAL */}
      {isDetailModalOpen && viewingTenant && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl max-w-4xl w-full shadow-2xl overflow-hidden border border-gray-200 flex flex-col max-h-[90vh]">
            {/* Header */}
            <div className="px-6 py-5 bg-gray-900 text-white flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-gray-800">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-blue-600 text-white font-black text-base flex items-center justify-center border border-blue-400/30 shadow-md">
                  {viewingTenant.full_name
                    ? viewingTenant.full_name.substring(0, 2).toUpperCase()
                    : "TN"}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-xl font-bold tracking-tight text-white">
                      {viewingTenant.full_name}
                    </h3>
                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 mr-1.5"></span>
                      Active Tenant
                    </span>
                  </div>
                  <div className="flex flex-wrap items-center gap-2 text-xs text-gray-400 mt-1">
                    <span className="flex items-center gap-1 font-medium text-gray-300">
                      <Home className="w-3.5 h-3.5 text-blue-400" />
                      Unit {viewingTenant.unit_number}
                    </span>
                    <span>•</span>
                    <span className="flex items-center gap-1">
                      <Building2 className="w-3.5 h-3.5 text-gray-400" />
                      {viewingTenant.building_name}
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                <button
                  onClick={() => {
                    setIsDetailModalOpen(false);
                    handleOpenEditModal(viewingTenant);
                  }}
                  className="px-3 py-1.5 text-xs font-semibold text-gray-200 bg-gray-800 hover:bg-gray-700 rounded-xl transition-colors flex items-center gap-1.5 border border-gray-700"
                >
                  <Edit3 className="w-3.5 h-3.5 text-amber-400" />
                  <span>Edit Profile</span>
                </button>
                <button
                  onClick={() => setIsDetailModalOpen(false)}
                  className="text-gray-400 hover:text-white p-1.5 rounded-xl hover:bg-gray-800 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Tab Navigation */}
            <div className="bg-gray-50 border-b border-gray-200 px-6 flex overflow-x-auto gap-2">
              <button
                onClick={() => setActiveDetailTab("profile")}
                className={`py-3 px-4 text-xs font-bold border-b-2 flex items-center gap-2 transition-colors whitespace-nowrap ${
                  activeDetailTab === "profile"
                    ? "border-blue-600 text-blue-600"
                    : "border-transparent text-gray-500 hover:text-gray-700"
                }`}
              >
                <UserCheck className="w-4 h-4" />
                <span>Profile & Identity</span>
              </button>

              <button
                onClick={() => setActiveDetailTab("lease")}
                className={`py-3 px-4 text-xs font-bold border-b-2 flex items-center gap-2 transition-colors whitespace-nowrap ${
                  activeDetailTab === "lease"
                    ? "border-blue-600 text-blue-600"
                    : "border-transparent text-gray-500 hover:text-gray-700"
                }`}
              >
                <FileText className="w-4 h-4" />
                <span>Lease Contract & Unit</span>
              </button>

              <button
                onClick={() => setActiveDetailTab("billings")}
                className={`py-3 px-4 text-xs font-bold border-b-2 flex items-center gap-2 transition-colors whitespace-nowrap ${
                  activeDetailTab === "billings"
                    ? "border-blue-600 text-blue-600"
                    : "border-transparent text-gray-500 hover:text-gray-700"
                }`}
              >
                <CreditCard className="w-4 h-4" />
                <span>Billings & Statements</span>
                {dossierData?.billings && (
                  <span className="ml-1 px-1.5 py-0.5 rounded-full text-[10px] font-extrabold bg-blue-100 text-blue-700">
                    {dossierData.billings.length}
                  </span>
                )}
              </button>

              <button
                onClick={() => setActiveDetailTab("maintenance")}
                className={`py-3 px-4 text-xs font-bold border-b-2 flex items-center gap-2 transition-colors whitespace-nowrap ${
                  activeDetailTab === "maintenance"
                    ? "border-blue-600 text-blue-600"
                    : "border-transparent text-gray-500 hover:text-gray-700"
                }`}
              >
                <Wrench className="w-4 h-4" />
                <span>Maintenance History</span>
                {dossierData?.maintenance_tickets && (
                  <span
                    className={`ml-1 px-1.5 py-0.5 rounded-full text-[10px] font-extrabold ${
                      dossierData.maintenance_summary.open > 0
                        ? "bg-amber-100 text-amber-700"
                        : "bg-gray-200 text-gray-700"
                    }`}
                  >
                    {dossierData.maintenance_tickets.length}
                  </span>
                )}
              </button>
            </div>

            {/* Modal Body Content (Scrollable) */}
            <div className="p-6 overflow-y-auto flex-1 space-y-6">
              {dossierLoading ? (
                <div className="py-16 text-center text-gray-500 space-y-3">
                  <RefreshCw className="w-8 h-8 text-blue-600 animate-spin mx-auto" />
                  <p className="text-sm font-medium">
                    Fetching comprehensive tenant dossier...
                  </p>
                </div>
              ) : (
                <>
                  {/* TAB 1: PROFILE & IDENTITY */}
                  {activeDetailTab === "profile" && (
                    <div className="space-y-6">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {/* Personal Contact Details */}
                        <div className="bg-gray-50/70 border border-gray-200/80 rounded-2xl p-5 space-y-4">
                          <div className="flex items-center gap-2 border-b border-gray-200/60 pb-3">
                            <UserCheck className="w-4 h-4 text-blue-600" />
                            <h4 className="text-sm font-bold text-gray-900">
                              Personal Contact Information
                            </h4>
                          </div>

                          <div className="space-y-3 text-xs">
                            <div>
                              <span className="text-gray-400 font-semibold block uppercase tracking-wider text-[10px]">
                                Full Legal Name
                              </span>
                              <p className="text-sm font-bold text-gray-900 mt-0.5">
                                {dossierData?.tenant.full_name ||
                                  viewingTenant.full_name}
                              </p>
                            </div>

                            <div>
                              <span className="text-gray-400 font-semibold block uppercase tracking-wider text-[10px]">
                                Email Address
                              </span>
                              <div className="flex items-center justify-between mt-0.5">
                                <span className="text-gray-800 font-medium">
                                  {dossierData?.tenant.email ||
                                    viewingTenant.email ||
                                    "No email on record"}
                                </span>
                                {(dossierData?.tenant.email ||
                                  viewingTenant.email) && (
                                  <button
                                    onClick={() =>
                                      handleCopy(
                                        dossierData?.tenant.email ||
                                          viewingTenant.email ||
                                          "",
                                        "email",
                                      )
                                    }
                                    className="text-gray-400 hover:text-blue-600 p-1"
                                    title="Copy Email"
                                  >
                                    {copiedKey === "email" ? (
                                      <Check className="w-3.5 h-3.5 text-emerald-600" />
                                    ) : (
                                      <Copy className="w-3.5 h-3.5" />
                                    )}
                                  </button>
                                )}
                              </div>
                            </div>

                            <div>
                              <span className="text-gray-400 font-semibold block uppercase tracking-wider text-[10px]">
                                Mobile Phone
                              </span>
                              <div className="flex items-center justify-between mt-0.5">
                                <span className="text-gray-800 font-medium">
                                  {dossierData?.tenant.phone ||
                                    viewingTenant.phone ||
                                    "No phone on record"}
                                </span>
                                {(dossierData?.tenant.phone ||
                                  viewingTenant.phone) && (
                                  <button
                                    onClick={() =>
                                      handleCopy(
                                        dossierData?.tenant.phone ||
                                          viewingTenant.phone ||
                                          "",
                                        "phone",
                                      )
                                    }
                                    className="text-gray-400 hover:text-blue-600 p-1"
                                    title="Copy Phone"
                                  >
                                    {copiedKey === "phone" ? (
                                      <Check className="w-3.5 h-3.5 text-emerald-600" />
                                    ) : (
                                      <Copy className="w-3.5 h-3.5" />
                                    )}
                                  </button>
                                )}
                              </div>
                            </div>

                            <div>
                              <span className="text-gray-400 font-semibold block uppercase tracking-wider text-[10px]">
                                Registered Address
                              </span>
                              <p className="text-gray-700 mt-0.5">
                                {dossierData?.tenant.address ||
                                  viewingTenant.address ||
                                  "No registered permanent address provided"}
                              </p>
                            </div>
                          </div>
                        </div>

                        {/* Valid Government ID */}
                        <div className="bg-gray-50/70 border border-gray-200/80 rounded-2xl p-5 space-y-4">
                          <div className="flex items-center gap-2 border-b border-gray-200/60 pb-3">
                            <Shield className="w-4 h-4 text-emerald-600" />
                            <h4 className="text-sm font-bold text-gray-900">
                              Government Identification & Verification
                            </h4>
                          </div>

                          <div className="space-y-3 text-xs">
                            <div>
                              <span className="text-gray-400 font-semibold block uppercase tracking-wider text-[10px]">
                                Government ID Type
                              </span>
                              <p className="text-sm font-bold text-gray-900 mt-0.5">
                                {dossierData?.tenant.id_type ||
                                  viewingTenant.id_type ||
                                  "Not specified"}
                              </p>
                            </div>

                            <div>
                              <span className="text-gray-400 font-semibold block uppercase tracking-wider text-[10px]">
                                ID / License Number
                              </span>
                              <div className="flex items-center justify-between mt-0.5">
                                <span className="font-mono font-semibold text-gray-800 bg-white px-2 py-1 rounded border border-gray-200 text-xs">
                                  {dossierData?.tenant.id_number ||
                                    viewingTenant.id_number ||
                                    "N/A"}
                                </span>
                                {(dossierData?.tenant.id_number ||
                                  viewingTenant.id_number) && (
                                  <button
                                    onClick={() =>
                                      handleCopy(
                                        dossierData?.tenant.id_number ||
                                          viewingTenant.id_number ||
                                          "",
                                        "id_num",
                                      )
                                    }
                                    className="text-gray-400 hover:text-blue-600 p-1"
                                    title="Copy ID Number"
                                  >
                                    {copiedKey === "id_num" ? (
                                      <Check className="w-3.5 h-3.5 text-emerald-600" />
                                    ) : (
                                      <Copy className="w-3.5 h-3.5" />
                                    )}
                                  </button>
                                )}
                              </div>
                            </div>

                            <div className="pt-2">
                              <span className="text-gray-400 font-semibold block uppercase tracking-wider text-[10px] mb-1">
                                Verification Status
                              </span>
                              {dossierData?.tenant.id_number ||
                              viewingTenant.id_number ? (
                                <div className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                                  <span>Government ID on File</span>
                                </div>
                              ) : (
                                <div className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200">
                                  <AlertCircle className="w-3.5 h-3.5 text-amber-600" />
                                  <span>Pending ID Documentation</span>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Emergency Contact */}
                        <div className="bg-gray-50/70 border border-gray-200/80 rounded-2xl p-5 space-y-4">
                          <div className="flex items-center gap-2 border-b border-gray-200/60 pb-3">
                            <Phone className="w-4 h-4 text-red-500" />
                            <h4 className="text-sm font-bold text-gray-900">
                              Emergency Contact
                            </h4>
                          </div>

                          <div className="space-y-3 text-xs">
                            <div>
                              <span className="text-gray-400 font-semibold block uppercase tracking-wider text-[10px]">
                                Contact Person & Details
                              </span>
                              <p className="text-sm font-bold text-gray-900 mt-0.5">
                                {dossierData?.tenant.emergency_contact ||
                                  viewingTenant.emergency_contact ||
                                  "None registered"}
                              </p>
                            </div>
                            <p className="text-gray-500 text-[11px]">
                              Designated contact in case of building
                              emergencies, unattended incidents, or urgent
                              notifications.
                            </p>
                          </div>
                        </div>

                        {/* Account & Portal Access */}
                        <div className="bg-gray-50/70 border border-gray-200/80 rounded-2xl p-5 space-y-4">
                          <div className="flex items-center gap-2 border-b border-gray-200/60 pb-3">
                            <Shield className="w-4 h-4 text-blue-600" />
                            <h4 className="text-sm font-bold text-gray-900">
                              Tenant Portal Account
                            </h4>
                          </div>

                          <div className="space-y-3 text-xs">
                            <div className="flex justify-between items-center">
                              <span className="text-gray-500">
                                Portal Access Role
                              </span>
                              <span className="font-semibold text-gray-800">
                                Resident Tenant
                              </span>
                            </div>
                            <div className="flex justify-between items-center">
                              <span className="text-gray-500">
                                Account Status
                              </span>
                              <span className="font-semibold text-emerald-600 flex items-center gap-1">
                                <CheckCircle2 className="w-3.5 h-3.5" />
                                Active
                              </span>
                            </div>
                            <div className="flex justify-between items-center">
                              <span className="text-gray-500">Tenant ID</span>
                              <span className="font-mono text-gray-700">
                                #{viewingTenant.id}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* TAB 2: LEASE CONTRACT & UNIT */}
                  {activeDetailTab === "lease" && (
                    <div className="space-y-6">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {/* Assigned Unit */}
                        <div className="bg-blue-50/50 border border-blue-200/80 rounded-2xl p-5 space-y-3">
                          <span className="text-blue-600 font-bold uppercase tracking-wider text-[10px] block">
                            Assigned Property Unit
                          </span>
                          <h4 className="text-xl font-extrabold text-gray-900">
                            {dossierData?.unit.unit_number ||
                              viewingTenant.unit_number}
                          </h4>
                          <p className="text-xs text-gray-600 font-medium">
                            {dossierData?.unit.building_name ||
                              viewingTenant.building_name}
                          </p>
                          {dossierData?.unit.building_address && (
                            <p className="text-xs text-gray-500 flex items-center gap-1">
                              <MapPin className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
                              <span>{dossierData.unit.building_address}</span>
                            </p>
                          )}
                          <div className="pt-2 border-t border-blue-200/60">
                            <span className="text-[11px] text-gray-500 block">
                              Agreed Monthly Base Rent:
                            </span>
                            <span className="text-lg font-black text-emerald-700">
                              ₱{" "}
                              {Number(
                                dossierData?.unit.monthly_rent ||
                                  viewingTenant.monthly_rent ||
                                  15000,
                              ).toLocaleString("en-US", {
                                minimumFractionDigits: 2,
                              })}{" "}
                              / month
                            </span>
                          </div>
                        </div>

                        {/* Lease Term Details */}
                        <div className="bg-gray-50 border border-gray-200 rounded-2xl p-5 space-y-3">
                          <span className="text-gray-400 font-bold uppercase tracking-wider text-[10px] block">
                            Lease Agreement Duration
                          </span>

                          <div className="space-y-2.5 text-xs">
                            <div className="flex justify-between py-1.5 border-b border-gray-200">
                              <span className="text-gray-500">
                                Commencement (Move-In):
                              </span>
                              <span className="font-bold text-gray-900">
                                {viewingTenant.move_in_date
                                  ? new Date(
                                      viewingTenant.move_in_date,
                                    ).toLocaleDateString("en-US", {
                                      year: "numeric",
                                      month: "long",
                                      day: "numeric",
                                    })
                                  : "N/A"}
                              </span>
                            </div>
                            <div className="flex justify-between py-1.5 border-b border-gray-200">
                              <span className="text-gray-500">
                                Termination (Move-Out):
                              </span>
                              <span className="font-bold text-gray-900">
                                {viewingTenant.move_out_date
                                  ? new Date(
                                      viewingTenant.move_out_date,
                                    ).toLocaleDateString("en-US", {
                                      year: "numeric",
                                      month: "long",
                                      day: "numeric",
                                    })
                                  : "Indefinite / Open-Ended"}
                              </span>
                            </div>
                            <div className="flex justify-between py-1.5">
                              <span className="text-gray-500">
                                Contract Compliance:
                              </span>
                              <span className="font-bold text-emerald-600 flex items-center gap-1">
                                <CheckCircle2 className="w-3.5 h-3.5" />
                                Active & In Good Standing
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Lease Document Link & Actions */}
                      <div className="bg-gray-50/70 border border-gray-200/80 rounded-2xl p-5 space-y-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <h4 className="text-sm font-bold text-gray-900">
                              Signed Lease Agreement Document
                            </h4>
                            <p className="text-xs text-gray-500 mt-0.5">
                              Attached digital copy or cloud storage reference
                              for this tenancy agreement.
                            </p>
                          </div>
                        </div>

                        {viewingTenant.document_url ? (
                          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-3.5 bg-white border border-gray-200 rounded-xl">
                            <div className="flex items-center gap-2 overflow-hidden text-xs text-gray-700">
                              <FileText className="w-4 h-4 text-blue-600 flex-shrink-0" />
                              <span className="truncate max-w-md font-mono">
                                {viewingTenant.document_url}
                              </span>
                            </div>
                            <div className="flex items-center gap-2 flex-shrink-0">
                              <button
                                onClick={() =>
                                  handleCopy(viewingTenant.document_url!, "doc")
                                }
                                className="px-2.5 py-1.5 text-xs text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-lg flex items-center gap-1 transition-colors"
                              >
                                {copiedKey === "doc" ? (
                                  <Check className="w-3.5 h-3.5 text-emerald-600" />
                                ) : (
                                  <Copy className="w-3.5 h-3.5" />
                                )}
                                <span>Copy Link</span>
                              </button>
                              <a
                                href={viewingTenant.document_url}
                                target="_blank"
                                rel="noreferrer"
                                className="px-3 py-1.5 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg flex items-center gap-1 transition-colors"
                              >
                                <ExternalLink className="w-3.5 h-3.5" />
                                <span>Open Document</span>
                              </a>
                            </div>
                          </div>
                        ) : (
                          <div className="p-4 bg-white border border-dashed border-gray-300 rounded-xl text-center text-xs text-gray-500">
                            <p>
                              No external agreement document link attached to
                              this lease.
                            </p>
                            <p className="mt-1 text-[11px] text-gray-400">
                              You can edit the tenant profile to attach a Google
                              Drive, Dropbox, or PDF link.
                            </p>
                          </div>
                        )}

                        <div className="pt-2 flex justify-end">
                          <button
                            onClick={() => window.print()}
                            className="px-4 py-2 text-xs font-semibold text-gray-700 bg-white hover:bg-gray-100 border border-gray-300 rounded-xl transition-colors flex items-center gap-1.5 shadow-xs"
                          >
                            <Printer className="w-4 h-4 text-gray-600" />
                            <span>Print Lease Summary</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* TAB 3: BILLINGS & STATEMENTS */}
                  {activeDetailTab === "billings" && (
                    <div className="space-y-6">
                      {/* Financial KPI Summary Cards */}
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-2xs">
                          <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">
                            Total Billed
                          </span>
                          <p className="text-xl font-extrabold text-gray-900 mt-1">
                            ₱{" "}
                            {Number(
                              dossierData?.financial_summary.total_billed || 0,
                            ).toLocaleString("en-US", {
                              minimumFractionDigits: 2,
                            })}
                          </p>
                          <p className="text-[11px] text-gray-400 mt-0.5">
                            All posted statements
                          </p>
                        </div>

                        <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-2xs">
                          <span className="text-[10px] font-bold text-emerald-600 uppercase tracking-wider block">
                            Total Collected
                          </span>
                          <p className="text-xl font-extrabold text-emerald-600 mt-1">
                            ₱{" "}
                            {Number(
                              dossierData?.financial_summary.total_paid || 0,
                            ).toLocaleString("en-US", {
                              minimumFractionDigits: 2,
                            })}
                          </p>
                          <p className="text-[11px] text-emerald-700/70 mt-0.5">
                            Recorded payments
                          </p>
                        </div>

                        <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-2xs">
                          <span className="text-[10px] font-bold text-amber-600 uppercase tracking-wider block">
                            Outstanding Balance
                          </span>
                          <p
                            className={`text-xl font-extrabold mt-1 ${
                              Number(
                                dossierData?.financial_summary.total_balance ||
                                  0,
                              ) > 0
                                ? "text-amber-600"
                                : "text-gray-900"
                            }`}
                          >
                            ₱{" "}
                            {Number(
                              dossierData?.financial_summary.total_balance || 0,
                            ).toLocaleString("en-US", {
                              minimumFractionDigits: 2,
                            })}
                          </p>
                          <p className="text-[11px] text-gray-400 mt-0.5">
                            Due remaining balance
                          </p>
                        </div>
                      </div>

                      {/* Billing Statements Table */}
                      <div className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-xs">
                        <div className="p-3.5 bg-gray-50 border-b border-gray-200 flex justify-between items-center">
                          <h4 className="text-xs font-bold text-gray-700 uppercase tracking-wider">
                            Statement History
                          </h4>
                          <span className="text-xs text-gray-500 font-medium">
                            {dossierData?.billings?.length || 0} Records
                          </span>
                        </div>

                        {!dossierData?.billings ||
                        dossierData.billings.length === 0 ? (
                          <div className="p-8 text-center text-gray-500 space-y-2">
                            <CreditCard className="w-8 h-8 text-gray-300 mx-auto" />
                            <p className="text-sm font-semibold text-gray-700">
                              No billing statements generated
                            </p>
                            <p className="text-xs text-gray-400">
                              Generate bills for this tenant in the Billings
                              module.
                            </p>
                          </div>
                        ) : (
                          <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-gray-200 text-left text-xs">
                              <thead className="bg-gray-50">
                                <tr>
                                  <th className="px-4 py-2.5 font-semibold text-gray-600">
                                    Reference
                                  </th>
                                  <th className="px-4 py-2.5 font-semibold text-gray-600">
                                    Type & Cycle
                                  </th>
                                  <th className="px-4 py-2.5 font-semibold text-gray-600">
                                    Due Date
                                  </th>
                                  <th className="px-4 py-2.5 font-semibold text-gray-600">
                                    Total Billed
                                  </th>
                                  <th className="px-4 py-2.5 font-semibold text-gray-600">
                                    Paid
                                  </th>
                                  <th className="px-4 py-2.5 font-semibold text-gray-600">
                                    Balance
                                  </th>
                                  <th className="px-4 py-2.5 font-semibold text-gray-600">
                                    Status
                                  </th>
                                  <th className="px-4 py-2.5 font-semibold text-gray-600 text-right">
                                    PDF Invoice
                                  </th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-gray-100">
                                {dossierData.billings.map((b) => (
                                  <tr
                                    key={b.id}
                                    className="hover:bg-gray-50/80 transition-colors"
                                  >
                                    <td className="px-4 py-3 font-mono font-bold text-blue-600">
                                      {b.reference_number}
                                    </td>
                                    <td className="px-4 py-3">
                                      <p className="font-semibold text-gray-900">
                                        {b.billing_type_name}
                                      </p>
                                      <p className="text-[10px] text-gray-400 capitalize">
                                        {b.billing_cycle}
                                      </p>
                                    </td>
                                    <td className="px-4 py-3 text-gray-600">
                                      {new Date(
                                        b.due_date,
                                      ).toLocaleDateString()}
                                    </td>
                                    <td className="px-4 py-3 font-semibold text-gray-900">
                                      ₱{" "}
                                      {b.amount.toLocaleString("en-US", {
                                        minimumFractionDigits: 2,
                                      })}
                                    </td>
                                    <td className="px-4 py-3 text-emerald-600 font-medium">
                                      ₱{" "}
                                      {b.paid_amount.toLocaleString("en-US", {
                                        minimumFractionDigits: 2,
                                      })}
                                    </td>
                                    <td
                                      className={`px-4 py-3 font-bold ${b.balance > 0 ? "text-amber-600" : "text-gray-600"}`}
                                    >
                                      ₱{" "}
                                      {b.balance.toLocaleString("en-US", {
                                        minimumFractionDigits: 2,
                                      })}
                                    </td>
                                    <td className="px-4 py-3">
                                      {b.status === "paid" ? (
                                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                                          Paid
                                        </span>
                                      ) : b.status === "overdue" ? (
                                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-red-50 text-red-700 border border-red-200">
                                          Overdue
                                        </span>
                                      ) : b.status === "partially_paid" ? (
                                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-200">
                                          Partial
                                        </span>
                                      ) : (
                                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
                                          Pending
                                        </span>
                                      )}
                                    </td>
                                    <td className="px-4 py-3 text-right">
                                      <a
                                        href={`/api/admin/billings/${b.id}/pdf`}
                                        target="_blank"
                                        rel="noreferrer"
                                        className="inline-flex items-center gap-1 text-blue-600 hover:text-blue-800 font-semibold text-xs"
                                        title="Download / View PDF Statement"
                                      >
                                        <FileText className="w-3.5 h-3.5" />
                                        <span>PDF</span>
                                      </a>
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* TAB 4: MAINTENANCE TICKETS */}
                  {activeDetailTab === "maintenance" && (
                    <div className="space-y-6">
                      {/* Maintenance KPI summary */}
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                        <div className="bg-gray-50 border border-gray-200 p-3.5 rounded-xl text-center">
                          <span className="text-[10px] font-bold text-gray-500 uppercase">
                            Total Tickets
                          </span>
                          <p className="text-xl font-extrabold text-gray-900 mt-0.5">
                            {dossierData?.maintenance_summary.total || 0}
                          </p>
                        </div>
                        <div className="bg-amber-50 border border-amber-200 p-3.5 rounded-xl text-center">
                          <span className="text-[10px] font-bold text-amber-700 uppercase">
                            Open
                          </span>
                          <p className="text-xl font-extrabold text-amber-700 mt-0.5">
                            {dossierData?.maintenance_summary.open || 0}
                          </p>
                        </div>
                        <div className="bg-blue-50 border border-blue-200 p-3.5 rounded-xl text-center">
                          <span className="text-[10px] font-bold text-blue-700 uppercase">
                            In Progress
                          </span>
                          <p className="text-xl font-extrabold text-blue-700 mt-0.5">
                            {dossierData?.maintenance_summary.in_progress || 0}
                          </p>
                        </div>
                        <div className="bg-emerald-50 border border-emerald-200 p-3.5 rounded-xl text-center">
                          <span className="text-[10px] font-bold text-emerald-700 uppercase">
                            Resolved
                          </span>
                          <p className="text-xl font-extrabold text-emerald-700 mt-0.5">
                            {dossierData?.maintenance_summary.resolved || 0}
                          </p>
                        </div>
                      </div>

                      {/* Tickets list */}
                      {!dossierData?.maintenance_tickets ||
                      dossierData.maintenance_tickets.length === 0 ? (
                        <div className="p-12 text-center text-gray-500 bg-gray-50 border border-gray-200 rounded-2xl space-y-2">
                          <Wrench className="w-8 h-8 text-gray-300 mx-auto" />
                          <p className="text-sm font-semibold text-gray-700">
                            No maintenance tickets submitted
                          </p>
                          <p className="text-xs text-gray-400">
                            Tenant has not filed any service requests.
                          </p>
                        </div>
                      ) : (
                        <div className="space-y-3">
                          {dossierData.maintenance_tickets.map((t) => (
                            <div
                              key={t.id}
                              className="p-4 bg-white border border-gray-200 rounded-xl space-y-2 hover:border-blue-300 transition-colors"
                            >
                              <div className="flex flex-wrap items-center justify-between gap-2">
                                <div className="flex items-center gap-2">
                                  <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-gray-100 text-gray-700 border border-gray-200">
                                    {t.category}
                                  </span>
                                  <h5 className="text-sm font-bold text-gray-900">
                                    {t.title}
                                  </h5>
                                </div>
                                <div className="flex items-center gap-2">
                                  {t.status === "resolved" ? (
                                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                                      Resolved
                                    </span>
                                  ) : t.status === "in_progress" ? (
                                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-200">
                                      In Progress
                                    </span>
                                  ) : (
                                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
                                      Open
                                    </span>
                                  )}
                                  <span className="text-[11px] text-gray-400">
                                    {t.created_at
                                      ? new Date(
                                          t.created_at,
                                        ).toLocaleDateString()
                                      : ""}
                                  </span>
                                </div>
                              </div>

                              <p className="text-xs text-gray-600 line-clamp-2 leading-relaxed whitespace-pre-line">
                                {t.description}
                              </p>

                              {t.photos && t.photos.length > 0 && (
                                <div className="flex items-center gap-2 pt-1 overflow-x-auto">
                                  {t.photos.map((url, i) => (
                                    <button
                                      key={i}
                                      onClick={() => setPreviewPhoto(url)}
                                      className="relative w-12 h-12 rounded-lg overflow-hidden border border-gray-200 hover:opacity-80 transition-opacity flex-shrink-0"
                                      title="Click to zoom photo"
                                    >
                                      <img
                                        src={url}
                                        alt={`Attachment ${i + 1}`}
                                        className="w-full h-full object-cover"
                                      />
                                    </button>
                                  ))}
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      )}

                      <div className="flex justify-end pt-2">
                        <a
                          href={`/admin/maintenance?query=${encodeURIComponent(viewingTenant.unit_number)}`}
                          className="px-4 py-2 text-xs font-semibold text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-xl transition-colors flex items-center gap-1"
                        >
                          <span>Open in Maintenance Management</span>
                          <ChevronRight className="w-3.5 h-3.5" />
                        </a>
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>

            {/* Footer */}
            <div className="px-6 py-3.5 bg-gray-50 border-t border-gray-200 flex justify-between items-center">
              <span className="text-xs text-gray-400">
                Tenant Record #{viewingTenant.id} • Unit{" "}
                {viewingTenant.unit_number}
              </span>
              <button
                onClick={() => setIsDetailModalOpen(false)}
                className="px-5 py-2 text-xs font-semibold text-gray-700 bg-white hover:bg-gray-100 border border-gray-300 rounded-xl transition-colors shadow-2xs"
              >
                Close Dossier
              </button>
            </div>
          </div>
        </div>
      )}

      {/* PHOTO LIGHTBOX MODAL */}
      {previewPhoto && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="relative max-w-3xl w-full bg-black rounded-2xl overflow-hidden shadow-2xl border border-gray-800">
            <button
              onClick={() => setPreviewPhoto(null)}
              className="absolute top-4 right-4 p-2 bg-black/60 hover:bg-black/90 text-white rounded-full transition-colors z-10"
            >
              <X className="w-5 h-5" />
            </button>
            <div className="p-2 flex items-center justify-center min-h-[300px]">
              <img
                src={previewPhoto}
                alt="Maintenance Attachment Preview"
                className="max-h-[80vh] w-auto object-contain rounded-lg"
              />
            </div>
            <div className="p-3 bg-gray-900/90 text-center">
              <a
                href={previewPhoto}
                target="_blank"
                rel="noreferrer"
                className="text-xs text-blue-400 hover:underline inline-flex items-center gap-1"
              >
                <ExternalLink className="w-3.5 h-3.5" />
                <span>Open original image in new tab</span>
              </a>
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
              <h3 className="text-lg font-bold text-gray-900">
                Terminate Lease & Delete Tenant
              </h3>
              <p className="text-xs text-gray-500 mt-1">
                Are you sure you want to delete{" "}
                <strong className="text-gray-800">
                  {deletingTenant.full_name}
                </strong>{" "}
                and terminate their lease for {deletingTenant.unit_number}? This
                action cannot be undone.
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
                  <span>Yes, Delete Tenant</span>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
