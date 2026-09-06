'use client';

import { useState, useEffect } from 'react';
import { Plus, Clock, Wrench, AlertCircle, CheckCircle2, Loader2, X } from 'lucide-react';

interface MaintenanceTicketRecord {
  id: number;
  title: string;
  description: string;
  status: 'open' | 'in_progress' | 'resolved';
  unit_id: number;
  created_at: string;
}

export default function MaintenancePage() {
  const [tickets, setTickets] = useState<MaintenanceTicketRecord[]>([]);
  const [loading, setLoading] = useState(true);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
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
          title: title.trim(),
          description: description.trim()
        })
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.error || 'Failed to submit request');

      setIsModalOpen(false);
      setTitle('');
      setDescription('');
      showToast('Maintenance request submitted successfully!');
      fetchTickets();
    } catch (err: any) {
      setError(err.message || 'Error submitting maintenance request.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="p-6 md:p-8 max-w-5xl mx-auto space-y-6">
      {toastMessage && (
        <div className="fixed bottom-5 right-5 z-50 bg-gray-900 text-white px-4 py-3 rounded-xl shadow-lg flex items-center gap-2 text-sm">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          <span>{toastMessage}</span>
        </div>
      )}

      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Maintenance Requests</h1>
          <p className="text-gray-500 mt-1">Submit and track maintenance and repair requests for your unit.</p>
        </div>
        <button 
          onClick={() => { setIsModalOpen(true); setError(null); }}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2.5 rounded-xl text-sm font-semibold transition-colors flex items-center shadow-xs"
        >
          <Plus className="w-4 h-4 mr-1.5" />
          <span>New Request</span>
        </button>
      </div>

      {loading ? (
        <div className="p-16 text-center text-gray-400 flex flex-col items-center justify-center bg-white rounded-2xl border border-gray-200">
          <Loader2 className="w-8 h-8 animate-spin text-blue-600 mb-2" />
          <span className="text-sm">Loading requests...</span>
        </div>
      ) : tickets.length > 0 ? (
        <div className="space-y-4">
          {tickets.map((t) => (
            <div key={t.id} className="bg-white rounded-2xl shadow-xs border border-gray-200 p-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 hover:border-gray-300 transition-all">
              <div>
                <div className="flex items-center gap-3 mb-2">
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold capitalize ${
                    t.status === 'resolved'
                      ? 'bg-green-100 text-green-800'
                      : t.status === 'in_progress'
                      ? 'bg-amber-100 text-amber-800'
                      : 'bg-blue-100 text-blue-800'
                  }`}>
                    {t.status.replace('_', ' ')}
                  </span>
                  <span className="text-xs text-gray-400 flex items-center">
                    <Clock className="w-3.5 h-3.5 mr-1" />
                    {new Date(t.created_at).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}
                  </span>
                </div>
                <h3 className="text-base font-bold text-gray-900">{t.title}</h3>
                <p className="text-sm text-gray-600 mt-1 leading-relaxed">{t.description}</p>
              </div>
              <div className="text-xs font-bold text-gray-400 bg-gray-50 px-3 py-1.5 rounded-lg border border-gray-100 whitespace-nowrap">
                Ticket #{t.id}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="p-16 text-center bg-white rounded-2xl border border-dashed border-gray-200">
          <div className="w-12 h-12 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center mx-auto mb-3">
            <Wrench className="w-6 h-6" />
          </div>
          <h3 className="text-base font-bold text-gray-800">No Maintenance Requests</h3>
          <p className="text-xs text-gray-500 mt-1 max-w-sm mx-auto mb-5">
            You have not submitted any maintenance or repair tickets yet.
          </p>
          <button 
            onClick={() => { setIsModalOpen(true); setError(null); }}
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold shadow-xs transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span>Create First Request</span>
          </button>
        </div>
      )}

      {/* New Maintenance Request Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl max-w-lg w-full shadow-2xl overflow-hidden border border-gray-200">
            <div className="px-6 py-4 bg-gray-50 border-b border-gray-200 flex justify-between items-center">
              <div>
                <h3 className="text-base font-bold text-gray-900">New Maintenance Request</h3>
                <p className="text-xs text-gray-500">Report an issue or request repairs for your unit</p>
              </div>
              <button 
                onClick={() => setIsModalOpen(false)}
                className="text-gray-400 hover:text-gray-600 p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmitTicket} className="p-6 space-y-4">
              {error && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-red-700 text-xs font-semibold flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">
                  Issue Title *
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Leaking Faucet in Kitchen Sink"
                  className="w-full px-3 py-2 border border-gray-300 rounded-xl text-sm font-semibold text-gray-900 focus:ring-2 focus:ring-blue-500 outline-none"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">
                  Detailed Description *
                </label>
                <textarea
                  rows={4}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Describe what happened, where the issue is, and any details that can help our team..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-xl text-sm text-gray-900 focus:ring-2 focus:ring-blue-500 outline-none resize-none"
                  required
                />
              </div>

              <div className="pt-3 flex justify-end gap-3 border-t border-gray-100">
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
