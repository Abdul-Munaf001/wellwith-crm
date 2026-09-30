'use client';

import React, { useState, useMemo } from 'react';
import { useCrm } from '@/context/CrmContext';
import { Lead, LeadScore, LeadStage } from '@/types/crm';
import {
  Search,
  Filter,
  Download,
  Flame,
  Sun,
  Snowflake,
  ShieldAlert,
  PhoneCall,
  MessageSquare,
  AlertTriangle,
  ChevronRight,
  User,
  MapPin,
  Calendar,
  CheckCircle2,
  XCircle,
} from 'lucide-react';
import { formatTimeAgo } from '@/lib/utils';

interface LeadsListProps {
  onSelectLead: (lead: Lead) => void;
  onOpenOrder: (lead: Lead) => void;
}

type SavedView = 'all' | 'my-hot' | 'due-today' | 'overdue' | 'invalid' | 'escalated';

export const LeadsList: React.FC<LeadsListProps> = ({ onSelectLead, onOpenOrder }) => {
  const { leads, currentUser, deleteLead, campaigns, profiles } = useCrm();

  const [activeView, setActiveView] = useState<SavedView>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStage, setFilterStage] = useState<string>('all');
  const [filterScore, setFilterScore] = useState<string>('all');
  const [filterSource, setFilterSource] = useState<string>('all');
  const [filterOwner, setFilterOwner] = useState<string>('all');

  // Role permissions: Closer sees only assigned leads + hot unassigned
  const baseLeads = useMemo(() => {
    return leads.filter((lead) => {
      if (currentUser.role === 'closer') {
        const isAssigned = lead.owner_id === currentUser.id;
        const isUnassignedHot = !lead.owner_id && (lead.lead_score === 'Hot' || lead.stage === 'New');
        return isAssigned || isUnassignedHot;
      }
      return true;
    });
  }, [leads, currentUser]);

  // Apply Saved View logic
  const viewFilteredLeads = useMemo(() => {
    const now = Date.now();
    const todayStr = new Date().toISOString().split('T')[0];

    return baseLeads.filter((lead) => {
      switch (activeView) {
        case 'my-hot':
          return lead.lead_score === 'Hot' && (lead.owner_id === currentUser.id || !lead.owner_id);
        case 'due-today':
          return (
            lead.next_followup_at &&
            new Date(lead.next_followup_at).toISOString().split('T')[0] === todayStr
          );
        case 'overdue':
          return lead.next_followup_at && new Date(lead.next_followup_at).getTime() < now;
        case 'invalid':
          return lead.valid === false;
        case 'escalated':
          return lead.escalated === true;
        default:
          return true;
      }
    });
  }, [baseLeads, activeView, currentUser]);

  // Apply Multi-Filters & Search
  const filteredLeads = useMemo(() => {
    return viewFilteredLeads.filter((lead) => {
      if (filterStage !== 'all' && lead.stage !== filterStage) return false;
      if (filterScore !== 'all' && lead.lead_score !== filterScore) return false;
      if (filterSource !== 'all' && lead.source !== filterSource) return false;
      if (filterOwner !== 'all' && lead.owner_id !== filterOwner) return false;

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchName = lead.name.toLowerCase().includes(q);
        const matchPhone = lead.phone_clean?.includes(q) || lead.phone_raw?.includes(q);
        const matchConcern = lead.concern?.toLowerCase().includes(q);
        const matchArea = lead.area?.toLowerCase().includes(q);
        if (!matchName && !matchPhone && !matchConcern && !matchArea) return false;
      }

      return true;
    });
  }, [viewFilteredLeads, filterStage, filterScore, filterSource, filterOwner, searchQuery]);

  // CSV Export for Manager & Owner
  const handleExportCsv = () => {
    if (currentUser.role === 'closer' || currentUser.role === 'viewer') {
      alert('Access Denied: Only Manager and Owner can export leads to CSV.');
      return;
    }

    const headers = [
      'ID',
      'Name',
      'Phone Clean',
      'Valid',
      'Score',
      'Stage',
      'Source',
      'Concern',
      'Area',
      'Response Time (sec)',
      'Call Attempts',
      'Owner',
      'Escalated',
      'Created At',
    ];

    const rows = filteredLeads.map((l) => [
      l.id,
      `"${l.name}"`,
      l.phone_clean,
      l.valid ? 'YES' : 'NO',
      l.lead_score,
      l.stage,
      `"${l.source}"`,
      `"${l.concern?.replace(/"/g, '""')}"`,
      `"${l.area}"`,
      l.response_time_sec || '',
      l.call_attempts,
      `"${l.owner_name || ''}"`,
      l.escalated ? 'YES' : 'NO',
      l.created_at,
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `wellwith_leads_export_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const getScoreBadge = (score: LeadScore) => {
    switch (score) {
      case 'Hot':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold bg-rose-50 text-rose-700 border border-rose-200">
            <Flame className="w-3 h-3 text-rose-600" />
            Hot
          </span>
        );
      case 'Warm':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold bg-amber-50 text-amber-800 border border-amber-200">
            <Sun className="w-3 h-3 text-amber-600" />
            Warm
          </span>
        );
      case 'Cold':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold bg-blue-50 text-blue-700 border border-blue-200">
            <Snowflake className="w-3 h-3 text-blue-500" />
            Cold
          </span>
        );
    }
  };

  const savedViews: { id: SavedView; label: string; icon: string; count: number }[] = [
    { id: 'all', label: 'All Leads', icon: '📋', count: baseLeads.length },
    {
      id: 'my-hot',
      label: 'My Hot Leads',
      icon: '🔥',
      count: baseLeads.filter((l) => l.lead_score === 'Hot').length,
    },
    {
      id: 'due-today',
      label: 'Due Today',
      icon: '⏰',
      count: baseLeads.filter(
        (l) => l.next_followup_at && l.next_followup_at.split('T')[0] === new Date().toISOString().split('T')[0]
      ).length,
    },
    {
      id: 'overdue',
      label: 'Overdue',
      icon: '⚠️',
      count: baseLeads.filter((l) => l.next_followup_at && new Date(l.next_followup_at).getTime() < Date.now()).length,
    },
    {
      id: 'invalid',
      label: 'Invalid Numbers',
      icon: '🚫',
      count: baseLeads.filter((l) => !l.valid).length,
    },
    {
      id: 'escalated',
      label: 'Escalated (Safety)',
      icon: '🚨',
      count: baseLeads.filter((l) => l.escalated).length,
    },
  ];

  return (
    <div className="space-y-4">
      {/* Saved Views Pills */}
      <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar">
        {savedViews.map((sv) => (
          <button
            key={sv.id}
            onClick={() => setActiveView(sv.id)}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
              activeView === sv.id
                ? 'bg-emerald-700 text-white shadow-sm ring-1 ring-emerald-600'
                : 'bg-white text-slate-600 hover:text-emerald-700 hover:bg-emerald-50/70 border border-slate-200'
            }`}
          >
            <span>{sv.icon}</span>
            <span>{sv.label}</span>
            <span
              className={`px-1.5 py-0.2 rounded-full text-[10px] ${
                activeView === sv.id ? 'bg-emerald-800 text-emerald-100' : 'bg-slate-100 text-slate-600'
              }`}
            >
              {sv.count}
            </span>
          </button>
        ))}
      </div>

      {/* Main Filter & Search Bar */}
      <div className="bg-white rounded-2xl p-4 border border-emerald-100 shadow-sm space-y-3">
        <div className="flex flex-col md:flex-row items-center justify-between gap-3">
          {/* Search Field */}
          <div className="relative w-full md:w-96">
            <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
            <input
              type="text"
              placeholder="Search by patient name, phone, area, health concern..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          {/* Export Action */}
          <div className="flex items-center gap-3 w-full md:w-auto justify-end">
            {(currentUser.role === 'owner' || currentUser.role === 'manager') && (
              <button
                onClick={handleExportCsv}
                className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-50 border border-slate-200 rounded-xl shadow-sm transition-all"
              >
                <Download className="w-3.5 h-3.5 text-slate-500" />
                <span>Export CSV ({filteredLeads.length})</span>
              </button>
            )}
          </div>
        </div>

        {/* Granular Dropdown Filters */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2 border-t border-slate-100 text-xs">
          <div>
            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Stage</label>
            <select
              value={filterStage}
              onChange={(e) => setFilterStage(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-lg p-1.5 text-xs text-slate-700 focus:outline-none focus:ring-1 focus:ring-emerald-500"
            >
              <option value="all">All Stages</option>
              <option value="New">New</option>
              <option value="Contacted">Contacted</option>
              <option value="Qualified">Qualified</option>
              <option value="Offer sent">Offer sent</option>
              <option value="Ordered">Ordered</option>
              <option value="Delivered/Visited">Delivered/Visited</option>
              <option value="Reorder due">Reorder due</option>
            </select>
          </div>

          <div>
            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Score</label>
            <select
              value={filterScore}
              onChange={(e) => setFilterScore(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-lg p-1.5 text-xs text-slate-700 focus:outline-none focus:ring-1 focus:ring-emerald-500"
            >
              <option value="all">All Scores</option>
              <option value="Hot">🔥 Hot</option>
              <option value="Warm">☀️ Warm</option>
              <option value="Cold">❄️ Cold</option>
            </select>
          </div>

          <div>
            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Channel Source</label>
            <select
              value={filterSource}
              onChange={(e) => setFilterSource(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-lg p-1.5 text-xs text-slate-700 focus:outline-none focus:ring-1 focus:ring-emerald-500"
            >
              <option value="all">All Sources</option>
              <option value="Meta Instant Form">Meta Instant Form</option>
              <option value="Instagram">Instagram</option>
              <option value="Store Walk-in">Store Walk-in</option>
              <option value="WhatsApp">WhatsApp</option>
              <option value="Website">Website</option>
            </select>
          </div>

          <div>
            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Closer Assigned</label>
            <select
              value={filterOwner}
              onChange={(e) => setFilterOwner(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-lg p-1.5 text-xs text-slate-700 focus:outline-none focus:ring-1 focus:ring-emerald-500"
            >
              <option value="all">All Telecallers</option>
              {profiles
                .filter((p) => p.role === 'closer' || p.role === 'manager')
                .map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
            </select>
          </div>
        </div>
      </div>

      {/* Leads Data Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-50/80 text-slate-500 border-b border-slate-200 font-semibold uppercase tracking-wider text-[10px]">
                <th className="py-3 px-4">Lead Profile</th>
                <th className="py-3 px-4">Phone / Validity</th>
                <th className="py-3 px-4">Concern & Interest</th>
                <th className="py-3 px-4">Score / Stage</th>
                <th className="py-3 px-4">Speed / Calls</th>
                <th className="py-3 px-4">Owner</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredLeads.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-12 text-slate-400">
                    No leads found matching current filters.
                  </td>
                </tr>
              ) : (
                filteredLeads.map((lead) => (
                  <tr
                    key={lead.id}
                    onClick={() => onSelectLead(lead)}
                    className="hover:bg-emerald-50/40 transition-colors cursor-pointer group"
                  >
                    {/* Name & Origin */}
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-2">
                        <div>
                          <div className="font-bold text-slate-900 group-hover:text-emerald-700 flex items-center gap-1.5">
                            {lead.name}
                            {lead.escalated && (
                              <span className="px-1.5 py-0.2 rounded text-[9px] font-extrabold bg-purple-100 text-purple-700 border border-purple-200">
                                ESCALATED
                              </span>
                            )}
                          </div>
                          <div className="text-[11px] text-slate-400 flex items-center gap-1 mt-0.5">
                            <MapPin className="w-3 h-3" />
                            <span>{lead.area || 'Hyderabad'}</span>
                          </div>
                        </div>
                      </div>
                    </td>

                    {/* Phone & Validity */}
                    <td className="py-3.5 px-4 font-mono">
                      <div className="flex items-center gap-1.5">
                        <span className="text-slate-800 font-medium">{lead.phone_clean}</span>
                        {lead.valid ? (
                          <span title="Valid Indian Phone (+91)">
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                          </span>
                        ) : (
                          <span title="Invalid Phone Digits">
                            <XCircle className="w-3.5 h-3.5 text-rose-500" />
                          </span>
                        )}
                      </div>
                      <div className="text-[10px] text-slate-400 font-sans mt-0.5">
                        {lead.source} {lead.coupon_code && `• ${lead.coupon_code}`}
                      </div>
                    </td>

                    {/* Concern */}
                    <td className="py-3.5 px-4 max-w-xs">
                      <p className="text-slate-700 font-medium truncate" title={lead.concern}>
                        {lead.concern}
                      </p>
                      {lead.product_interest && (
                        <span className="text-[10px] text-emerald-700 font-semibold truncate block mt-0.5">
                          ⭐ {lead.product_interest}
                        </span>
                      )}
                    </td>

                    {/* Score & Stage */}
                    <td className="py-3.5 px-4">
                      <div className="flex flex-col gap-1">
                        <div>{getScoreBadge(lead.lead_score)}</div>
                        <span className="text-[11px] font-medium text-slate-600 px-2 py-0.5 rounded bg-slate-100 inline-block w-fit">
                          {lead.stage}
                        </span>
                      </div>
                    </td>

                    {/* Speed & Attempts */}
                    <td className="py-3.5 px-4 text-slate-600">
                      <div className="font-semibold text-slate-800">
                        {lead.response_time_sec ? `${lead.response_time_sec}s response` : 'Pending initial call'}
                      </div>
                      <div className="text-[11px] text-slate-400 mt-0.5">
                        {lead.call_attempts} call attempts {lead.call_outcome ? `• ${lead.call_outcome}` : ''}
                      </div>
                    </td>

                    {/* Owner */}
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-1.5 text-slate-700">
                        <User className="w-3.5 h-3.5 text-slate-400" />
                        <span className="font-medium">{lead.owner_name || 'Unassigned'}</span>
                      </div>
                    </td>

                    {/* Actions */}
                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5" onClick={(e) => e.stopPropagation()}>
                        <button
                          onClick={() => onOpenOrder(lead)}
                          className="px-2.5 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 font-semibold rounded-lg text-xs transition-colors"
                          title="Create Counter Order"
                        >
                          + Order
                        </button>
                        <button
                          onClick={() => onSelectLead(lead)}
                          className="p-1.5 hover:bg-slate-100 text-slate-400 hover:text-slate-700 rounded-lg"
                        >
                          <ChevronRight className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Footer Stats */}
        <div className="bg-slate-50/80 px-4 py-2.5 border-t border-slate-200 text-xs text-slate-500 flex justify-between items-center">
          <span>
            Displaying <strong>{filteredLeads.length}</strong> of <strong>{baseLeads.length}</strong> total leads
          </span>
          <span className="text-[11px]">Click any row for complete omnichannel timeline & Bolna AI audio transcript</span>
        </div>
      </div>
    </div>
  );
};
