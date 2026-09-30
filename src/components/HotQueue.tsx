'use client';

import React, { useState, useEffect } from 'react';
import { useCrm } from '@/context/CrmContext';
import { Lead } from '@/types/crm';
import {
  Flame,
  PhoneCall,
  MessageSquare,
  Clock,
  Sparkles,
  ShieldCheck,
  ChevronRight,
  AlertTriangle,
  UserCheck,
  Radio,
  Volume2,
} from 'lucide-react';
import { formatTimeAgo } from '@/lib/utils';

interface HotQueueProps {
  onSelectLead: (lead: Lead) => void;
  onOpenOrder: (lead: Lead) => void;
}

export const HotQueue: React.FC<HotQueueProps> = ({ onSelectLead, onOpenOrder }) => {
  const {
    leads,
    currentUser,
    assignLead,
    updateLeadStage,
    logManualCall,
    sendWhatsAppMessage,
    playHotLeadChime,
    audioAlertEnabled,
  } = useCrm();

  const [currentTime, setCurrentTime] = useState(Date.now());

  // Update clock every second for live countdown
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(Date.now()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Filter Hot leads that are either New or Contacted
  const hotLeads = leads
    .filter((l) => l.lead_score === 'Hot' && (l.stage === 'New' || l.stage === 'Contacted'))
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

  const calculateSla = (createdAt: string) => {
    const createdTime = new Date(createdAt).getTime();
    const elapsedSec = Math.floor((currentTime - createdTime) / 1000);
    const targetSec = 120; // 2 minutes SLA target
    const remainingSec = targetSec - elapsedSec;

    return {
      elapsedSec,
      remainingSec,
      isOverdue: remainingSec < 0,
      formattedRemaining:
        remainingSec > 0
          ? `${Math.floor(remainingSec / 60)}m ${remainingSec % 60}s`
          : `OVERDUE by ${Math.abs(remainingSec)}s`,
      percent: Math.max(0, Math.min(100, (remainingSec / targetSec) * 100)),
    };
  };

  const handleQuickCall = (lead: Lead) => {
    logManualCall(lead.id, 'Answered - Consulted via Telecaller', 'Instant response call initiated from Hot Queue screen.');
    updateLeadStage(lead.id, 'Contacted');
  };

  const handleQuickWhatsApp = (lead: Lead) => {
    const message = `Namaste ${lead.name} ji! 🌿 Rohit here from Wellwith. I saw your inquiry regarding ${lead.concern}. We have our senior physician protocol ready for you. Would you like a 5-min guidance call?`;
    sendWhatsAppMessage(lead.id, message, 'hot_intake_welcome');
    updateLeadStage(lead.id, 'Contacted');
  };

  return (
    <div className="space-y-6">
      {/* Realtime Live Header Banner */}
      <div className="bg-white rounded-2xl p-6 border border-emerald-100 shadow-sm relative overflow-hidden">
        <div className="absolute top-0 right-0 -mt-4 -mr-4 w-48 h-48 bg-gradient-to-br from-emerald-100/60 to-rose-100/40 rounded-full blur-2xl pointer-events-none" />

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 relative z-10">
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <span className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold bg-rose-100 text-rose-700 border border-rose-200 animate-pulse">
                <Radio className="w-3.5 h-3.5 text-rose-600 animate-spin" />
                LIVE HOT LEAD DISPATCH
              </span>
              <span className="text-xs text-slate-500 font-medium flex items-center gap-1">
                <Radio className="w-3 h-3 text-emerald-500" />
                Supabase Realtime Channel: <code className="text-emerald-700 font-mono text-[11px]">leads:hot_queue</code>
              </span>
            </div>
            <h1 className="text-2xl font-black text-slate-900 tracking-tight">
              Speed-to-Call Queue ({hotLeads.length} Hot Leads)
            </h1>
            <p className="text-xs text-slate-500 mt-1 max-w-xl">
              Qualify inbound leads within <strong>60 to 90 seconds</strong> to maximize conversion. Bolna AI triggers
              automatically in the background; claim and follow up below.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={playHotLeadChime}
              className="flex items-center gap-1.5 px-3 py-2 bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-700 rounded-xl text-xs font-semibold transition-all"
            >
              <Volume2 className="w-4 h-4 text-emerald-600" />
              <span>Test Audio Chime</span>
            </button>
            <div className="bg-emerald-50 border border-emerald-200 px-4 py-2.5 rounded-xl text-right">
              <div className="text-[11px] font-bold text-emerald-800 uppercase tracking-wider">Median Speed Today</div>
              <div className="text-xl font-black text-emerald-700">42 seconds</div>
            </div>
          </div>
        </div>
      </div>

      {/* Leads Feed */}
      {hotLeads.length === 0 ? (
        <div className="bg-white rounded-2xl p-12 text-center border border-dashed border-emerald-200">
          <div className="w-16 h-16 mx-auto rounded-2xl bg-emerald-50 flex items-center justify-center text-emerald-600 mb-3">
            <ShieldCheck className="w-8 h-8" />
          </div>
          <h3 className="text-lg font-bold text-slate-800">Hot Queue is Clear!</h3>
          <p className="text-xs text-slate-500 max-w-md mx-auto mt-1">
            All inbound Meta and WhatsApp hot inquiries have been contacted within the 90s SLA window. Good job!
          </p>
          <div className="mt-4">
            <span className="text-xs text-slate-400 font-mono">Listening for incoming webhooks...</span>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {hotLeads.map((lead) => {
            const sla = calculateSla(lead.created_at);

            return (
              <div
                key={lead.id}
                className={`bg-white rounded-2xl border transition-all duration-200 overflow-hidden shadow-sm hover:shadow-md ${
                  sla.isOverdue
                    ? 'border-rose-300 ring-2 ring-rose-100 animate-pulse-glow'
                    : 'border-emerald-200 ring-1 ring-emerald-50'
                }`}
              >
                {/* Top SLA Bar */}
                <div
                  className={`px-4 py-2 flex items-center justify-between text-xs font-bold ${
                    sla.isOverdue ? 'bg-rose-50 text-rose-700' : 'bg-emerald-50 text-emerald-800'
                  }`}
                >
                  <div className="flex items-center gap-1.5">
                    <Flame className={`w-4 h-4 ${sla.isOverdue ? 'text-rose-600' : 'text-rose-500'}`} />
                    <span>HOT LEAD • {lead.stage}</span>
                  </div>
                  <div className="flex items-center gap-1 font-mono">
                    <Clock className="w-3.5 h-3.5" />
                    <span>{sla.formattedRemaining}</span>
                  </div>
                </div>

                {/* Progress Bar towards SLA */}
                <div className="w-full bg-slate-100 h-1.5">
                  <div
                    className={`h-full transition-all duration-500 ${
                      sla.isOverdue ? 'bg-rose-500' : sla.remainingSec < 45 ? 'bg-amber-500' : 'bg-emerald-500'
                    }`}
                    style={{ width: `${sla.percent}%` }}
                  />
                </div>

                {/* Body Content */}
                <div className="p-5 space-y-4">
                  <div className="flex justify-between items-start">
                    <div>
                      <h3
                        onClick={() => onSelectLead(lead)}
                        className="text-base font-bold text-slate-900 hover:text-emerald-700 cursor-pointer flex items-center gap-1.5"
                      >
                        {lead.name}
                        <ChevronRight className="w-4 h-4 text-slate-400" />
                      </h3>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-xs font-mono font-medium text-slate-600">{lead.phone_clean}</span>
                        <span className="text-[11px] text-slate-400">• {lead.area}</span>
                      </div>
                    </div>
                    <span className="text-[11px] font-medium text-slate-400">{formatTimeAgo(lead.created_at)}</span>
                  </div>

                  {/* Concern Highlight */}
                  <div className="bg-slate-50 border border-slate-100 rounded-xl p-3">
                    <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                      Reported Concern
                    </div>
                    <p className="text-xs font-medium text-slate-700 leading-relaxed">{lead.concern}</p>
                    {lead.product_interest && (
                      <div className="mt-2 pt-2 border-t border-slate-200/60 flex items-center gap-1.5 text-xs text-emerald-800 font-semibold">
                        <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
                        <span>Interest: {lead.product_interest}</span>
                      </div>
                    )}
                  </div>

                  {/* Metadata Chips */}
                  <div className="flex items-center justify-between text-xs text-slate-500 pt-1">
                    <span className="bg-slate-100 px-2 py-0.5 rounded text-[11px] font-medium">{lead.source}</span>
                    <div className="flex items-center gap-1 text-[11px]">
                      <UserCheck className="w-3.5 h-3.5 text-slate-400" />
                      <span>{lead.owner_name || 'Unassigned'}</span>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="pt-2 border-t border-slate-100 flex items-center gap-2">
                    <button
                      onClick={() => handleQuickCall(lead)}
                      className="flex-1 flex items-center justify-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold py-2 px-3 rounded-xl shadow-sm transition-all"
                    >
                      <PhoneCall className="w-3.5 h-3.5" />
                      <span>Instant Call</span>
                    </button>
                    <button
                      onClick={() => handleQuickWhatsApp(lead)}
                      className="flex-1 flex items-center justify-center gap-1.5 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 text-emerald-800 text-xs font-semibold py-2 px-3 rounded-xl transition-all"
                    >
                      <MessageSquare className="w-3.5 h-3.5 text-emerald-600" />
                      <span>WhatsApp</span>
                    </button>
                    <button
                      onClick={() => onOpenOrder(lead)}
                      className="p-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold"
                      title="Quick Counter Order (POS)"
                    >
                      🛒
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
