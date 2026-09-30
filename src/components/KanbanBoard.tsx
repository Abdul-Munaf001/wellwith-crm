'use client';

import React, { useState } from 'react';
import { useCrm } from '@/context/CrmContext';
import { Lead, LeadStage, LeadScore } from '@/types/crm';
import {
  Flame,
  Sun,
  Snowflake,
  ChevronLeft,
  ChevronRight,
  Clock,
  AlertCircle,
  PhoneCall,
  MessageSquare,
  Filter,
  Search,
} from 'lucide-react';
import { formatTimeAgo } from '@/lib/utils';

interface KanbanBoardProps {
  onSelectLead: (lead: Lead) => void;
  onOpenOrder: (lead: Lead) => void;
}

const STAGES: { stage: LeadStage; label: string; color: string; badgeBg: string }[] = [
  { stage: 'New', label: '1. New Inbound', color: 'border-blue-400', badgeBg: 'bg-blue-50 text-blue-700' },
  { stage: 'Contacted', label: '2. Contacted', color: 'border-amber-400', badgeBg: 'bg-amber-50 text-amber-700' },
  { stage: 'Qualified', label: '3. Qualified', color: 'border-emerald-400', badgeBg: 'bg-emerald-50 text-emerald-700' },
  { stage: 'Offer sent', label: '4. Offer Sent', color: 'border-purple-400', badgeBg: 'bg-purple-50 text-purple-700' },
  { stage: 'Ordered', label: '5. Ordered', color: 'border-teal-500', badgeBg: 'bg-teal-50 text-teal-800' },
  { stage: 'Delivered/Visited', label: '6. Delivered / Visited', color: 'border-emerald-600', badgeBg: 'bg-emerald-100 text-emerald-900' },
  { stage: 'Reorder due', label: '7. Reorder Due (Day 25)', color: 'border-rose-400', badgeBg: 'bg-rose-50 text-rose-700' },
];

