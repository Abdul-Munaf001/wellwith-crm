'use client';

import React, { useState } from 'react';
import { useCrm } from '@/context/CrmContext';
import { Lead, LeadScore, LeadStage } from '@/types/crm';
import {
  X,
  PhoneCall,
  MessageSquare,
  ShoppingCart,
  ShieldAlert,
  Clock,
  Sparkles,
  User,
  CheckCircle2,
  Calendar,
  AlertTriangle,
  Play,
  Pause,
  Send,
  FileText,
  UserCheck,
  Tag,
} from 'lucide-react';
import { formatTimeAgo, formatINR } from '@/lib/utils';

interface LeadDetailModalProps {
  lead: Lead | null;
  onClose: () => void;
  onOpenOrder: (lead: Lead) => void;
}

export const LeadDetailModal: React.FC<LeadDetailModalProps> = ({ lead, onClose, onOpenOrder }) => {
  const {
    updateLeadStage,
    updateLeadScore,
    toggleDnd,
    clearEscalation,
    assignLead,
    addLeadNote,
    sendWhatsAppMessage,
    logManualCall,
    simulateBolnaCallCompletion,
    simulateWhatsAppReply,
    callLogs,
    messages,
    activities,
    orders,
    profiles,
    currentUser,
  } = useCrm();

  const [activeTab, setActiveTab] = useState<'timeline' | 'call-center' | 'whatsapp' | 'orders'>('timeline');
  const [noteInput, setNoteInput] = useState('');
  const [waInput, setWaInput] = useState('');
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);

  if (!lead) return null;

  // Filter items specific to this lead
  const leadActivities = activities.filter((a) => a.lead_id === lead.id);
  const leadCalls = callLogs.filter((c) => c.lead_id === lead.id);
  const leadMessages = messages.filter((m) => m.lead_id === lead.id);
  const leadOrders = orders.filter((o) => o.lead_id === lead.id);

  const handleAddNote = () => {
    if (!noteInput.trim()) return;
    addLeadNote(lead.id, noteInput.trim());
    setNoteInput('');
  };

  const handleSendWhatsApp = (content: string, template?: string) => {
    if (!content.trim()) return;
    sendWhatsAppMessage(lead.id, content, template);
    setWaInput('');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="bg-white rounded-3xl w-full max-w-5xl shadow-2xl border border-emerald-100 overflow-hidden my-auto max-h-[90vh] flex flex-col animate-in fade-in zoom-in-95 duration-150">
        {/* Top Header */}
        <div className="bg-gradient-to-r from-emerald-800 to-teal-800 text-white p-6 relative">
          <button
            onClick={onClose}
            className="absolute top-5 right-5 p-1.5 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="text-xs uppercase tracking-wider font-bold bg-white/15 px-2.5 py-0.5 rounded-full text-emerald-200">
                  {lead.source}
                </span>
                {lead.coupon_code && (
                  <span className="text-xs font-mono font-bold bg-emerald-950/50 text-emerald-300 px-2 py-0.5 rounded-full border border-emerald-500/30">
                    Coupon: {lead.coupon_code}
                  </span>
                )}
                {lead.is_test && (
                  <span className="text-xs font-bold bg-amber-500 text-black px-2 py-0.5 rounded-full">
                    TEST LEAD
                  </span>
                )}
              </div>
              <h2 className="text-2xl font-black tracking-tight">{lead.name}</h2>
              <div className="flex items-center gap-3 text-xs text-emerald-100 mt-1 font-mono">
                <span>{lead.phone_clean}</span>
                <span>•</span>
                <span>{lead.area || 'Hyderabad'}</span>
                <span>•</span>
                <span className="font-sans">Created {formatTimeAgo(lead.created_at)}</span>
              </div>
            </div>

            {/* Quick Action Buttons */}
            <div className="flex items-center gap-2">
              <button
                onClick={() => {
                  logManualCall(lead.id, 'Answered - Direct Store Staff Consultation');
                  setActiveTab('call-center');
                }}
                className="flex items-center gap-1.5 px-3.5 py-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 rounded-xl text-xs font-bold shadow-md transition-all"
              >
                <PhoneCall className="w-4 h-4" />
                <span>Call Now</span>
              </button>

              <button
                onClick={() => setActiveTab('whatsapp')}
                className="flex items-center gap-1.5 px-3.5 py-2 bg-white/15 hover:bg-white/25 text-white rounded-xl text-xs font-bold transition-all"
              >
                <MessageSquare className="w-4 h-4" />
                <span>WhatsApp</span>
              </button>

              <button
                onClick={() => {
                  onClose();
                  onOpenOrder(lead);
                }}
                className="flex items-center gap-1.5 px-3.5 py-2 bg-amber-400 hover:bg-amber-300 text-slate-950 rounded-xl text-xs font-bold shadow-md transition-all"
              >
                <ShoppingCart className="w-4 h-4" />
                <span>POS Order</span>
              </button>
            </div>
          </div>
        </div>

        {/* Safety & Escalation Banner (Step 7 Compliance) */}
        {lead.escalated && (
          <div className="bg-purple-50 border-b border-purple-200 px-6 py-3 flex items-center justify-between text-xs text-purple-900">
            <div className="flex items-center gap-2.5">
              <ShieldAlert className="w-5 h-5 text-purple-600 shrink-0" />
              <div>
                <span className="font-bold">MEDICAL SAFETY ESCALATION:</span>{' '}
                {lead.escalation_reason ||
                  'Patient mentioned pregnancy / medications during AI intake call. AI calling is locked.'}
              </div>
            </div>
            <button
              onClick={() => clearEscalation(lead.id)}
              className="px-3 py-1 bg-purple-600 hover:bg-purple-700 text-white rounded-lg text-xs font-bold transition-colors"
            >
              Doctor Cleared (Unlock)
            </button>
          </div>
        )}

        {/* DND Notice */}
        {lead.dnd && (
          <div className="bg-rose-50 border-b border-rose-200 px-6 py-2.5 flex items-center justify-between text-xs text-rose-900">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-rose-600" />
              <span className="font-bold">DND ACTIVE: Customer replied STOP. Automated marketing blocked.</span>
            </div>
            <button
              onClick={() => toggleDnd(lead.id)}
              className="text-rose-700 font-semibold underline hover:text-rose-900"
            >
              Toggle Off DND
            </button>
          </div>
        )}

        {/* Main Body: Sidebar + Tabs */}
        <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
          {/* Left Metadata Panel */}
          <div className="w-full md:w-80 bg-slate-50/80 border-r border-slate-200 p-5 space-y-4 overflow-y-auto text-xs">
            {/* Stage Selector */}
            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                Pipeline Stage
              </label>
              <select
                value={lead.stage}
                onChange={(e) => updateLeadStage(lead.id, e.target.value as LeadStage)}
                className="w-full bg-white border border-slate-200 rounded-xl p-2 font-bold text-slate-800 focus:ring-2 focus:ring-emerald-500"
              >
                <option value="New">New Inbound</option>
                <option value="Contacted">Contacted</option>
                <option value="Qualified">Qualified</option>
                <option value="Offer sent">Offer sent</option>
                <option value="Ordered">Ordered</option>
                <option value="Delivered/Visited">Delivered / Visited</option>
                <option value="Reorder due">Reorder due (Day 25)</option>
              </select>
            </div>

            {/* Score Selector */}
            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                Lead Intent Score
              </label>
              <div className="grid grid-cols-3 gap-1.5">
                {(['Hot', 'Warm', 'Cold'] as LeadScore[]).map((score) => (
                  <button
                    key={score}
                    onClick={() => updateLeadScore(lead.id, score)}
                    className={`py-1.5 rounded-lg font-bold text-center text-xs transition-all ${
                      lead.lead_score === score
                        ? score === 'Hot'
                          ? 'bg-rose-600 text-white shadow-sm'
                          : score === 'Warm'
                          ? 'bg-amber-500 text-white shadow-sm'
                          : 'bg-blue-600 text-white shadow-sm'
                        : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    {score === 'Hot' ? '🔥 Hot' : score === 'Warm' ? '☀️ Warm' : '❄️ Cold'}
                  </button>
                ))}
              </div>
            </div>

            {/* Assigned Closer */}
            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                Assigned Telecaller / Closer
              </label>
              <select
                value={lead.owner_id || ''}
                onChange={(e) => assignLead(lead.id, e.target.value)}
                className="w-full bg-white border border-slate-200 rounded-xl p-2 text-slate-700 focus:ring-2 focus:ring-emerald-500 font-medium"
              >
                <option value="">Unassigned</option>
                {profiles
                  .filter((p) => p.role === 'closer' || p.role === 'manager')
                  .map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name} ({p.role})
                    </option>
                  ))}
              </select>
            </div>

            {/* Reported Concern & Product */}
            <div className="bg-white p-3 rounded-xl border border-slate-200">
              <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                Reported Health Concern
              </div>
              <p className="font-semibold text-slate-800 leading-snug">{lead.concern}</p>

              {lead.product_interest && (
                <div className="mt-2 pt-2 border-t border-slate-100 text-[11px] text-emerald-800 font-semibold flex items-center gap-1">
                  <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
                  <span>{lead.product_interest}</span>
                </div>
              )}
            </div>

            {/* Compliance & Controls */}
            <div className="bg-white p-3 rounded-xl border border-slate-200 space-y-2">
              <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                Compliance Controls
              </div>
              <div className="flex items-center justify-between text-[11px]">
                <span className="text-slate-600">Opt-in Consent:</span>
                <span className="font-bold text-emerald-700">{lead.opt_in ? 'Verified ✓' : 'Revoked'}</span>
              </div>
              <div className="flex items-center justify-between text-[11px]">
                <span className="text-slate-600">Do Not Disturb (DND):</span>
                <button
                  onClick={() => toggleDnd(lead.id)}
                  className={`px-2 py-0.5 rounded font-bold text-[10px] ${
                    lead.dnd ? 'bg-rose-100 text-rose-800' : 'bg-slate-100 text-slate-700'
                  }`}
                >
                  {lead.dnd ? 'ACTIVE (Blocked)' : 'Inactive'}
                </button>
              </div>
            </div>

            {/* Quick Internal Note */}
            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                Add Clinic Note
              </label>
              <div className="space-y-1.5">
                <textarea
                  value={noteInput}
                  onChange={(e) => setNoteInput(e.target.value)}
                  placeholder="Record customer preferences, medical history..."
                  rows={2}
                  className="w-full bg-white border border-slate-200 rounded-xl p-2 text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
                <button
                  onClick={handleAddNote}
                  className="w-full py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg text-xs transition-colors"
                >
                  Save Note
                </button>
              </div>
              {lead.notes && (
                <div className="mt-2 p-2 bg-amber-50/70 border border-amber-200 rounded-lg text-[11px] text-amber-900 whitespace-pre-wrap">
                  {lead.notes}
                </div>
              )}
            </div>
          </div>

          {/* Right Tabbed Content Area */}
          <div className="flex-1 flex flex-col overflow-hidden bg-white">
            {/* Tabs Header */}
            <div className="flex border-b border-slate-200 px-6 gap-6 text-xs font-semibold">
              <button
                onClick={() => setActiveTab('timeline')}
                className={`py-3.5 border-b-2 flex items-center gap-1.5 transition-colors ${
                  activeTab === 'timeline'
                    ? 'border-emerald-600 text-emerald-800 font-bold'
                    : 'border-transparent text-slate-500 hover:text-slate-800'
                }`}
              >
                <Clock className="w-4 h-4" />
                <span>Audit Timeline ({leadActivities.length})</span>
              </button>

              <button
                onClick={() => setActiveTab('call-center')}
                className={`py-3.5 border-b-2 flex items-center gap-1.5 transition-colors ${
                  activeTab === 'call-center'
                    ? 'border-emerald-600 text-emerald-800 font-bold'
                    : 'border-transparent text-slate-500 hover:text-slate-800'
                }`}
              >
                <PhoneCall className="w-4 h-4" />
                <span>Bolna AI Calls ({leadCalls.length})</span>
              </button>

              <button
                onClick={() => setActiveTab('whatsapp')}
                className={`py-3.5 border-b-2 flex items-center gap-1.5 transition-colors ${
                  activeTab === 'whatsapp'
                    ? 'border-emerald-600 text-emerald-800 font-bold'
                    : 'border-transparent text-slate-500 hover:text-slate-800'
                }`}
              >
                <MessageSquare className="w-4 h-4" />
                <span>WhatsApp Messages ({leadMessages.length})</span>
              </button>

              <button
                onClick={() => setActiveTab('orders')}
                className={`py-3.5 border-b-2 flex items-center gap-1.5 transition-colors ${
                  activeTab === 'orders'
                    ? 'border-emerald-600 text-emerald-800 font-bold'
                    : 'border-transparent text-slate-500 hover:text-slate-800'
                }`}
              >
                <ShoppingCart className="w-4 h-4" />
                <span>Order History ({leadOrders.length})</span>
              </button>
            </div>

            {/* Tab 1: Timeline */}
            {activeTab === 'timeline' && (
              <div className="flex-1 p-6 overflow-y-auto space-y-4">
                <div className="relative pl-6 space-y-5 before:absolute before:left-2 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200">
                  {leadActivities.length === 0 ? (
                    <div className="text-xs text-slate-400 py-6">No activity records logged yet.</div>
                  ) : (
                    leadActivities.map((act) => (
                      <div key={act.id} className="relative group">
                        <div className="absolute -left-6 top-1 w-3.5 h-3.5 rounded-full bg-emerald-500 ring-4 ring-emerald-50 border border-white" />
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-bold text-slate-800">{act.user_name || 'System'}</span>
                            <span className="text-[10px] font-semibold uppercase px-1.5 py-0.2 rounded bg-slate-100 text-slate-600">
                              {act.type}
                            </span>
                            <span className="text-[10px] text-slate-400">{formatTimeAgo(act.created_at)}</span>
                          </div>
                          <p className="text-xs text-slate-600 mt-1 font-medium bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                            {act.detail}
                          </p>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}

            {/* Tab 2: Bolna AI Call Center */}
            {activeTab === 'call-center' && (
              <div className="flex-1 p-6 overflow-y-auto space-y-5">
                <div className="flex items-center justify-between bg-emerald-50 p-4 rounded-2xl border border-emerald-200">
                  <div>
                    <h4 className="text-xs font-bold text-emerald-950">Bolna AI Agent Integration</h4>
                    <p className="text-[11px] text-emerald-800 mt-0.5">
                      Automated voice calls qualify inbound leads within 60-90s with human speech synthesis.
                    </p>
                  </div>
                  <button
                    onClick={() => simulateBolnaCallCompletion(lead.id)}
                    className="px-3 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs font-bold shadow-sm transition-all"
                  >
                    Simulate AI Call
                  </button>
                </div>

                {leadCalls.length === 0 ? (
                  <div className="text-center py-12 text-slate-400 text-xs">
                    No voice calls logged yet. Click "Simulate AI Call" above to test the Bolna webhook.
                  </div>
                ) : (
                  leadCalls.map((call) => (
                    <div key={call.id} className="bg-slate-50 rounded-2xl p-4 border border-slate-200 space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping" />
                          <span className="text-xs font-bold text-slate-800">
                            Attempt #{call.attempt_no} • {call.outcome}
                          </span>
                        </div>
                        <span className="text-[11px] font-mono text-slate-400">
                          {call.duration_sec}s duration • {formatTimeAgo(call.called_at)}
                        </span>
                      </div>

                      {/* Audio Player Simulator */}
                      <div className="bg-white p-3 rounded-xl border border-slate-200 flex items-center gap-3">
                        <button
                          onClick={() => setIsPlayingAudio(!isPlayingAudio)}
                          className="w-8 h-8 rounded-full bg-emerald-600 hover:bg-emerald-700 text-white flex items-center justify-center shrink-0 transition-colors"
                        >
                          {isPlayingAudio ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 ml-0.5" />}
                        </button>
                        <div className="flex-1 space-y-1">
                          <div className="flex justify-between text-[10px] text-slate-400 font-mono">
                            <span>{isPlayingAudio ? '00:24' : '00:00'}</span>
                            <span>01:18</span>
                          </div>
                          {/* Audio Waveform simulation */}
                          <div className="h-4 flex items-center gap-0.5">
                            {[40, 60, 20, 90, 80, 50, 70, 30, 95, 60, 45, 80, 65, 30, 55, 75, 90, 40, 85].map(
                              (height, idx) => (
                                <div
                                  key={idx}
                                  className={`w-1.5 rounded-full transition-all ${
                                    isPlayingAudio && idx < 6 ? 'bg-emerald-600' : 'bg-slate-200'
                                  }`}
                                  style={{ height: `${height}%` }}
                                />
                              )
                            )}
                          </div>
                        </div>
                        <span className="text-[10px] font-bold text-slate-500 uppercase bg-slate-100 px-2 py-1 rounded">
                          Bolna MP3
                        </span>
                      </div>

                      {/* Synchronized Call Transcript */}
                      {call.transcript_text && (
                        <div className="bg-white p-3 rounded-xl border border-slate-200 text-xs">
                          <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">
                            AI Call Transcript
                          </div>
                          <div className="space-y-2 whitespace-pre-wrap font-sans text-slate-700 leading-relaxed text-[11px]">
                            {call.transcript_text}
                          </div>
                        </div>
                      )}
                    </div>
                  ))
                )}
              </div>
            )}

            {/* Tab 3: WhatsApp Chat */}
            {activeTab === 'whatsapp' && (
              <div className="flex-1 flex flex-col overflow-hidden bg-slate-50/50">
                {/* Chat Message Stream */}
                <div className="flex-1 p-5 overflow-y-auto space-y-3">
                  {leadMessages.map((msg) => (
                    <div
                      key={msg.id}
                      className={`flex flex-col max-w-md ${
                        msg.direction === 'outbound' ? 'ml-auto items-end' : 'mr-auto items-start'
                      }`}
                    >
                      <div
                        className={`rounded-2xl p-3 text-xs leading-relaxed shadow-sm ${
                          msg.direction === 'outbound'
                            ? 'bg-emerald-600 text-white rounded-br-none'
                            : 'bg-white text-slate-800 rounded-bl-none border border-slate-200'
                        }`}
                      >
                        {msg.content}
                      </div>
                      <div className="flex items-center gap-1 text-[10px] text-slate-400 mt-1 px-1">
                        <span>{formatTimeAgo(msg.sent_at)}</span>
                        {msg.direction === 'outbound' && (
                          <span className="text-emerald-600 font-bold" title={msg.status}>
                            ✓✓
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>

                {/* Quick Templates & Chat Input */}
                <div className="bg-white border-t border-slate-200 p-3 space-y-2">
                  <div className="flex gap-1.5 overflow-x-auto pb-1 text-[10px] font-bold">
                    <button
                      onClick={() =>
                        handleSendWhatsApp(
                          `Namaste ${lead.name} ji! 🌿 Here is your Sleep Protocol: 1 gummy 30 mins before sleep with warm milk. Apply code ${lead.coupon_code || 'WELL10'} for 10% off: wellwith.in`,
                          'sleep_protocol'
                        )
                      }
                      className="px-2.5 py-1 bg-emerald-50 text-emerald-800 rounded-lg hover:bg-emerald-100 whitespace-nowrap border border-emerald-200"
                    >
                      📄 Send Protocol Template
                    </button>
                    <button
                      onClick={() =>
                        handleSendWhatsApp(
                          `Exclusive Offer: Order the 2-pack bundle today and save ₹500 + free store delivery. Link: rzp.io/l/wellwith-order`,
                          'discount_nudge'
                        )
                      }
                      className="px-2.5 py-1 bg-amber-50 text-amber-800 rounded-lg hover:bg-amber-100 whitespace-nowrap border border-amber-200"
                    >
                      🎁 Send Razorpay Link
                    </button>
                    <button
                      onClick={() => simulateWhatsAppReply(lead.id, 'STOP')}
                      className="px-2.5 py-1 bg-rose-50 text-rose-700 rounded-lg hover:bg-rose-100 whitespace-nowrap border border-rose-200"
                    >
                      Simulate "STOP" (DND Test)
                    </button>
                  </div>

                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      placeholder={lead.dnd ? 'Customer has DND enabled...' : 'Type custom WhatsApp message...'}
                      disabled={lead.dnd}
                      value={waInput}
                      onChange={(e) => setWaInput(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && handleSendWhatsApp(waInput)}
                      className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-none disabled:opacity-50"
                    />
                    <button
                      onClick={() => handleSendWhatsApp(waInput)}
                      disabled={lead.dnd || !waInput.trim()}
                      className="p-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl disabled:opacity-40 transition-colors"
                    >
                      <Send className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Tab 4: Orders */}
            {activeTab === 'orders' && (
              <div className="flex-1 p-6 overflow-y-auto space-y-4">
                <div className="flex justify-between items-center">
                  <h4 className="text-xs font-bold text-slate-800">Purchases & Replenishment Pipeline</h4>
                  <button
                    onClick={() => {
                      onClose();
                      onOpenOrder(lead);
                    }}
                    className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-sm transition-all"
                  >
                    + Create New Order
                  </button>
                </div>

                {leadOrders.length === 0 ? (
                  <div className="text-center py-12 text-slate-400 text-xs">
                    No orders placed yet. Create an order via the Counter POS.
                  </div>
                ) : (
                  leadOrders.map((ord) => (
                    <div key={ord.id} className="bg-white rounded-2xl p-4 border border-slate-200 shadow-sm space-y-2">
                      <div className="flex justify-between items-start">
                        <div>
                          <div className="font-bold text-slate-900 text-xs">{ord.product}</div>
                          <div className="text-[11px] text-slate-500">
                            Pack: {ord.pack} • Channel: {ord.channel} {ord.coupon_code && `• Coupon: ${ord.coupon_code}`}
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="font-black text-slate-900 text-sm">{formatINR(ord.amount)}</div>
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 uppercase">
                            {ord.payment_status}
                          </span>
                        </div>
                      </div>

                      <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
                        <span>Ordered on: {ord.order_date}</span>
                        <span className="font-bold text-teal-800 bg-teal-50 px-2 py-0.5 rounded">
                          Reorder Due Date: {ord.reorder_due_date} (Day 25)
                        </span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
