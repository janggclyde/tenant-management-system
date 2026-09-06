'use client';

import { useState, useEffect } from 'react';
import { Layers, Plus, Check, X as XIcon, RefreshCw, AlertCircle } from 'lucide-react';
import { SubscriptionTierRecord } from '@/lib/customersStore';

export default function TiersPage() {
  const [tiers, setTiers] = useState<SubscriptionTierRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchTiers = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/super-admin/tiers');
      const data = await res.json();
      if (data.success && Array.isArray(data.tiers)) {
        setTiers(data.tiers);
      } else {
        throw new Error(data.error || 'Failed to load subscription tiers');
      }
    } catch (err: any) {
      setError(err.message || 'Error connecting to server');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTiers();
  }, []);

  return (
    <div className="p-6 md:p-8 max-w-7xl mx-auto space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Subscription Tiers</h1>
          <p className="text-gray-500 mt-1">Configure pricing and limits for SaaS platform tiers.</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={fetchTiers}
            disabled={loading}
            className="p-2.5 text-gray-600 hover:text-gray-900 border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors"
            title="Refresh tiers"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {error && (
        <div className="p-4 bg-red-50 border border-red-200 text-red-700 rounded-xl flex items-center gap-3 text-sm">
          <AlertCircle className="w-5 h-5 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[1, 2, 3].map((i) => (
            <div key={i} className="bg-white rounded-2xl shadow-xs border border-gray-200/80 p-6 animate-pulse space-y-4">
              <div className="h-6 bg-gray-200 rounded-md w-1/3"></div>
              <div className="h-10 bg-gray-200 rounded-md w-1/2"></div>
              <div className="space-y-2 pt-4 border-t border-gray-100">
                <div className="h-4 bg-gray-100 rounded-md w-3/4"></div>
                <div className="h-4 bg-gray-100 rounded-md w-2/3"></div>
                <div className="h-4 bg-gray-100 rounded-md w-4/5"></div>
              </div>
            </div>
          ))}
        </div>
      ) : tiers.length === 0 ? (
        <div className="bg-white rounded-2xl shadow-xs border border-gray-200/80 p-12 text-center flex flex-col items-center justify-center">
          <div className="w-14 h-14 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center mb-4">
            <Layers className="w-7 h-7" />
          </div>
          <h3 className="text-base font-bold text-gray-900">No Subscription Tiers Found</h3>
          <p className="text-sm text-gray-500 mt-1 max-w-md">
            Subscription tiers define the pricing structure, max buildings, and permissions for property managers.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {tiers.map((tier) => {
            const isPro = tier.name.toLowerCase() === 'pro';
            const isEnterprise = tier.name.toLowerCase() === 'enterprise';
            const features = tier.features_json || {};

            return (
              <div 
                key={tier.id} 
                className={`rounded-2xl shadow-xs border p-6 flex flex-col justify-between relative transition-all ${
                  isPro 
                    ? 'bg-blue-50/40 border-blue-200 ring-1 ring-blue-500/20' 
                    : isEnterprise
                    ? 'bg-purple-50/30 border-purple-200'
                    : 'bg-white border-gray-200/80'
                }`}
              >
                {isPro && (
                  <span className="absolute -top-3 right-6 bg-blue-600 text-white text-[11px] font-bold px-3 py-0.5 rounded-full shadow-xs uppercase tracking-wider">
                    Most Popular
                  </span>
                )}
                {isEnterprise && (
                  <span className="absolute -top-3 right-6 bg-purple-600 text-white text-[11px] font-bold px-3 py-0.5 rounded-full shadow-xs uppercase tracking-wider">
                    Scale
                  </span>
                )}
                <div>
                  <div className="flex justify-between items-start mb-3">
                    <h3 className="text-xl font-bold text-gray-900">{tier.name}</h3>
                  </div>
                  <div className="mb-6">
                    <span className="text-3xl font-extrabold text-gray-900">
                      ₱ {Number(tier.price).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </span>
                    <span className="text-xs text-gray-500 font-normal ml-1">/ month</span>
                  </div>

                  <ul className="space-y-3 text-xs text-gray-600 border-t border-gray-100 pt-5">
                    <li className="flex items-center gap-2">
                      <Check className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                      <span>{tier.max_buildings >= 999 ? 'Unlimited Buildings' : `Up to ${tier.max_buildings} Building${tier.max_buildings > 1 ? 's' : ''}`}</span>
                    </li>
                    <li className="flex items-center gap-2">
                      {features.max_units ? (
                        <>
                          <Check className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                          <span>Up to {features.max_units} Rental Units</span>
                        </>
                      ) : (
                        <>
                          <Check className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                          <span>Unlimited Units & Tenants</span>
                        </>
                      )}
                    </li>
                    <li className="flex items-center gap-2">
                      {tier.allow_email ? (
                        <>
                          <Check className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                          <span>Automated Email & Bill Dispatch</span>
                        </>
                      ) : (
                        <>
                          <XIcon className="w-4 h-4 text-gray-300 flex-shrink-0" />
                          <span className="text-gray-400">Automated Email Dispatch</span>
                        </>
                      )}
                    </li>
                    <li className="flex items-center gap-2">
                      <Check className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                      <span className="capitalize">{features.analytics || 'Basic'} Reporting & Analytics</span>
                    </li>
                    {features.custom_branding && (
                      <li className="flex items-center gap-2">
                        <Check className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                        <span>White-label Custom Branding</span>
                      </li>
                    )}
                    {features.dedicated_support && (
                      <li className="flex items-center gap-2">
                        <Check className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                        <span>24/7 Dedicated Account Support</span>
                      </li>
                    )}
                  </ul>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
