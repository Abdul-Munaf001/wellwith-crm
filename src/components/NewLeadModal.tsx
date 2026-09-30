'use client';

import React, { useState } from 'react';
import { useCrm } from '@/context/CrmContext';
import { LeadScore, LeadStage } from '@/types/crm';
import { X, UserPlus, Phone, MapPin, Tag, Sparkles } from 'lucide-react';
import { cleanPhone } from '@/lib/utils';

interface NewLeadModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const NewLeadModal: React.FC<NewLeadModalProps> = ({ isOpen, onClose }) => {
  const { addLead, campaigns, products, profiles, currentUser } = useCrm();

  const [name, setName] = useState('');
  const [phoneRaw, setPhoneRaw] = useState('');
  const [area, setArea] = useState('Banjara Hills, Hyderabad');
  const [source, setSource] = useState('Meta Instant Form');
  const [campaignId, setCampaignId] = useState('');
  const [couponCode, setCouponCode] = useState('');
  const [concern, setConcern] = useState('');
  const [productInterest, setProductInterest] = useState('');
  const [leadScore, setLeadScore] = useState<LeadScore>('Warm');
  const [stage, setStage] = useState<LeadStage>('New');
  const [notes, setNotes] = useState('');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const selCamp = campaigns.find((c) => c.id === campaignId);

    addLead({
      name,
      phone_raw: phoneRaw,
      area,
      source,
      campaign_id: campaignId || undefined,
      campaign_name: selCamp ? selCamp.name : undefined,
      coupon_code: couponCode || selCamp?.coupon_code,
      concern: concern || 'General wellness & stress consultation',
      product_interest: productInterest || undefined,
      lead_score: leadScore,
      stage,
      owner_id: currentUser.id,
      owner_name: currentUser.name,
      notes,
    });

    onClose();
  };

  const { phoneClean, isValid } = cleanPhone(phoneRaw);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="bg-white rounded-3xl w-full max-w-lg shadow-2xl border border-emerald-100 overflow-hidden my-auto animate-in fade-in zoom-in-95 duration-150">
        <div className="bg-gradient-to-r from-emerald-800 to-teal-800 text-white p-6 relative">
          <button
            onClick={onClose}
            className="absolute top-5 right-5 p-1.5 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs uppercase font-extrabold px-2.5 py-0.5 rounded-full bg-white/20 text-emerald-200">
              Manual Intake
            </span>
          </div>
          <h2 className="text-2xl font-black tracking-tight">Register New Lead</h2>
          <p className="text-xs text-emerald-100 mt-1">
            Creates lead profile with automated +91 sanitization and auto-triggers hot queue if scored Hot.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4 text-xs">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                Patient / Customer Name
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Dr. Kavita Iyer"
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                Phone Number
              </label>
              <input
                type="text"
                required
                value={phoneRaw}
                onChange={(e) => setPhoneRaw(e.target.value)}
                placeholder="98401 23456"
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-mono font-semibold focus:ring-2 focus:ring-emerald-500 focus:outline-none"
              />
              {phoneRaw && (
                <div className="mt-1 text-[10px] flex items-center justify-between">
                  <span className="font-mono text-slate-500">{phoneClean}</span>
                  <span className={isValid ? 'text-emerald-700 font-bold' : 'text-rose-600 font-bold'}>
                    {isValid ? 'Valid (+91)' : 'Invalid digits'}
                  </span>
                </div>
              )}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                Clinic Location / Area
              </label>
              <input
                type="text"
                value={area}
                onChange={(e) => setArea(e.target.value)}
                placeholder="Banjara Hills, Hyderabad"
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                Inbound Source
              </label>
              <select
                value={source}
                onChange={(e) => setSource(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2 text-xs text-slate-700 focus:ring-2 focus:ring-emerald-500"
              >
                <option value="Meta Instant Form">Meta Instant Form</option>
                <option value="Instagram">Instagram</option>
                <option value="Store Walk-in">Store Walk-in</option>
                <option value="WhatsApp">WhatsApp</option>
                <option value="Website">Website</option>
                <option value="Backlog">Backlog (60-90 Day)</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
              Reported Health Concern
            </label>
            <input
              type="text"
              required
              value={concern}
              onChange={(e) => setConcern(e.target.value)}
              placeholder="e.g. Insomnia, bloating after meals, gym stamina"
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                Product Interest
              </label>
              <select
                value={productInterest}
                onChange={(e) => setProductInterest(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2 text-xs text-slate-700 focus:ring-2 focus:ring-emerald-500"
              >
                <option value="">Select Formulation</option>
                {products.map((p) => (
                  <option key={p.id} value={p.name}>
                    {p.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                Intent Score
              </label>
              <div className="grid grid-cols-3 gap-1">
                {(['Hot', 'Warm', 'Cold'] as LeadScore[]).map((sc) => (
                  <button
                    key={sc}
                    type="button"
                    onClick={() => setLeadScore(sc)}
                    className={`py-1.5 rounded-lg font-bold text-center text-xs ${
                      leadScore === sc
                        ? sc === 'Hot'
                          ? 'bg-rose-600 text-white'
                          : sc === 'Warm'
                          ? 'bg-amber-500 text-white'
                          : 'bg-blue-600 text-white'
                        : 'bg-slate-100 text-slate-600'
                    }`}
                  >
                    {sc}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div>
            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
              Initial Note
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Initial conversation context..."
              rows={2}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-none"
            />
          </div>

          <div className="pt-2 flex items-center gap-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-2 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs shadow-md transition-all flex items-center justify-center gap-1.5"
            >
              <UserPlus className="w-4 h-4" />
              <span>Save & Trigger Inbound Flow</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
