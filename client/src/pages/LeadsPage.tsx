import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { api } from '../api/client';
import { Lead, LeadStatus, LeadTemperature } from '../types/crm';
import {
  Users,
  Search,
  Filter,
  Flame,
  Clock,
  Phone,
  MessageSquare,
  FileDown,
  FileUp,
  Plus,
  RefreshCw,
  LayoutGrid,
  List,
  UserCheck,
  CheckSquare,
  Square,
  Trash2,
  ChevronRight,
  Sparkles,
  ArrowUpDown,
  X,
} from 'lucide-react';
import { useOutletContext } from 'react-router-dom';

const ALL_STAGES: LeadStatus[] = [
  'New Enquiry',
  'Contacted',
  'Wellness Assessment Done',
  'Consultation Booked',
  'Trial/Demo Attended',
  'Program Enrolled',
  'Active Member',
  'Renewal Due',
  'Lost',
];

export const LeadsPage: React.FC = () => {
  const { user, isSuperAdmin, isClientAdmin } = useAuth();
  const { onOpenLeadDetail } = useOutletContext<{ onOpenLeadDetail: (id: string) => void }>();

  const [viewMode, setViewMode] = useState<'table' | 'kanban'>('table');
  const [leads, setLeads] = useState<Lead[]>([]);
  const [pagination, setPagination] = useState({ total: 0, page: 1, limit: 50, totalPages: 1 });
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Filters state
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [sourceFilter, setSourceFilter] = useState('all');
  const [goalFilter, setGoalFilter] = useState('all');
  const [tempFilter, setTempFilter] = useState('all');
  const [assignedFilter, setAssignedFilter] = useState('all');

  // Multi-select state
  const [selectedLeadIds, setSelectedLeadIds] = useState<string[]>([]);
  const [showBulkAssignModal, setShowBulkAssignModal] = useState(false);
  const [showBulkStatusModal, setShowBulkStatusModal] = useState(false);
  const [teamMembers, setTeamMembers] = useState<any[]>([]);

  // New Lead Modal state
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newLeadForm, setNewLeadForm] = useState({
    name: '',
    phone: '',
    email: '',
    wellnessGoal: 'Weight Loss',
    city: '',
    budgetRange: '₹10,000 - ₹25,000',
    preferredCallTime: 'Morning (9am-12pm)',
    notes: '',
  });

  const fetchLeads = async () => {
    setIsLoading(true);
    try {
      const res = await api.getLeads({
        search,
        status: statusFilter,
        source: sourceFilter,
        wellnessGoal: goalFilter,
        temperature: tempFilter,
        assignedToId: assignedFilter,
        page: pagination.page,
        limit: 50,
      });
      setLeads(res.leads || []);
      setPagination(res.pagination || { total: 0, page: 1, limit: 50, totalPages: 1 });
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchLeads();
  }, [search, statusFilter, sourceFilter, goalFilter, tempFilter, assignedFilter, pagination.page]);

  useEffect(() => {
    if (isSuperAdmin || isClientAdmin) {
      api.getUsers().then((res) => {
        setTeamMembers(res.users.filter((u: any) => u.role === 'TEAM_MEMBER'));
      }).catch(console.error);
    }
  }, [isSuperAdmin, isClientAdmin]);

  // Bulk Selection Handlers
  const toggleSelectAll = () => {
    if (selectedLeadIds.length === leads.length) {
      setSelectedLeadIds([]);
    } else {
      setSelectedLeadIds(leads.map((l) => l.id));
    }
  };

  const toggleSelectOne = (id: string) => {
    setSelectedLeadIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const handleBulkAssign = async (userId: string) => {
    try {
      await api.bulkAssign(selectedLeadIds, userId);
      setSelectedLeadIds([]);
      setShowBulkAssignModal(false);
      fetchLeads();
    } catch (e) {
      console.error(e);
    }
  };

  const handleBulkStatus = async (status: string) => {
    try {
      await api.bulkStatus(selectedLeadIds, status);
      setSelectedLeadIds([]);
      setShowBulkStatusModal(false);
      fetchLeads();
    } catch (e) {
      console.error(e);
    }
  };

  const handleBulkDelete = async () => {
    if (!confirm(`Are you sure you want to permanently delete ${selectedLeadIds.length} leads?`)) return;
    try {
      await api.bulkDelete(selectedLeadIds);
      setSelectedLeadIds([]);
      fetchLeads();
    } catch (e) {
      console.error(e);
    }
  };

  const handleCreateLead = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.createLead(newLeadForm);
      setShowCreateModal(false);
      setNewLeadForm({
        name: '',
        phone: '',
        email: '',
        wellnessGoal: 'Weight Loss',
        city: '',
        budgetRange: '₹10,000 - ₹25,000',
        preferredCallTime: 'Morning (9am-12pm)',
        notes: '',
      });
      fetchLeads();
    } catch (err: any) {
      alert(err.message || 'Failed to create lead');
    }
  };

  const handleExportCSV = () => {
    window.open('/api/leads/export/csv', '_blank');
  };

  const handleAutoAssign = async () => {
    try {
      const res = await api.autoAssign('round-robin');
      alert(`Auto-assignment completed: ${res.assignedCount} leads assigned across ${res.teamMembersCount} telecallers.`);
      fetchLeads();
    } catch (err: any) {
      alert(err.message || 'Auto-assignment failed');
    }
  };

  return (
    <div className="space-y-4">
      {/* Top Action Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 dark:text-slate-100 tracking-tight font-sans">
            Lead Management & Pipeline
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            {pagination.total} leads total across acquisition channels
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {/* Table / Kanban view toggle */}
          <div className="flex bg-white dark:bg-slate-900 border border-wellness-border dark:border-slate-800 rounded-xl p-1 shadow-sm">
            <button
              onClick={() => setViewMode('table')}
              className={`p-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                viewMode === 'table' ? 'bg-wellness-600 text-white shadow-soft' : 'text-slate-600 dark:text-slate-400'
              }`}
            >
              <List size={14} /> Table
            </button>
            <button
              onClick={() => setViewMode('kanban')}
              className={`p-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                viewMode === 'kanban' ? 'bg-wellness-600 text-white shadow-soft' : 'text-slate-600 dark:text-slate-400'
              }`}
            >
              <LayoutGrid size={14} /> Kanban
            </button>
          </div>

          {/* Export CSV */}
          <button
            onClick={handleExportCSV}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white dark:bg-slate-900 border border-wellness-border dark:border-slate-800 text-slate-700 dark:text-slate-300 font-semibold text-xs hover:bg-slate-50 shadow-sm"
          >
            <FileDown size={14} /> Export CSV
          </button>

          {/* Auto-assign (Admin only) */}
          {(isSuperAdmin || isClientAdmin) && (
            <button
              onClick={handleAutoAssign}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-amber-50 text-amber-900 dark:bg-amber-950/60 dark:text-amber-200 border border-amber-200 dark:border-amber-800/60 font-semibold text-xs hover:bg-amber-100 transition-colors shadow-sm"
              title="Distribute unassigned leads equally via round-robin"
            >
              <Sparkles size={14} className="text-amber-600" /> Auto-Assign
            </button>
          )}

          {/* Add New Lead */}
          <button
            onClick={() => setShowCreateModal(true)}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-wellness-600 hover:bg-wellness-700 text-white font-bold text-xs transition-colors shadow-soft"
          >
            <Plus size={14} /> Add Lead
          </button>
        </div>
      </div>

      {/* Filters Bar */}
      <div className="p-3.5 rounded-2xl bg-white dark:bg-slate-900 border border-wellness-border dark:border-slate-800 shadow-soft flex flex-wrap items-center gap-3">
        {/* Search Input */}
        <div className="relative flex-1 min-w-[200px]">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search by name, phone, city..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 rounded-xl text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-wellness-500 text-slate-900 dark:text-slate-100"
          />
        </div>

        {/* Status Filter */}
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="text-xs px-2.5 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-200 focus:outline-none"
        >
          <option value="all">All Stages</option>
          {ALL_STAGES.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>

        {/* Wellness Goal Filter */}
        <select
          value={goalFilter}
          onChange={(e) => setGoalFilter(e.target.value)}
          className="text-xs px-2.5 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-200 focus:outline-none"
        >
          <option value="all">All Wellness Goals</option>
          <option value="Weight Loss">Weight Loss</option>
          <option value="Diabetes Care">Diabetes Care</option>
          <option value="Stress Relief">Stress Relief</option>
          <option value="Yoga & Flexibility">Yoga & Flexibility</option>
          <option value="PCOS">PCOS</option>
          <option value="Gut Health">Gut Health</option>
        </select>

        {/* Source Filter */}
        <select
          value={sourceFilter}
          onChange={(e) => setSourceFilter(e.target.value)}
          className="text-xs px-2.5 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-200 focus:outline-none"
        >
          <option value="all">All Sources</option>
          <option value="Meta">Meta</option>
          <option value="Google">Google</option>
          <option value="Instagram">Instagram</option>
          <option value="Referral">Referral</option>
          <option value="Website">Website</option>
          <option value="Walk-in">Walk-in</option>
        </select>

        {/* Temperature Filter */}
        <select
          value={tempFilter}
          onChange={(e) => setTempFilter(e.target.value)}
          className="text-xs px-2.5 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-200 focus:outline-none"
        >
          <option value="all">All Temperatures</option>
          <option value="Hot">🔥 Hot</option>
          <option value="Warm">🌤️ Warm</option>
          <option value="Cold">❄️ Cold</option>
        </select>

        {/* Assigned User Filter (Admin only) */}
        {(isSuperAdmin || isClientAdmin) && (
          <select
            value={assignedFilter}
            onChange={(e) => setAssignedFilter(e.target.value)}
            className="text-xs px-2.5 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-200 focus:outline-none"
          >
            <option value="all">All Assignees</option>
            <option value="unassigned">⚠️ Unassigned Pool</option>
            {teamMembers.map((u) => (
              <option key={u.id} value={u.id}>
                {u.name}
              </option>
            ))}
          </select>
        )}

        <button
          onClick={fetchLeads}
          className="p-1.5 rounded-xl text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-slate-100"
          title="Refresh"
        >
          <RefreshCw size={14} />
        </button>
      </div>

      {/* Bulk Action Bar (when rows selected) */}
      {selectedLeadIds.length > 0 && (
        <div className="p-3 rounded-2xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 flex items-center justify-between text-xs animate-in fade-in duration-200">
          <div className="flex items-center gap-2 font-bold text-emerald-900 dark:text-emerald-300">
            <CheckSquare size={16} />
            <span>{selectedLeadIds.length} leads selected</span>
          </div>
          <div className="flex items-center gap-2">
            {(isSuperAdmin || isClientAdmin) && (
              <button
                onClick={() => setShowBulkAssignModal(true)}
                className="px-3 py-1.5 rounded-xl bg-white dark:bg-slate-800 border border-emerald-300 text-emerald-800 dark:text-emerald-300 font-semibold hover:bg-emerald-100"
              >
                Reassign Selected
              </button>
            )}
            <button
              onClick={() => setShowBulkStatusModal(true)}
              className="px-3 py-1.5 rounded-xl bg-white dark:bg-slate-800 border border-emerald-300 text-emerald-800 dark:text-emerald-300 font-semibold hover:bg-emerald-100"
            >
              Update Status
            </button>
            {(isSuperAdmin || isClientAdmin) && (
              <button
                onClick={handleBulkDelete}
                className="px-3 py-1.5 rounded-xl bg-red-100 dark:bg-red-950 text-red-700 dark:text-red-300 font-semibold hover:bg-red-200"
              >
                Delete
              </button>
            )}
            <button
              onClick={() => setSelectedLeadIds([])}
              className="text-slate-500 hover:underline font-semibold ml-2"
            >
              Deselect All
            </button>
          </div>
        </div>
      )}

      {/* VIEW 1: TABLE VIEW */}
      {viewMode === 'table' ? (
        <div className="bg-white dark:bg-slate-900 border border-wellness-border dark:border-slate-800 rounded-2xl shadow-soft overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-wellness-50/70 dark:bg-slate-800/60 text-slate-600 dark:text-slate-300 uppercase tracking-wider font-bold border-b border-wellness-border dark:border-slate-800">
                <tr>
                  <th className="p-3 w-8">
                    <button onClick={toggleSelectAll} className="text-slate-400 hover:text-slate-600">
                      {selectedLeadIds.length === leads.length && leads.length > 0 ? (
                        <CheckSquare size={15} className="text-wellness-600" />
                      ) : (
                        <Square size={15} />
                      )}
                    </button>
                  </th>
                  <th className="p-3">Lead Name & Phone</th>
                  <th className="p-3">Wellness Goal</th>
                  <th className="p-3">Stage</th>
                  <th className="p-3">Heat Score</th>
                  <th className="p-3">Speed-to-Lead</th>
                  <th className="p-3">Source & Campaign</th>
                  <th className="p-3">Assigned To</th>
                  <th className="p-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {leads.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="text-center py-12 text-slate-400">
                      No leads matching current filters.
                    </td>
                  </tr>
                ) : (
                  leads.map((lead) => {
                    const isSelected = selectedLeadIds.includes(lead.id);
                    return (
                      <tr
                        key={lead.id}
                        className={`hover:bg-wellness-50/50 dark:hover:bg-slate-800/40 transition-colors ${
                          isSelected ? 'bg-wellness-50/80 dark:bg-emerald-950/20' : ''
                        }`}
                      >
                        <td className="p-3">
                          <button onClick={() => toggleSelectOne(lead.id)} className="text-slate-400">
                            {isSelected ? (
                              <CheckSquare size={15} className="text-wellness-600" />
                            ) : (
                              <Square size={15} />
                            )}
                          </button>
                        </td>
                        <td className="p-3 cursor-pointer" onClick={() => onOpenLeadDetail(lead.id)}>
                          <div className="font-bold text-slate-900 dark:text-slate-100 text-xs hover:text-wellness-600">
                            {lead.name}
                          </div>
                          <div className="text-[11px] text-slate-400 flex items-center gap-1.5 mt-0.5">
                            <span>{lead.phone}</span>
                            {lead.city && <span>• {lead.city}</span>}
                          </div>
                        </td>
                        <td className="p-3">
                          <span className="font-semibold text-wellness-800 dark:text-emerald-400">
                            {lead.wellnessGoal}
                          </span>
                        </td>
                        <td className="p-3">
                          <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200">
                            {lead.status}
                          </span>
                        </td>
                        <td className="p-3">
                          <div className="flex items-center gap-1 font-bold text-amber-600 dark:text-amber-400">
                            <Flame size={13} className="fill-amber-500" />
                            <span>{lead.heatScore}</span>
                          </div>
                        </td>
                        <td className="p-3">
                          {lead.speedToLead && (
                            <span
                              className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                                lead.speedToLead.status === 'fast'
                                  ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                                  : lead.speedToLead.status === 'warning'
                                  ? 'bg-amber-50 text-amber-800 border-amber-200'
                                  : 'bg-red-50 text-red-800 border-red-200'
                              }`}
                            >
                              {lead.speedToLead.elapsedMinutes}m
                            </span>
                          )}
                        </td>
                        <td className="p-3">
                          <div className="font-medium text-slate-800 dark:text-slate-200">{lead.source}</div>
                          <div className="text-[10px] text-slate-400 truncate max-w-[120px]">
                            {lead.campaign?.name || lead.utmCampaign || 'Organic'}
                          </div>
                        </td>
                        <td className="p-3">
                          {lead.assignedTo ? (
                            <span className="font-medium text-slate-700 dark:text-slate-300">
                              {lead.assignedTo.name}
                            </span>
                          ) : (
                            <span className="text-amber-600 font-semibold">Unassigned</span>
                          )}
                        </td>
                        <td className="p-3 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <a
                              href={`tel:${lead.phone}`}
                              className="p-1.5 rounded-lg bg-wellness-50 hover:bg-wellness-100 text-wellness-600"
                              title="Call"
                            >
                              <Phone size={13} />
                            </a>
                            <button
                              onClick={() => onOpenLeadDetail(lead.id)}
                              className="p-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-300"
                              title="View Profile"
                            >
                              <ChevronRight size={13} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        /* VIEW 2: KANBAN PIPELINE VIEW */
        <div className="flex gap-4 overflow-x-auto pb-4 pt-1">
          {ALL_STAGES.map((stage) => {
            const stageLeads = leads.filter((l) => l.status === stage);
            return (
              <div
                key={stage}
                className="w-72 flex-shrink-0 bg-slate-50 dark:bg-slate-900 border border-wellness-border dark:border-slate-800 rounded-2xl flex flex-col max-h-[75vh]"
              >
                {/* Stage Header */}
                <div className="p-3.5 border-b border-wellness-border dark:border-slate-800 flex items-center justify-between bg-white dark:bg-slate-850 rounded-t-2xl">
                  <span className="font-bold text-xs text-slate-800 dark:text-slate-100 truncate">
                    {stage}
                  </span>
                  <span className="text-xs font-black px-2 py-0.5 rounded-full bg-wellness-100 dark:bg-emerald-950 text-wellness-800 dark:text-emerald-300">
                    {stageLeads.length}
                  </span>
                </div>

                {/* Stage Cards */}
                <div className="p-2 space-y-2.5 overflow-y-auto flex-1">
                  {stageLeads.length === 0 ? (
                    <div className="p-4 text-center text-[11px] text-slate-400 border border-dashed border-slate-200 dark:border-slate-800 rounded-xl">
                      Empty stage
                    </div>
                  ) : (
                    stageLeads.map((lead) => (
                      <div
                        key={lead.id}
                        onClick={() => onOpenLeadDetail(lead.id)}
                        className="p-3 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700/80 shadow-soft hover:shadow-md hover:border-wellness-400 cursor-pointer transition-all space-y-2 group"
                      >
                        <div className="flex items-start justify-between">
                          <h4 className="font-bold text-xs text-slate-900 dark:text-slate-100 group-hover:text-wellness-600 transition-colors">
                            {lead.name}
                          </h4>
                          <span className="flex items-center gap-0.5 text-[10px] font-bold text-amber-600">
                            <Flame size={11} className="fill-amber-500" /> {lead.heatScore}
                          </span>
                        </div>

                        <p className="text-[11px] font-semibold text-wellness-700 dark:text-emerald-400">
                          {lead.wellnessGoal}
                        </p>

                        <div className="flex items-center justify-between text-[10px] text-slate-400 pt-1 border-t border-slate-100 dark:border-slate-700/50">
                          <span>{lead.source}</span>
                          <span>{lead.assignedTo?.name || 'Unassigned'}</span>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* CREATE NEW LEAD MODAL */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-wellness-border dark:border-slate-800 max-w-lg w-full p-6 shadow-2xl animate-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800 mb-4">
              <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">Add New Wellness Lead</h3>
              <button onClick={() => setShowCreateModal(false)} className="text-slate-400 hover:text-slate-600">
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleCreateLead} className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Full Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Radhika Sharma"
                  value={newLeadForm.name}
                  onChange={(e) => setNewLeadForm({ ...newLeadForm, name: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-wellness-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Mobile (+91) *</label>
                  <input
                    type="tel"
                    required
                    placeholder="9820011223"
                    value={newLeadForm.phone}
                    onChange={(e) => setNewLeadForm({ ...newLeadForm, phone: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-wellness-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">City</label>
                  <input
                    type="text"
                    placeholder="Mumbai"
                    value={newLeadForm.city}
                    onChange={(e) => setNewLeadForm({ ...newLeadForm, city: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-wellness-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Wellness Goal</label>
                  <select
                    value={newLeadForm.wellnessGoal}
                    onChange={(e) => setNewLeadForm({ ...newLeadForm, wellnessGoal: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
                  >
                    <option value="Weight Loss">Weight Loss</option>
                    <option value="Diabetes Care">Diabetes Care</option>
                    <option value="Stress Relief">Stress Relief</option>
                    <option value="Yoga & Flexibility">Yoga & Flexibility</option>
                    <option value="PCOS">PCOS</option>
                    <option value="Gut Health">Gut Health</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Budget Readiness</label>
                  <select
                    value={newLeadForm.budgetRange}
                    onChange={(e) => setNewLeadForm({ ...newLeadForm, budgetRange: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
                  >
                    <option value="₹5,000 - ₹10,000">₹5,000 - ₹10,000</option>
                    <option value="₹10,000 - ₹25,000">₹10,000 - ₹25,000</option>
                    <option value="₹25,000+">₹25,000+</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Initial Notes</label>
                <textarea
                  rows={2}
                  placeholder="Any known health complaints or preferred call time..."
                  value={newLeadForm.notes}
                  onChange={(e) => setNewLeadForm({ ...newLeadForm, notes: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-wellness-500"
                ></textarea>
              </div>

              <div className="flex justify-end gap-2 pt-3">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl text-xs font-bold text-white bg-wellness-600 hover:bg-wellness-700 shadow-soft"
                >
                  Create Lead
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* BULK REASSIGN MODAL */}
      {showBulkAssignModal && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-sm w-full p-5 border border-slate-200 dark:border-slate-800 shadow-xl">
            <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 mb-2">
              Reassign {selectedLeadIds.length} Leads
            </h3>
            <p className="text-xs text-slate-500 mb-4">Select team member to assign these leads to:</p>
            <div className="space-y-1.5 max-h-60 overflow-y-auto mb-4">
              <button
                onClick={() => handleBulkAssign('unassigned')}
                className="w-full text-left px-3 py-2 rounded-xl text-xs font-bold text-amber-700 bg-amber-50 hover:bg-amber-100"
              >
                Mark as Unassigned
              </button>
              {teamMembers.map((u) => (
                <button
                  key={u.id}
                  onClick={() => handleBulkAssign(u.id)}
                  className="w-full text-left px-3 py-2 rounded-xl text-xs font-medium text-slate-800 dark:text-slate-200 hover:bg-wellness-50 dark:hover:bg-slate-800 flex items-center justify-between"
                >
                  <span>{u.name}</span>
                  <span className="text-[10px] text-slate-400">{u._count?.leads || 0} leads</span>
                </button>
              ))}
            </div>
            <div className="flex justify-end">
              <button
                onClick={() => setShowBulkAssignModal(false)}
                className="px-3 py-1.5 rounded-xl text-xs font-bold text-slate-500 hover:bg-slate-100"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* BULK STATUS MODAL */}
      {showBulkStatusModal && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-sm w-full p-5 border border-slate-200 dark:border-slate-800 shadow-xl">
            <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 mb-2">
              Update Stage for {selectedLeadIds.length} Leads
            </h3>
            <div className="space-y-1.5 max-h-60 overflow-y-auto mb-4">
              {ALL_STAGES.map((s) => (
                <button
                  key={s}
                  onClick={() => handleBulkStatus(s)}
                  className="w-full text-left px-3 py-2 rounded-xl text-xs font-semibold text-slate-800 dark:text-slate-200 hover:bg-wellness-50 dark:hover:bg-slate-800"
                >
                  {s}
                </button>
              ))}
            </div>
            <div className="flex justify-end">
              <button
                onClick={() => setShowBulkStatusModal(false)}
                className="px-3 py-1.5 rounded-xl text-xs font-bold text-slate-500 hover:bg-slate-100"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