export const KanbanBoard: React.FC<KanbanBoardProps> = ({ onSelectLead, onOpenOrder }) => {
  const { leads, updateLeadStage, currentUser } = useCrm();
  const [filterScore, setFilterScore] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Check role restrictions: Closer only sees their assigned leads + unassigned Hot queue
  const accessibleLeads = leads.filter((lead) => {
    if (currentUser.role === 'closer') {
      const isAssigned = lead.owner_id === currentUser.id;
      const isUnassignedHot = !lead.owner_id && (lead.lead_score === 'Hot' || lead.stage === 'New');
      if (!isAssigned && !isUnassignedHot) return false;
    }
    if (filterScore !== 'all' && lead.lead_score !== filterScore) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchName = lead.name.toLowerCase().includes(q);
      const matchPhone = lead.phone_clean.includes(q);
      const matchConcern = lead.concern?.toLowerCase().includes(q);
      if (!matchName && !matchPhone && !matchConcern) return false;
    }
    return true;
  });

  const getScoreBadge = (score: LeadScore) => {
    switch (score) {
      case 'Hot':
        return (
          <span className="flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 text-rose-700 border border-rose-200">
            <Flame className="w-3 h-3 text-rose-600" />
            HOT
          </span>
        );
      case 'Warm':
        return (
          <span className="flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-200">
            <Sun className="w-3 h-3 text-amber-600" />
            WARM
          </span>
        );
      case 'Cold':
        return (
          <span className="flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-100 text-blue-700 border border-blue-200">
            <Snowflake className="w-3 h-3 text-blue-500" />
            COLD
          </span>
        );
    }
  };

  const isLeadOverdue = (lead: Lead) => {
    if (lead.next_followup_at) {
      return new Date(lead.next_followup_at).getTime() < Date.now();
    }
    // New hot lead older than 2 minutes without contact
    if (lead.stage === 'New' && lead.lead_score === 'Hot') {
      const elapsedSec = (Date.now() - new Date(lead.created_at).getTime()) / 1000;
      return elapsedSec > 120;
    }
    return false;
  };

  const advanceStage = (leadId: string, currentStage: LeadStage) => {
    const currentIndex = STAGES.findIndex((s) => s.stage === currentStage);
    if (currentIndex < STAGES.length - 1) {
      updateLeadStage(leadId, STAGES[currentIndex + 1].stage);
    }
  };

  const regressedStage = (leadId: string, currentStage: LeadStage) => {
    const currentIndex = STAGES.findIndex((s) => s.stage === currentStage);
    if (currentIndex > 0) {
      updateLeadStage(leadId, STAGES[currentIndex - 1].stage);
    }
  };

  return (
    <div className="space-y-4">
      {/* Top Controls & Filter Bar */}
      <div className="bg-white rounded-xl p-4 border border-emerald-100 shadow-sm flex flex-col md:flex-row items-center justify-between gap-3">
        <div className="flex items-center gap-3 w-full md:w-auto">
          <div className="relative flex-1 md:w-72">
            <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
            <input
              type="text"
              placeholder="Search card by name, concern, phone..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          <div className="flex items-center gap-1.5">
            <Filter className="w-3.5 h-3.5 text-slate-400" />
            <select
              value={filterScore}
              onChange={(e) => setFilterScore(e.target.value)}
              className="text-xs bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 focus:outline-none focus:ring-2 focus:ring-emerald-500 font-medium text-slate-700"
            >
              <option value="all">All Lead Scores</option>
              <option value="Hot">🔥 Hot Only</option>
              <option value="Warm">☀️ Warm Only</option>
              <option value="Cold">❄️ Cold Only</option>
            </select>
          </div>
        </div>

        <div className="text-xs text-slate-500 font-medium flex items-center gap-2">
          <span>Showing {accessibleLeads.length} leads across 7 stages</span>
          <span className="hidden sm:inline text-slate-300">|</span>
          <span className="hidden sm:inline text-emerald-700 font-semibold">Tip: Click any card to view timeline & AI call transcript</span>
        </div>
      </div>

      {/* Kanban Multi-Column Grid */}
      <div className="flex gap-4 overflow-x-auto pb-4 no-scrollbar min-h-[600px]">
        {STAGES.map((col, index) => {
          const stageLeads = accessibleLeads.filter((l) => l.stage === col.stage);

          return (
            <div
              key={col.stage}
              className="w-80 shrink-0 bg-slate-50/70 border border-slate-200 rounded-2xl p-3 flex flex-col max-h-[820px]"
            >
              {/* Column Header */}
              <div className="flex items-center justify-between mb-3 px-1">
                <div className="flex items-center gap-2">
                  <span className={`w-2.5 h-2.5 rounded-full border-2 ${col.color} bg-white`} />
                  <h3 className="text-xs font-bold text-slate-800 tracking-tight">{col.label}</h3>
                </div>
                <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${col.badgeBg}`}>
                  {stageLeads.length}
                </span>
              </div>

              {/* Cards List */}
              <div className="flex-1 overflow-y-auto space-y-3 pr-1">
                {stageLeads.length === 0 ? (
                  <div className="h-32 border border-dashed border-slate-200 rounded-xl flex items-center justify-center text-[11px] text-slate-400">
                    No leads in this stage
                  </div>
                ) : (
                  stageLeads.map((lead) => {
                    const overdue = isLeadOverdue(lead);

                    return (
                      <div
                        key={lead.id}
                        className={`bg-white rounded-xl border p-3.5 shadow-sm hover:shadow-md transition-all cursor-pointer relative group ${
                          overdue ? 'border-rose-300 ring-1 ring-rose-200' : 'border-slate-200/80 hover:border-emerald-300'
                        }`}
                      >
                        {/* Overdue Tag */}
                        {overdue && (
                          <div className="mb-2 flex items-center gap-1 text-[10px] font-extrabold text-rose-700 bg-rose-50 border border-rose-200 px-2 py-0.5 rounded-md">
                            <AlertCircle className="w-3 h-3 text-rose-600" />
                            <span>OVERDUE SLA</span>
                          </div>
                        )}

                        {/* Card Header */}
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <h4
                              onClick={() => onSelectLead(lead)}
                              className="text-sm font-bold text-slate-900 group-hover:text-emerald-700 transition-colors"
                            >
                              {lead.name}
                            </h4>
                            <div className="text-[11px] font-mono text-slate-500">{lead.phone_clean}</div>
                          </div>
                          {getScoreBadge(lead.lead_score)}
                        </div>

                        {/* Concern snippet */}
                        <p className="text-xs text-slate-600 mt-2 line-clamp-2 bg-slate-50 p-2 rounded-lg border border-slate-100 font-medium">
                          {lead.concern}
                        </p>

                        {/* Details & Attribution */}
                        <div className="mt-2.5 flex items-center justify-between text-[11px] text-slate-400">
                          <span className="flex items-center gap-1 font-medium">
                            <Clock className="w-3 h-3" />
                            {formatTimeAgo(lead.created_at)}
                          </span>
                          <span className="bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded text-[10px] font-semibold">
                            {lead.coupon_code || lead.source}
                          </span>
                        </div>

                        {/* Quick Navigation Controls */}
                        <div className="mt-3 pt-2 border-t border-slate-100 flex items-center justify-between">
                          <div className="flex items-center gap-1">
                            {index > 0 && (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  regressedStage(lead.id, lead.stage);
                                }}
                                className="p-1 hover:bg-slate-100 rounded text-slate-400 hover:text-slate-700 text-xs"
                                title="Move Back"
                              >
                                <ChevronLeft className="w-3.5 h-3.5" />
                              </button>
                            )}
                            {index < STAGES.length - 1 && (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  advanceStage(lead.id, lead.stage);
                                }}
                                className="flex items-center gap-0.5 px-2 py-0.8 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 rounded text-[11px] font-bold border border-emerald-200 transition-colors"
                                title="Advance to Next Stage"
                              >
                                <span>Move Next</span>
                                <ChevronRight className="w-3 h-3" />
                              </button>
                            )}
                          </div>

                          <div className="flex items-center gap-1">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                onOpenOrder(lead);
                              }}
                              className="p-1 hover:bg-emerald-50 text-slate-500 hover:text-emerald-700 rounded text-xs"
                              title="Counter Order"
                            >
                              🛒
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                onSelectLead(lead);
                              }}
                              className="text-[11px] font-semibold text-slate-400 hover:text-emerald-700"
                            >
                              View &rarr;
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
