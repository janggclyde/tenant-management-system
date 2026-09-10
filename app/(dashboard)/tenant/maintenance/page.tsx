'use client';

import { useState, useEffect } from 'react';
import { 
  Plus, 
  Clock, 
  Wrench, 
  AlertCircle, 
  CheckCircle2, 
  Loader2, 
  X, 
  Flame, 
  Sparkles, 
  Camera, 
  Building2, 
  Tag, 
  ChevronRight,
  ExternalLink
} from 'lucide-react';

interface MaintenanceTicketRecord {
  id: number;
  title: string;
  description: string;
  status: 'open' | 'in_progress' | 'resolved';
  unit_id: number;
  unit_number?: string;
  building_name?: string;
  photos?: string[];
  created_at: string;
}

const CATEGORIES = [
  'Plumbing & Water',
  'Electrical & Lights',
  'Air Conditioning',
  'Appliance & Fixtures',
  'Doors, Windows & Locks',
  'Pest Control',
  'Structural & Paint',
  'General / Other'
];

export default function MaintenancePage() {
  const [tickets, setTickets] = useState<MaintenanceTicketRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'open' | 'in_progress' | 'resolved'>('all');

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [category, setCategory] = useState(CATEGORIES[0]);
  const [priority, setPriority] = useState<'Normal' | 'Urgent' | 'Emergency'>('Normal');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [photoUrl, setPhotoUrl] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const fetchTickets = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/tenant/maintenance');
      const data = await res.json();
      if (data.success) {
        setTickets(data.tickets || []);
      }
    } catch (err) {
      console.error('Failed to load tickets', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTickets();
  }, []);

  const handleSubmitTicket = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !description.trim()) {
      setError('Please provide both a subject title and description.');
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      const res = await fetch('/api/tenant/maintenance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          category,
          priority,
          title: title.trim(),
          description: description.trim(),
          photo_url: photoUrl.trim() || undefined
        })
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.error || 'Failed to submit request');

      setIsModalOpen(false);
      setTitle('');
      setDescription('');
      setPhotoUrl('');
      setCategory(CATEGORIES[0]);
      setPriority('Normal');
      showToast('Maintenance request submitted successfully!');
      fetchTickets();
    } catch (err: any) {
      setError(err.message || 'Error submitting maintenance request.');
    } finally {
      setSubmitting(false);
    }
  };

  const filteredTickets = tickets.filter(t => {
    if (filter === 'all') return true;
    return t.status === filter;
  });

  const countOpen = tickets.filter(t => t.status === 'open').length;
  const countInProgress = tickets.filter(t => t.status === 'in_progress').length;
  const countResolved = tickets.filter(t => t.status === 'resolved').length;

  return (
    <div className="p-4 sm:p-6 md:p-8 max-w-5xl mx-auto space-y-6">
      {/* Toast */}
      {toastMessage && (
        <div className="fixed bottom-20 md:bottom-8 right-4 left-4 sm:left-auto sm:right-8 z-50 bg-gray-900 text-white px-5 py-3.5 rounded-2xl shadow-xl flex items-center gap-3 text-sm animate-in fade-in slide-in-from-bottom-4">
          <CheckCircle2 className="w-5 h-5 text-emerald-400 flex-shrink-0" />
          <span className="font-semibold">{toastMessage}</span>
        </div>
      )}

      {/* Header & New Request Button */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-gray-900 tracking-tight">Maintenance & Repairs</h1>
          <p className="text-xs sm:text-sm text-gray-500 mt-1 font-medium">
            Report maintenance issues and track property technician visits.
          </p>
        </div>
        <button 
          onClick={() => { setIsModalOpen(true); setError(null); }}
          className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700 text-white px-5 py-3 rounded-2xl text-xs sm:text-sm font-bold transition-all flex items-center justify-center gap-2 shadow-sm active:scale-95"
        >
          <Plus className="w-4 h-4" />
          <span>New Request</span>
        </button>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1">
        <button
          onClick={() => setFilter('all')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap active:scale-95 ${
            filter === 'all'
              ? 'bg-blue-600 text-white shadow-xs'
              : 'bg-white text-gray-600 hover:bg-gray-100 border border-gray-200'
          }`}
        >
          All Requests ({tickets.length})
        </button>
        <button
          onClick={() => setFilter('open')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap active:scale-95 ${
            filter === 'open'
              ? 'bg-blue-600 text-white shadow-xs'
              : 'bg-white text-gray-600 hover:bg-gray-100 border border-gray-200'
          }`}
        >
          Open ({countOpen})
        </button>
        <button
          onClick={() => setFilter('in_progress')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap active:scale-95 ${
            filter === 'in_progress'
              ? 'bg-amber-600 text-white shadow-xs'
              : 'bg-white text-gray-600 hover:bg-gray-100 border border-gray-200'
          }`}
        >
          In Progress ({countInProgress})
        </button>
        <button
          onClick={() => setFilter('resolved')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap active:scale-95 ${
            filter === 'resolved'
              ? 'bg-emerald-600 text-white shadow-xs'
              : 'bg-white text-gray-600 hover:bg-gray-100 border border-gray-200'
          }`}
        >
          Resolved ({countResolved})
        </button>
      </div>

      {/* Ticket Cards (Mobile-First) */}
      {loading ? (
        <div className="p-16 text-center text-gray-400 flex flex-col items-center justify-center bg-white rounded-3xl border border-gray-200">
          <Loader2 className="w-8 h-8 animate-spin text-blue-600 mb-2" />
          <span className="text-sm font-medium">Loading maintenance requests...</span>
        </div>
      ) : filteredTickets.length > 0 ? (
        <div className="space-y-4">
          {filteredTickets.map((t) => {
            const isResolved = t.status === 'resolved';
            const isInProgress = t.status === 'in_progress';

            return (
              <div 
                key={t.id} 
                className="bg-white rounded-3xl shadow-xs border border-gray-200 p-5 sm:p-6 transition-all hover:border-gray-300 space-y-4"
              >
                {/* Header Row */}
                <div className="flex items-start justify-between gap-3">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-xs font-mono font-bold text-gray-500 bg-gray-100 px-2 py-0.5 rounded-lg">
                        #{t.id}
                      </span>
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider ${
                        isResolved
                          ? 'bg-emerald-100 text-emerald-800'
                          : isInProgress
                          ? 'bg-amber-100 text-amber-800'
                          : 'bg-blue-100 text-blue-800'
                      }`}>
                        {t.status.replace('_', ' ')}
                      </span>
                    </div>
                    <h3 className="text-base sm:text-lg font-black text-gray-900 leading-tight">
                      {t.title}
                    </h3>
                  </div>

                  <div className="text-right flex-shrink-0">
                    <span className="text-[11px] text-gray-400 flex items-center gap-1 font-medium">
                      <Clock className="w-3.5 h-3.5" />
                      {new Date(t.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                    </span>
                  </div>
                </div>

                {/* Progress Step Bar */}
                <div className="bg-gray-50 rounded-2xl p-3 border border-gray-100">
                  <div className="flex items-center justify-between text-[11px] font-bold text-gray-400 mb-1.5 px-1">
                    <span className={t.status ? 'text-blue-600' : ''}>1. Received</span>
                    <span className={isInProgress || isResolved ? 'text-amber-600' : ''}>2. In Progress</span>
                    <span className={isResolved ? 'text-emerald-600' : ''}>3. Resolved</span>
                  </div>
                  <div className="h-1.5 bg-gray-200 rounded-full overflow-hidden flex">
                    <div className="h-full bg-blue-600 w-1/3" />
                    <div className={`h-full ${isInProgress || isResolved ? 'bg-amber-500' : 'bg-transparent'} w-1/3 transition-all`} />
                    <div className={`h-full ${isResolved ? 'bg-emerald-500' : 'bg-transparent'} w-1/3 transition-all`} />
                  </div>
                </div>

                {/* Description */}
                <p className="text-xs sm:text-sm text-gray-600 leading-relaxed whitespace-pre-line">
                  {t.description}
                </p>

                {/* Photos if any */}
                {t.photos && t.photos.length > 0 && (
                  <div className="pt-2">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400 block mb-1.5">
                      Attachments ({t.photos.length})
                    </span>
                    <div className="flex items-center gap-2 overflow-x-auto pb-1">
                      {t.photos.map((p, idx) => (
                        <a
                          key={idx}
                          href={p}
                          target="_blank"
                          rel="noreferrer"
                          className="h-16 w-16 sm:h-20 sm:w-20 rounded-xl bg-gray-100 border border-gray-200 overflow-hidden flex-shrink-0 flex items-center justify-center hover:opacity-80 transition-opacity"
                        >
                          <span className="text-[10px] font-bold text-blue-600 flex items-center gap-1">
                            Photo {idx + 1}
                            <ExternalLink className="w-3 h-3" />
                          </span>
                        </a>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      ) : (
        <div className="p-16 text-center bg-white rounded-3xl border border-dashed border-gray-200 space-y-3">
          <div className="w-14 h-14 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center mx-auto">
            <Wrench className="w-7 h-7" />
          </div>
          <h3 className="text-base sm:text-lg font-bold text-gray-900">No Maintenance Requests</h3>
          <p className="text-xs text-gray-500 max-w-sm mx-auto">
            {filter === 'all' 
              ? 'Everything in your unit is operating smoothly. Need any repairs or assistance?' 
              : `You have zero ${filter.replace('_', ' ')} requests.`}
          </p>
          <button 
            onClick={() => { setIsModalOpen(true); setError(null); }}
            className="inline-flex items-center gap-1.5 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs sm:text-sm font-bold shadow-xs transition-all active:scale-95"
          >
            <Plus className="w-4 h-4" />
            <span>Create New Request</span>
          </button>
        </div>
      )}

      {/* Mobile-First New Maintenance Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white rounded-t-3xl sm:rounded-3xl max-w-lg w-full shadow-2xl overflow-hidden border border-gray-200 max-h-[92vh] flex flex-col">
            <div className="px-6 py-4 bg-gray-50 border-b border-gray-200 flex justify-between items-center">
              <div>
                <h3 className="text-base font-bold text-gray-900">New Maintenance Request</h3>
                <p className="text-xs text-gray-500">Report an issue for property technician inspection</p>
              </div>
              <button 
                onClick={() => setIsModalOpen(false)}
                className="text-gray-400 hover:text-gray-600 p-1 rounded-xl"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmitTicket} className="p-6 space-y-4 overflow-y-auto">
              {error && (
                <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-2xl text-rose-700 text-xs font-semibold flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              {/* Category selector */}
              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                  Category *
                </label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full px-3.5 py-2.5 border border-gray-300 rounded-xl text-xs sm:text-sm font-semibold text-gray-900 focus:ring-2 focus:ring-blue-500 outline-none bg-white"
                >
                  {CATEGORIES.map(c => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>

              {/* Priority Selector */}
              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                  Urgency Level
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {(['Normal', 'Urgent', 'Emergency'] as const).map((p) => (
                    <button
                      key={p}
                      type="button"
                      onClick={() => setPriority(p)}
                      className={`py-2 px-3 rounded-xl text-xs font-bold transition-all text-center ${
                        priority === p
                          ? p === 'Emergency'
                            ? 'bg-rose-600 text-white shadow-xs'
                            : p === 'Urgent'
                            ? 'bg-amber-600 text-white shadow-xs'
                            : 'bg-blue-600 text-white shadow-xs'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      {p}
                    </button>
                  ))}
                </div>
              </div>

              {/* Title */}
              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                  Issue Summary *
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Kitchen sink faucet dripping"
                  className="w-full px-3.5 py-2.5 border border-gray-300 rounded-xl text-xs sm:text-sm font-semibold text-gray-900 focus:ring-2 focus:ring-blue-500 outline-none"
                  required
                />
              </div>

              {/* Description */}
              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                  Detailed Description *
                </label>
                <textarea
                  rows={4}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Explain what happened, location in the unit, and best time for technician visit..."
                  className="w-full px-3.5 py-2.5 border border-gray-300 rounded-xl text-xs sm:text-sm text-gray-900 focus:ring-2 focus:ring-blue-500 outline-none resize-none"
                  required
                />
              </div>

              {/* Optional Photo Attachment */}
              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                  Photo / Attachment URL (Optional)
                </label>
                <input
                  type="url"
                  value={photoUrl}
                  onChange={(e) => setPhotoUrl(e.target.value)}
                  placeholder="https://example.com/photo.jpg"
                  className="w-full px-3.5 py-2.5 border border-gray-300 rounded-xl text-xs text-gray-900 focus:ring-2 focus:ring-blue-500 outline-none"
                />
              </div>

              <div className="pt-3 flex justify-end gap-3 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2.5 text-xs sm:text-sm font-semibold text-gray-700 hover:bg-gray-100 rounded-xl transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-6 py-2.5 text-xs sm:text-sm font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl transition-all shadow-sm flex items-center gap-2 disabled:opacity-50 active:scale-95"
                >
                  {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
                  <span>Submit Ticket</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
