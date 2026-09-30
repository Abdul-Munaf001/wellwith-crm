'use client';

import React, { useState } from 'react';
import { useCrm } from '@/context/CrmContext';
import { Lead, Order } from '@/types/crm';
import {
  Clock,
  AlertTriangle,
  RotateCw,
  PhoneCall,
  MessageSquare,
  ShoppingCart,
  Calendar,
  User,
  CheckCircle2,
  Sparkles,
} from 'lucide-react';
import { formatTimeAgo, formatINR } from '@/lib/utils';

interface FollowUpsViewProps {
  onSelectLead: (lead: Lead) => void;
  onOpenOrder: (lead: Lead) => void;
}

export const FollowUpsView: React.FC<FollowUpsViewProps> = ({ onSelectLead, onOpenOrder }) => {
  const { leads, orders, sendWhatsAppMessage, logManualCall, currentUser } = useCrm();

  const [activeTab, setActiveTab] = useState<'due-today' | 'overdue' | 'reorders'>('due-today');

  const now = Date.now();
  const todayStr = new Date().toISOString().split('T')[0];
  const next7DaysStr = new Date(now + 7 * 24 * 3600 * 1000).toISOString().split('T')[0];

  // 1. Follow-ups Due Today
  const dueTodayLeads = leads.filter((l) => {
    if (!l.next_followup_at) return false;
    return l.next_followup_at.split('T')[0] === todayStr;
  });

  // 2. Overdue Follow-ups
  const overdueLeads = leads.filter((l) => {
    if (!l.next_followup_at) return false;
    return new Date(l.next_followup_at).getTime() < now && l.next_followup_at.split('T')[0] !== todayStr;
  });

  // 3. Reorders Due in Next 7 Days (from orders table: Day 25 replenishment)
  const reordersDue = orders.filter((o) => {
    if (!o.reorder_due_date) return false;
    return o.reorder_due_date >= todayStr && o.reorder_due_date <= next7DaysStr;
  });

  const totalReorderValue = reordersDue.reduce((sum, o) => sum + Number(o.amount), 0);

  const handleSendReorderWhatsApp = (order: Order) => {
    const lead = leads.find((l) => l.id === order.lead_id);
    if (!lead) return;
    const msg = `Namaste ${lead.name} ji! 🌿 Your 25-day supply of ${order.product} is running low. Tap here to renew your refill with priority dispatch & 10% loyalty discount: rzp.io/l/wellwith-refill`;
    sendWhatsAppMessage(lead.id, msg, 'reorder_day_25_nudge');
    alert(`Reorder reminder sent via WhatsApp to ${lead.name}!`);
  };

  return (
    <div className="space-y-6">
      {/* Top Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Due Today */}
        <div
          onClick={() => setActiveTab('due-today')}
          className={`bg-white p-5 rounded-2xl border cursor-pointer transition-all ${
            activeTab === 'due-today'
              ? 'border-emerald-500 ring-2 ring-emerald-100 shadow-md'
              : 'border-slate-200 hover:border-emerald-200'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Scheduled Today</span>
            <div className="p-2 rounded-xl bg-emerald-50 text-emerald-700">
              <Calendar className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 text-2xl font-black text-slate-900">{dueTodayLeads.length} Leads</div>
          <p className="text-[11px] text-slate-400 mt-0.5">High priority consultation follow-ups</p>
        </div>

        {/* Overdue */}
        <div
          onClick={() => setActiveTab('overdue')}
          className={`bg-white p-5 rounded-2xl border cursor-pointer transition-all ${
            activeTab === 'overdue'
              ? 'border-rose-500 ring-2 ring-rose-100 shadow-md'
              : 'border-slate-200 hover:border-rose-200'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Overdue SLAs</span>
            <div className="p-2 rounded-xl bg-rose-50 text-rose-600">
              <AlertTriangle className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 text-2xl font-black text-rose-600">{overdueLeads.length} Overdue</div>
          <p className="text-[11px] text-slate-400 mt-0.5">Exceeded SLA response deadline</p>
        </div>

        {/* Reorders Due */}
        <div
          onClick={() => setActiveTab('reorders')}
          className={`bg-white p-5 rounded-2xl border cursor-pointer transition-all ${
            activeTab === 'reorders'
              ? 'border-teal-500 ring-2 ring-teal-100 shadow-md'
              : 'border-slate-200 hover:border-teal-200'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Reorders (7 Days)</span>
            <div className="p-2 rounded-xl bg-teal-50 text-teal-700">
              <RotateCw className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 text-2xl font-black text-teal-800">{reordersDue.length} Due</div>
          <p className="text-[11px] text-teal-600 mt-0.5 font-semibold">
            Pipeline Potential: {formatINR(totalReorderValue)}
          </p>
        </div>
      </div>

      {/* Main Tabs Navigation */}
      <div className="flex border-b border-slate-200 gap-6 text-xs font-bold">
        <button
          onClick={() => setActiveTab('due-today')}
          className={`pb-3 border-b-2 flex items-center gap-2 ${
            activeTab === 'due-today'
              ? 'border-emerald-600 text-emerald-800'
              : 'border-transparent text-slate-400 hover:text-slate-700'
          }`}
        >
          <span>Due Today ({dueTodayLeads.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('overdue')}
          className={`pb-3 border-b-2 flex items-center gap-2 ${
            activeTab === 'overdue'
              ? 'border-rose-600 text-rose-700'
              : 'border-transparent text-slate-400 hover:text-slate-700'
          }`}
        >
          <span>Overdue ({overdueLeads.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('reorders')}
          className={`pb-3 border-b-2 flex items-center gap-2 ${
            activeTab === 'reorders'
              ? 'border-teal-600 text-teal-800'
              : 'border-transparent text-slate-400 hover:text-slate-700'
          }`}
        >
          <RotateCw className="w-3.5 h-3.5" />
          <span>Day-25 Reorders Pipeline ({reordersDue.length})</span>
        </button>
      </div>

      {/* Tab Content */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        {activeTab === 'reorders' ? (
          /* Reorders View */
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 font-bold uppercase tracking-wider text-[10px] border-b border-slate-200">
                <tr>
                  <th className="py-3 px-4">Customer & Phone</th>
                  <th className="py-3 px-4">Product Purchased</th>
                  <th className="py-3 px-4">Original Order Date</th>
                  <th className="py-3 px-4">Day-25 Reorder Due Date</th>
                  <th className="py-3 px-4">Amount</th>
                  <th className="py-3 px-4 text-right">Quick Refill Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {reordersDue.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="text-center py-12 text-slate-400">
                      No reorders due in the next 7 days.
                    </td>
                  </tr>
                ) : (
                  reordersDue.map((ord) => {
                    const parentLead = leads.find((l) => l.id === ord.lead_id);
                    const daysRemaining = Math.ceil(
                      (new Date(ord.reorder_due_date).getTime() - Date.now()) / (1000 * 3600 * 24)
                    );

                    return (
                      <tr key={ord.id} className="hover:bg-teal-50/40 transition-colors">
                        <td className="py-3 px-4">
                          <div className="font-bold text-slate-900">{ord.lead_name || 'Valued Customer'}</div>
                          <div className="text-[11px] font-mono text-slate-500">{ord.lead_phone}</div>
                        </td>
                        <td className="py-3 px-4">
                          <div className="font-semibold text-slate-800">{ord.product}</div>
                          <div className="text-[10px] text-slate-400">Pack: {ord.pack}</div>
                        </td>
                        <td className="py-3 px-4 text-slate-600">{ord.order_date}</td>
                        <td className="py-3 px-4">
                          <span
                            className={`font-mono font-bold px-2 py-0.5 rounded text-[11px] ${
                              daysRemaining <= 0
                                ? 'bg-rose-100 text-rose-800'
                                : 'bg-teal-100 text-teal-800'
                            }`}
                          >
                            {ord.reorder_due_date}{' '}
                            {daysRemaining <= 0 ? '(Due Today!)' : `(in ${daysRemaining} days)`}
                          </span>
                        </td>
                        <td className="py-3 px-4 font-black text-slate-900">{formatINR(ord.amount)}</td>
                        <td className="py-3 px-4 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() => handleSendReorderWhatsApp(ord)}
                              className="px-2.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold shadow-sm transition-all flex items-center gap-1"
                            >
                              <MessageSquare className="w-3.5 h-3.5" />
                              <span>Send WhatsApp Refill</span>
                            </button>
                            {parentLead && (
                              <button
                                onClick={() => onOpenOrder(parentLead)}
                                className="px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-bold"
                              >
                                POS Refill
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        ) : (
          /* Due Today or Overdue Leads View */
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 font-bold uppercase tracking-wider text-[10px] border-b border-slate-200">
                <tr>
                  <th className="py-3 px-4">Lead Profile</th>
                  <th className="py-3 px-4">Phone / Area</th>
                  <th className="py-3 px-4">Concern</th>
                  <th className="py-3 px-4">Scheduled Deadline</th>
                  <th className="py-3 px-4">Assigned Closer</th>
                  <th className="py-3 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {(activeTab === 'due-today' ? dueTodayLeads : overdueLeads).length === 0 ? (
                  <tr>
                    <td colSpan={6} className="text-center py-12 text-slate-400">
                      No follow-ups in this queue right now.
                    </td>
                  </tr>
                ) : (
                  (activeTab === 'due-today' ? dueTodayLeads : overdueLeads).map((lead) => (
                    <tr
                      key={lead.id}
                      onClick={() => onSelectLead(lead)}
                      className="hover:bg-emerald-50/40 transition-colors cursor-pointer"
                    >
                      <td className="py-3.5 px-4 font-bold text-slate-900">{lead.name}</td>
                      <td className="py-3.5 px-4 font-mono text-slate-600">{lead.phone_clean}</td>
                      <td className="py-3.5 px-4 text-slate-700 max-w-xs truncate">{lead.concern}</td>
                      <td className="py-3.5 px-4">
                        <span
                          className={`font-mono font-bold px-2 py-0.5 rounded text-[11px] ${
                            activeTab === 'overdue' ? 'bg-rose-100 text-rose-800' : 'bg-amber-100 text-amber-800'
                          }`}
                        >
                          {lead.next_followup_at
                            ? new Date(lead.next_followup_at).toLocaleTimeString([], {
                                hour: '2-digit',
                                minute: '2-digit',
                              })
                            : 'Immediate'}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-slate-600 font-medium">{lead.owner_name || 'Unassigned'}</td>
                      <td className="py-3.5 px-4 text-right" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => {
                              logManualCall(lead.id, 'Follow-up Call Completed');
                              alert(`Follow-up call logged for ${lead.name}`);
                            }}
                            className="p-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg"
                            title="Log Follow-up Call"
                          >
                            <PhoneCall className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => onOpenOrder(lead)}
                            className="p-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 rounded-lg"
                            title="Create Order"
                          >
                            <ShoppingCart className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
