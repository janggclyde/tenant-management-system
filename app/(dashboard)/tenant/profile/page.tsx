'use client';

import { useState, useEffect } from 'react';
import { 
  User, 
  Home, 
  Building2, 
  Phone, 
  Mail, 
  MapPin, 
  Calendar, 
  FileText, 
  ShieldCheck, 
  Edit3, 
  Loader2, 
  CheckCircle2, 
  AlertCircle, 
  X,
  ExternalLink,
  Lock,
  Eye,
  EyeOff
} from 'lucide-react';

interface TenantProfileData {
  id: number;
  name: string;
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  address: string;
  id_type?: string | null;
  id_number?: string | null;
  emergency_contact?: {
    name?: string;
    phone?: string;
    relationship?: string;
  } | null;
  unit: {
    id: number;
    unit_number: string;
    monthly_rent: number;
    status: string;
  };
  building: {
    id: number;
    name: string;
    address: string;
  };
  lease: {
    move_in_date: string | null;
    move_out_date: string | null;
    document_url: string | null;
  };
}

export default function TenantProfilePage() {
  const [profile, setProfile] = useState<TenantProfileData | null>(null);
  const [loading, setLoading] = useState(true);

  // Edit Modal State
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [activeModalTab, setActiveModalTab] = useState<'profile' | 'security'>('profile');

  // Form Fields
  const [editFirstName, setEditFirstName] = useState('');
  const [editLastName, setEditLastName] = useState('');
  const [editPhone, setEditPhone] = useState('');
  const [editAddress, setEditAddress] = useState('');
  const [emergencyName, setEmergencyName] = useState('');
  const [emergencyPhone, setEmergencyPhone] = useState('');
  const [emergencyRelationship, setEmergencyRelationship] = useState('');

  // Password Fields
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const fetchProfile = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/tenant/profile');
      const data = await res.json();
      if (data.success && data.profile) {
        setProfile(data.profile);
      }
    } catch (err) {
      console.error('Failed to load profile', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProfile();
  }, []);

  const openEditModal = () => {
    if (!profile) return;
    setEditFirstName(profile.first_name || profile.name.split(' ')[0] || '');
    setEditLastName(profile.last_name || profile.name.split(' ').slice(1).join(' ') || '');
    setEditPhone(profile.phone || '');
    setEditAddress(profile.address || '');
    setEmergencyName(profile.emergency_contact?.name || '');
    setEmergencyPhone(profile.emergency_contact?.phone || '');
    setEmergencyRelationship(profile.emergency_contact?.relationship || 'Contact');
    setCurrentPassword('');
    setNewPassword('');
    setConfirmPassword('');
    setActiveModalTab('profile');
    setError(null);
    setIsEditModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Validate password if provided
    if (newPassword.trim()) {
      if (newPassword.trim().length < 6) {
        setError('New password must be at least 6 characters long.');
        setActiveModalTab('security');
        return;
      }
      if (newPassword !== confirmPassword) {
        setError('New password and confirmation do not match.');
        setActiveModalTab('security');
        return;
      }
    }

    setSaving(true);

    try {
      const res = await fetch('/api/tenant/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          first_name: editFirstName.trim(),
          last_name: editLastName.trim(),
          phone: editPhone.trim(),
          address: editAddress.trim(),
          emergency_contact: {
            name: emergencyName.trim(),
            phone: emergencyPhone.trim(),
            relationship: emergencyRelationship.trim()
          },
          current_password: currentPassword.trim() || undefined,
          new_password: newPassword.trim() || undefined
        })
      });

      const data = await res.json();
      if (!data.success) throw new Error(data.error || 'Failed to update profile');

      setIsEditModalOpen(false);
      showToast(newPassword.trim() ? 'Profile and password updated successfully!' : 'Profile details updated successfully!');
      fetchProfile();
    } catch (err: any) {
      setError(err.message || 'Error updating profile');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="p-4 sm:p-6 md:p-8 max-w-4xl mx-auto space-y-6">
      {/* Toast */}
      {toastMessage && (
        <div className="fixed bottom-20 md:bottom-8 right-4 left-4 sm:left-auto sm:right-8 z-50 bg-gray-900 text-white px-5 py-3.5 rounded-2xl shadow-xl flex items-center gap-3 text-sm animate-in fade-in slide-in-from-bottom-4">
          <CheckCircle2 className="w-5 h-5 text-emerald-400 flex-shrink-0" />
          <span className="font-semibold">{toastMessage}</span>
        </div>
      )}

      {/* Header Profile Hero Card */}
      <div className="bg-white rounded-3xl p-6 border border-gray-200 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-blue-600 text-white flex items-center justify-center font-black text-xl shadow-md shadow-blue-500/20 flex-shrink-0">
            {profile?.name ? profile.name.charAt(0).toUpperCase() : 'R'}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-blue-700 bg-blue-50 px-2.5 py-0.5 rounded-full border border-blue-100">
                Active Resident
              </span>
            </div>
            <h1 className="text-xl sm:text-2xl font-black text-gray-900 mt-1">
              {loading ? 'Resident Profile' : profile?.name || 'Valued Resident'}
            </h1>
            <p className="text-xs sm:text-sm text-gray-500 font-medium flex items-center gap-1.5 mt-0.5">
              <Building2 className="w-4 h-4 text-blue-500" />
              <span>{profile?.unit?.unit_number} • {profile?.building?.name}</span>
            </p>
          </div>
        </div>

        <button
          onClick={openEditModal}
          className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700 text-white font-bold px-4 py-2.5 rounded-xl text-xs sm:text-sm transition-all flex items-center justify-center gap-1.5 shadow-sm active:scale-95"
        >
          <Edit3 className="w-4 h-4" />
          <span>Edit Details & Password</span>
        </button>
      </div>

      {loading ? (
        <div className="bg-white rounded-3xl p-16 text-center text-gray-400 flex flex-col items-center justify-center border border-gray-200">
          <Loader2 className="w-8 h-8 animate-spin text-blue-600 mb-2" />
          <span className="text-sm font-medium">Loading profile and lease...</span>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Lease & Contract Details Card */}
          <div className="bg-white rounded-3xl p-6 border border-gray-200 shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center">
                  <Home className="w-4 h-4" />
                </div>
                <h2 className="text-base font-bold text-gray-900">Lease Agreement Details</h2>
              </div>
              <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-100">
                <ShieldCheck className="w-3 h-3" />
                Verified Active
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs sm:text-sm">
              <div className="bg-gray-50/70 p-3.5 rounded-2xl border border-gray-100 space-y-1">
                <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400 block">Unit & Property</span>
                <span className="font-bold text-gray-900 block">{profile?.unit?.unit_number}</span>
                <span className="text-gray-500 text-xs block">{profile?.building?.name}</span>
                <span className="text-gray-400 text-[11px] block">{profile?.building?.address}</span>
              </div>

              <div className="bg-gray-50/70 p-3.5 rounded-2xl border border-gray-100 space-y-1">
                <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400 block">Agreed Monthly Rent</span>
                <span className="text-lg font-black text-gray-900 block">
                  ₱ {Number(profile?.unit?.monthly_rent || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                </span>
                <span className="text-[11px] text-gray-500 block">Standard billing cycle</span>
              </div>

              <div className="bg-gray-50/70 p-3.5 rounded-2xl border border-gray-100 space-y-1">
                <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400 block">Move-in Date</span>
                <span className="font-bold text-gray-800 flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5 text-blue-500" />
                  {profile?.lease?.move_in_date || 'Standard tenancy'}
                </span>
              </div>

              <div className="bg-gray-50/70 p-3.5 rounded-2xl border border-gray-100 space-y-1">
                <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400 block">Lease Expiry Date</span>
                <span className="font-bold text-gray-800 flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5 text-purple-500" />
                  {profile?.lease?.move_out_date ? profile.lease.move_out_date : 'Periodic month-to-month'}
                </span>
              </div>
            </div>

            {profile?.lease?.document_url && (
              <div className="pt-2">
                <a
                  href={profile.lease.document_url}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-2 text-xs font-bold text-blue-600 bg-blue-50 hover:bg-blue-100 px-4 py-2.5 rounded-xl border border-blue-200 transition-colors"
                >
                  <FileText className="w-4 h-4" />
                  <span>View Official Lease Contract (PDF)</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              </div>
            )}
          </div>

          {/* Personal & Emergency Contact Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            {/* Personal Contact */}
            <div className="bg-white rounded-3xl p-6 border border-gray-200 shadow-xs space-y-4">
              <div className="flex items-center justify-between border-b border-gray-100 pb-3">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
                    <User className="w-4 h-4" />
                  </div>
                  <h3 className="text-sm sm:text-base font-bold text-gray-900">Personal Information</h3>
                </div>
                <button
                  onClick={openEditModal}
                  className="text-xs font-bold text-blue-600 hover:underline flex items-center gap-1"
                >
                  <span>Edit</span>
                </button>
              </div>

              <div className="space-y-3 text-xs sm:text-sm">
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400 block">Full Name</span>
                  <span className="font-bold text-gray-900">{profile?.name}</span>
                </div>

                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400 block">Login Email</span>
                  <span className="font-medium text-gray-700 flex items-center gap-1.5 mt-0.5">
                    <Mail className="w-3.5 h-3.5 text-gray-400" />
                    {profile?.email || 'No email on file'}
                  </span>
                </div>

                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400 block">Mobile Phone</span>
                  <span className="font-medium text-gray-700 flex items-center gap-1.5 mt-0.5">
                    <Phone className="w-3.5 h-3.5 text-gray-400" />
                    {profile?.phone || 'No phone recorded'}
                  </span>
                </div>

                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400 block">Registered Address</span>
                  <span className="font-medium text-gray-700 flex items-center gap-1.5 mt-0.5">
                    <MapPin className="w-3.5 h-3.5 text-gray-400" />
                    {profile?.address || 'No address on file'}
                  </span>
                </div>

                {profile?.id_type && (
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400 block">ID Verification</span>
                    <span className="font-medium text-gray-700">
                      {profile.id_type}: {profile.id_number}
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Emergency Contact */}
            <div className="bg-white rounded-3xl p-6 border border-gray-200 shadow-xs space-y-4">
              <div className="flex items-center justify-between border-b border-gray-100 pb-3">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center">
                    <Phone className="w-4 h-4" />
                  </div>
                  <h3 className="text-sm sm:text-base font-bold text-gray-900">Emergency Contact</h3>
                </div>
                <button
                  onClick={openEditModal}
                  className="text-xs font-bold text-blue-600 hover:underline flex items-center gap-1"
                >
                  <span>Edit</span>
                </button>
              </div>

              <div className="space-y-3 text-xs sm:text-sm">
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400 block">Contact Name</span>
                  <span className="font-bold text-gray-900">
                    {profile?.emergency_contact?.name || 'Not provided'}
                  </span>
                </div>

                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400 block">Relationship</span>
                  <span className="font-medium text-gray-700">
                    {profile?.emergency_contact?.relationship || 'Contact'}
                  </span>
                </div>

                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400 block">Emergency Phone</span>
                  <span className="font-medium text-gray-700 flex items-center gap-1.5 mt-0.5">
                    <Phone className="w-3.5 h-3.5 text-rose-500" />
                    {profile?.emergency_contact?.phone || 'No phone recorded'}
                  </span>
                </div>

                <div className="pt-2">
                  <p className="text-[11px] text-gray-400 leading-relaxed">
                    Property management contacts this person during emergency situations or building incidents.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Edit Details & Password Modal */}
      {isEditModalOpen && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white rounded-t-3xl sm:rounded-3xl max-w-lg w-full shadow-2xl overflow-hidden border border-gray-200 max-h-[92vh] flex flex-col">
            {/* Modal Header */}
            <div className="px-6 py-4 bg-gray-50 border-b border-gray-200 flex justify-between items-center">
              <div>
                <h3 className="text-base font-bold text-gray-900">Edit Profile & Password</h3>
                <p className="text-xs text-gray-500">Update personal information, emergency contact, or portal password</p>
              </div>
              <button 
                onClick={() => setIsEditModalOpen(false)}
                className="text-gray-400 hover:text-gray-600 p-1 rounded-xl"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Navigation Tabs */}
            <div className="flex border-b border-gray-200 px-6 pt-2 bg-gray-50/50">
              <button
                type="button"
                onClick={() => setActiveModalTab('profile')}
                className={`pb-2.5 px-3 text-xs font-bold border-b-2 transition-all flex items-center gap-1.5 ${
                  activeModalTab === 'profile'
                    ? 'border-blue-600 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-800'
                }`}
              >
                <User className="w-3.5 h-3.5" />
                <span>Personal & Contact</span>
              </button>
              <button
                type="button"
                onClick={() => setActiveModalTab('security')}
                className={`pb-2.5 px-3 text-xs font-bold border-b-2 transition-all flex items-center gap-1.5 ${
                  activeModalTab === 'security'
                    ? 'border-blue-600 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-800'
                }`}
              >
                <Lock className="w-3.5 h-3.5" />
                <span>Change Password</span>
              </button>
            </div>

            <form onSubmit={handleSave} className="p-6 space-y-4 overflow-y-auto">
              {error && (
                <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-2xl text-rose-700 text-xs font-semibold flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              {activeModalTab === 'profile' ? (
                <>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                        First Name
                      </label>
                      <input
                        type="text"
                        value={editFirstName}
                        onChange={(e) => setEditFirstName(e.target.value)}
                        className="w-full px-3.5 py-2.5 border border-gray-300 rounded-xl text-xs sm:text-sm font-semibold text-gray-900 focus:ring-2 focus:ring-blue-500 outline-none"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                        Last Name
                      </label>
                      <input
                        type="text"
                        value={editLastName}
                        onChange={(e) => setEditLastName(e.target.value)}
                        className="w-full px-3.5 py-2.5 border border-gray-300 rounded-xl text-xs sm:text-sm font-semibold text-gray-900 focus:ring-2 focus:ring-blue-500 outline-none"
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                      Mobile Phone
                    </label>
                    <input
                      type="text"
                      value={editPhone}
                      onChange={(e) => setEditPhone(e.target.value)}
                      placeholder="+63 912 345 6789"
                      className="w-full px-3.5 py-2.5 border border-gray-300 rounded-xl text-xs sm:text-sm font-semibold text-gray-900 focus:ring-2 focus:ring-blue-500 outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                      Permanent Address
                    </label>
                    <input
                      type="text"
                      value={editAddress}
                      onChange={(e) => setEditAddress(e.target.value)}
                      placeholder="Street, City, Province"
                      className="w-full px-3.5 py-2.5 border border-gray-300 rounded-xl text-xs sm:text-sm text-gray-900 focus:ring-2 focus:ring-blue-500 outline-none"
                    />
                  </div>

                  <div className="pt-2 border-t border-gray-100">
                    <span className="text-xs font-bold uppercase tracking-wider text-rose-600 block mb-3">
                      Emergency Contact Details
                    </span>

                    <div className="space-y-3">
                      <div>
                        <label className="block text-xs font-semibold text-gray-700 mb-1">
                          Contact Name
                        </label>
                        <input
                          type="text"
                          value={emergencyName}
                          onChange={(e) => setEmergencyName(e.target.value)}
                          placeholder="e.g. Maria Dela Cruz"
                          className="w-full px-3.5 py-2.5 border border-gray-300 rounded-xl text-xs sm:text-sm text-gray-900 focus:ring-2 focus:ring-blue-500 outline-none"
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="block text-xs font-semibold text-gray-700 mb-1">
                            Relationship
                          </label>
                          <input
                            type="text"
                            value={emergencyRelationship}
                            onChange={(e) => setEmergencyRelationship(e.target.value)}
                            placeholder="e.g. Spouse, Parent"
                            className="w-full px-3.5 py-2.5 border border-gray-300 rounded-xl text-xs sm:text-sm text-gray-900 focus:ring-2 focus:ring-blue-500 outline-none"
                          />
                        </div>

                        <div>
                          <label className="block text-xs font-semibold text-gray-700 mb-1">
                            Emergency Phone
                          </label>
                          <input
                            type="text"
                            value={emergencyPhone}
                            onChange={(e) => setEmergencyPhone(e.target.value)}
                            placeholder="e.g. +63 912 345 6790"
                            className="w-full px-3.5 py-2.5 border border-gray-300 rounded-xl text-xs sm:text-sm text-gray-900 focus:ring-2 focus:ring-blue-500 outline-none"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </>
              ) : (
                /* Security / Password Tab */
                <div className="space-y-4">
                  <div className="bg-blue-50/70 p-3.5 rounded-2xl border border-blue-100 text-xs text-blue-900">
                    <p className="font-semibold">Update your portal account password.</p>
                    <p className="text-[11px] text-blue-700 mt-0.5">Password must be at least 6 characters long.</p>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                      Current Password (Optional)
                    </label>
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={currentPassword}
                      onChange={(e) => setCurrentPassword(e.target.value)}
                      placeholder="Enter current password if known"
                      className="w-full px-3.5 py-2.5 border border-gray-300 rounded-xl text-xs sm:text-sm text-gray-900 focus:ring-2 focus:ring-blue-500 outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                      New Password *
                    </label>
                    <div className="relative">
                      <input
                        type={showPassword ? 'text' : 'password'}
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        placeholder="At least 6 characters"
                        className="w-full px-3.5 py-2.5 border border-gray-300 rounded-xl text-xs sm:text-sm text-gray-900 focus:ring-2 focus:ring-blue-500 outline-none pr-10"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                      >
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                      Confirm New Password *
                    </label>
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="Re-enter new password"
                      className="w-full px-3.5 py-2.5 border border-gray-300 rounded-xl text-xs sm:text-sm text-gray-900 focus:ring-2 focus:ring-blue-500 outline-none"
                    />
                  </div>
                </div>
              )}

              <div className="pt-3 flex justify-end gap-3 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setIsEditModalOpen(false)}
                  className="px-4 py-2.5 text-xs sm:text-sm font-semibold text-gray-700 hover:bg-gray-100 rounded-xl transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-6 py-2.5 text-xs sm:text-sm font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl transition-all shadow-sm flex items-center gap-2 disabled:opacity-50 active:scale-95"
                >
                  {saving && <Loader2 className="w-4 h-4 animate-spin" />}
                  <span>Save Changes</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
