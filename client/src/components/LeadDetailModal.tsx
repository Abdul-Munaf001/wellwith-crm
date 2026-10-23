import React, { useState, useEffect } from 'react';
import {
  X,
  Phone,
  MessageSquare,
  Mail,
  Flame,
  Clock,
  Sparkles,
  Calendar,
  CheckCircle,
  AlertCircle,
  FileText,
  User,
  Heart,
  Activity,
  Send,
  Plus,
  RefreshCw,
  ExternalLink,
} from 'lucide-react';
import { Lead, LeadStatus } from '../types/crm';
import { api } from '../api/client';
import { useAuth } from '../context/AuthContext';

interface LeadDetailModalProps {
  leadId: string;
  onClose: () => void;
  onUpdated?: () => void;
}

const STAGES: LeadStatus[] = [
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

export const LeadDetailModal: React.FC<LeadDetailModalProps> = ({ leadId, onClose, onUpdated }) => {
  const { user, isSuperAdmin, isClientAdmin } = useAuth();
  const [lead, setLead] = useState<Lead | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [activeTab, setActiveTab] = useState<'timeline' | 'call' | 'intake' | 'whatsapp' | 'consultation'>('call');

  // Call log form state
  const [callOutcome, setCallOutcome] = useState<string>('Interested');
  const [callNotes, setCallNotes] = useState<string>('');
  const [nextFollowup, setNextFollowup] = useState<string>('');
  const [isLoggingCall, setIsLoggingCall] = useState<boolean>(false);

  // Intake form state
  const [intakeSleep, setIntakeSleep] = useState('');
  const [intakeStress, setIntakeStress] = useState('');
  const [intakeDiet, setIntakeDiet] = useState('');
  const [intakeExercise, setIntakeExercise] = useState('');
  const [intakeMedicalFlags, setIntakeMedicalFlags] = useState('');
  const [isSavingIntake, setIsSavingIntake] = useState(false);

  // WhatsApp template preview state
  const [templates, setTemplates] = useState<any[]>([]);
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>('');
  const [waPreview, setWaPreview] = useState<any>(null);

  // Consultation booking state
  const [consultTime, setConsultTime] = useState<string>('');
  const [consultNotes, setConsultNotes] = useState<string>('');
  const [isBookingConsult, setIsBookingConsult] = useState<boolean>(false);

  const fetchLead = async () => {
    setIsLoading(true);
    try {
      const res = await api.getLead(leadId);
      setLead(res.lead);
      if (res.lead) {
        setIntakeSleep(res.lead.intakeSleep || '');
        setIntakeStress(res.lead.intakeStress || '');
        setIntakeDiet(res.lead.intakeDiet || '');
        setIntakeExercise(res.lead.intakeExercise || '');
        setIntakeMedicalFlags(res.lead.intakeMedicalFlags || '');
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchLead();
    // Load WhatsApp templates
    api.getWhatsAppTemplates().then((res) => {
      setTemplates(res.templates || []);
      if (res.templates?.length > 0) {
        setSelectedTemplateId(res.templates[0].id);
      }
    }).catch(console.error);
  }, [leadId]);

  // When selected template changes, fetch preview
  useEffect(() => {
    if (selectedTemplateId && leadId) {
      api.previewWhatsApp(selectedTemplateId, leadId)
        .then((res) => setWaPreview(res))
        .catch(console.error);
    }
  }, [selectedTemplateId, leadId]);

  const handleStageChange = async (newStatus: LeadStatus) => {
    if (!lead) return;
    try {
      await api.updateLead(lead.id, { status: newStatus });
      fetchLead();
      if (onUpdated) onUpdated();
    } catch (e) {
      console.error(e);
    }
  };

  const handleLogCall = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!lead) return;
    setIsLoggingCall(true);
    try {
      await api.logCall({
        leadId: lead.id,
        outcome: callOutcome,
        notes: callNotes,
        nextFollowupAt: nextFollowup || undefined,
      });
      setCallNotes('');
      setNextFollowup('');
      fetchLead();
      if (onUpdated) onUpdated();
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoggingCall(false);
    }
  };

  const handleSaveIntake = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!lead) return;
    setIsSavingIntake(true);
    try {
      await api.saveIntake(lead.id, {
        intakeSleep,
        intakeStress,
        intakeDiet,
        intakeExercise,
        intakeMedicalFlags,
      });
      fetchLead();
      if (onUpdated) onUpdated();
    } catch (e) {
      console.error(e);
    } finally {
      setIsSavingIntake(false);
    }
  };

  const handleBookConsultation = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!lead || !consultTime) return;
    setIsBookingConsult(true);
    try {
      await api.bookConsultation({
        leadId: lead.id,
        scheduledAt: consultTime,
        notes: consultNotes,
      });
      setConsultNotes('');
      setConsultTime('');
      fetchLead();
      if (onUpdated) onUpdated();
    } catch (e) {
      console.error(e);
    } finally {
      setIsBookingConsult(false);
    }
  };

  const handleOpenWhatsApp = () => {
    if (!waPreview?.waUrl || !lead) return;
    api.logWhatsAppClick({
      leadId: lead.id,
      templateName: waPreview.templateName,
      messagePreview: waPreview.message,
    });
    window.open(waPreview.waUrl, '_blank');
  };

  if (!lead && isLoading) {
    return (
      <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4">
        <div className="bg-white dark:bg-slate-900 rounded-2xl p-8 max-w-md w-full shadow-soft-lg flex flex-col items-center justify-center gap-3">
          <RefreshCw className="animate-spin text-wellness-600" size={32} />
          <p className="text-sm font-semibold text-slate-700 dark:text-slate-200">Loading lead profile...</p>
        </div>
      </div>
    );
  }

  if (!lead) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-2 sm:p-4 overflow-y-auto">
      <div className="bg-white dark:bg-slate-900 border border-wellness-border dark:border-slate-800 rounded-2xl shadow-2xl max-w-4xl w-full max-h-[92vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Header Profile Bar */}
        <div className="px-6 py-4 bg-gradient-to-r from-wellness-50 to-white dark:from-slate-800 dark:to-slate-900 border-b border-wellness-border dark:border-slate-800 flex items-start justify-between">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-2xl bg-wellness-100 dark:bg-emerald-950 text-wellness-800 dark:text-emerald-300 font-extrabold flex items-center justify-center text-lg border border-wellness-200 dark:border-emerald-800 shadow-soft">
              {lead.name[0]}
            </div>
            <div>
              <div className="flex items-center gap-3 flex-wrap">
                <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100 font-sans">
                  {lead.name}
                </h2>
                {/* Heat Score Badge */}
                <div className="flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-50 dark:bg-amber-950/60 border border-amber-200 dark:border-amber-800 text-amber-700 dark:text-amber-400">
                  <Flame size={13} className="text-amber-500 fill-amber-500" />
                  <span>Heat: {lead.heatScore}/100</span>
                </div>
                {/* Speed to Lead */}
                {lead.speedToLead && (
                  <div
                    className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold border ${
                      lead.speedToLead.status === 'fast'
                        ? 'bg-emerald-50 text-emerald-800 border-emerald-200 dark:bg-emerald-950/50 dark:text-emerald-300'
                        : lead.speedToLead.status === 'warning'
                        ? 'bg-amber-50 text-amber-800 border-amber-200 dark:bg-amber-950/50 dark:text-amber-300'
                        : 'bg-red-50 text-red-800 border-red-200 dark:bg-red-950/50 dark:text-red-300'
                    }`}
                  >
                    <Clock size={11} />
                    <span>Speed: {lead.speedToLead.elapsedMinutes}m</span>
                  </div>
                )}
              </div>

              {/* Sub-info */}
              <div className="flex items-center gap-3 text-xs text-slate-500 dark:text-slate-400 mt-1 flex-wrap">
                <span className="font-medium text-slate-700 dark:text-slate-300">{lead.phone}</span>
                <span>•</span>
                <span>{lead.city || 'Location N/A'}</span>
                <span>•</span>
                <span className="text-wellness-700 dark:text-emerald-400 font-semibold">{lead.wellnessGoal}</span>
                <span>•</span>
                <span>Source: {lead.source}</span>
                {lead.assignedTo && (
                  <>
                    <span>•</span>
                    <span className="text-slate-600 dark:text-slate-300 font-medium">Assigned: {lead.assignedTo.name}</span>
                  </>
                )}
              </div>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Action Buttons & Stage Selector */}
        <div className="px-6 py-2.5 bg-wellness-50/60 dark:bg-slate-800/40 border-b border-wellness-border dark:border-slate-800 flex items-center justify-between flex-wrap gap-3">
          {/* Quick Contact Buttons */}
          <div className="flex items-center gap-2">
            <a
              href={`tel:${lead.phone}`}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-wellness-600 hover:bg-wellness-700 text-white font-semibold text-xs transition-colors shadow-soft"
            >
              <Phone size={14} /> Call Lead
            </a>
            <button
              onClick={() => setActiveTab('whatsapp')}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800 font-semibold text-xs hover:bg-emerald-200 transition-colors"
            >
              <MessageSquare size={14} /> WhatsApp
            </button>
            {lead.email && (
              <a
                href={`mailto:${lead.email}`}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 font-semibold text-xs transition-colors"
              >
                <Mail size={14} /> Email
              </a>
            )}
          </div>

          {/* Pipeline Stage Dropdown */}
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-slate-500">Pipeline Stage:</span>
            <select
              value={lead.status}
              onChange={(e) => handleStageChange(e.target.value as LeadStatus)}
              className="text-xs font-bold px-3 py-1.5 rounded-xl border border-wellness-border dark:border-slate-700 bg-white dark:bg-slate-800 text-wellness-900 dark:text-emerald-300 focus:outline-none focus:ring-2 focus:ring-wellness-500 cursor-pointer shadow-sm"
            >
              {STAGES.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Smart Program Recommendation Banner */}
        {lead.programRecommendation && (
          <div className="mx-6 mt-3 p-3 rounded-xl bg-gradient-to-r from-emerald-50 to-teal-50 dark:from-emerald-950/40 dark:to-teal-950/40 border border-emerald-200 dark:border-emerald-800/60 flex items-start justify-between gap-4">
            <div className="flex items-start gap-3">
              <div className="p-2 rounded-xl bg-white dark:bg-slate-800 text-emerald-600 dark:text-emerald-400 shadow-sm">
                <Sparkles size={18} />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-800 dark:text-emerald-400">
                    Smart Match Program:
                  </span>
                  <span className="text-xs font-bold text-slate-900 dark:text-slate-100">
                    {lead.programRecommendation.suggestedProgram}
                  </span>
                  <span className="text-xs font-extrabold text-wellness-700 dark:text-emerald-400">
                    (₹{lead.programRecommendation.priceINR.toLocaleString('en-IN')})
                  </span>
                </div>
                <p className="text-xs text-slate-600 dark:text-slate-300 mt-0.5">
                  {lead.programRecommendation.keyBenefit}
                </p>
                <div className="mt-1.5 flex items-center gap-3 text-[11px] text-slate-600 dark:text-slate-400 flex-wrap">
                  <span className="font-semibold text-emerald-700 dark:text-emerald-400">Talking Points:</span>
                  {lead.programRecommendation.talkingPoints.slice(0, 2).map((tp, idx) => (
                    <span key={idx} className="bg-white/70 dark:bg-slate-800/80 px-2 py-0.5 rounded-md border border-emerald-100 dark:border-emerald-900">
                      💡 {tp}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Modal Navigation Tabs */}
        <div className="px-6 border-b border-slate-200 dark:border-slate-800 flex gap-4 mt-3">
          {[
            { key: 'call', label: 'Log Call', icon: Phone },
            { key: 'intake', label: 'Wellness Intake', icon: Heart },
            { key: 'whatsapp', label: 'WhatsApp Templates', icon: MessageSquare },
            { key: 'consultation', label: 'Book Consultation', icon: Calendar },
            { key: 'timeline', label: 'Activity Timeline', icon: Activity },
          ].map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key as any)}
                className={`flex items-center gap-2 py-2.5 text-xs font-bold border-b-2 transition-colors ${
                  activeTab === tab.key
                    ? 'border-wellness-600 text-wellness-700 dark:text-emerald-400'
                    : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
                }`}
              >
                <Icon size={14} />
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* Tab Content Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {/* TAB 1: Log Call Form */}
          {activeTab === 'call' && (
            <form onSubmit={handleLogCall} className="space-y-4 max-w-2xl">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Call Outcome *
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {[
                    'Interested',
                    'Call Back Later',
                    'Answered',
                    'Busy',
                    'Switched Off',
                    'Not Answered',
                    'Not Interested',
                    'Wrong Number',
                  ].map((outcome) => (
                    <button
                      key={outcome}
                      type="button"
                      onClick={() => setCallOutcome(outcome)}
                      className={`p-2 rounded-xl text-xs font-bold border transition-all text-center ${
                        callOutcome === outcome
                          ? outcome === 'Interested'
                            ? 'bg-wellness-600 text-white border-wellness-600 shadow-soft'
                            : outcome === 'Call Back Later'
                            ? 'bg-amber-500 text-white border-amber-500'
                            : 'bg-slate-800 text-white border-slate-800 dark:bg-slate-200 dark:text-slate-900'
                          : 'bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-100'
                      }`}
                    >
                      {outcome}
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Call Duration
                  </label>
                  <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-xs text-slate-400">
                    <Clock size={14} />
                    <span>Coming soon (Telephony Auto-track)</span>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Schedule Next Follow-Up Date & Time
                  </label>
                  <input
                    type="datetime-local"
                    value={nextFollowup}
                    onChange={(e) => setNextFollowup(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-wellness-500 text-slate-800 dark:text-slate-100"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Call Notes & Customer Feedback
                </label>
                <textarea
                  rows={3}
                  placeholder="Summarize key health concerns discussed, diet routine, budget readiness, objections..."
                  value={callNotes}
                  onChange={(e) => setCallNotes(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-wellness-500 text-slate-800 dark:text-slate-100"
                ></textarea>
              </div>

              <button
                type="submit"
                disabled={isLoggingCall}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-wellness-600 hover:bg-wellness-700 text-white font-bold text-xs transition-colors shadow-soft"
              >
                {isLoggingCall ? <RefreshCw className="animate-spin" size={14} /> : <CheckCircle size={14} />}
                Save Call Log & Update Heat Score
              </button>
            </form>
          )}

          {/* TAB 2: Wellness Intake Mini-Form */}
          {activeTab === 'intake' && (
            <form onSubmit={handleSaveIntake} className="space-y-4 max-w-2xl">
              <div className="p-3 rounded-xl bg-wellness-50 dark:bg-emerald-950/40 border border-wellness-200 dark:border-emerald-900 text-xs text-wellness-900 dark:text-emerald-300 flex items-center gap-2">
                <Heart size={16} className="text-wellness-600 flex-shrink-0" />
                <span>
                  Quick Intake Mini-Form: Fill health & lifestyle insights in-call. Produces clean intake summary (+10 Heat Score bonus).
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Sleep Routine & Quality
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. 5-6 hrs, takes 1 hr to sleep, restless"
                    value={intakeSleep}
                    onChange={(e) => setIntakeSleep(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-wellness-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Daily Stress & Work Pressure
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. High (Executive burnout, 12h screen time)"
                    value={intakeStress}
                    onChange={(e) => setIntakeStress(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-wellness-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Dietary Habits & Water Intake
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Vegetarian, frequent tea, sugar cravings post 4 PM"
                    value={intakeDiet}
                    onChange={(e) => setIntakeDiet(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-wellness-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Exercise & Physical Activity
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Sedentary / Morning walk 20m / Yoga beginner"
                    value={intakeExercise}
                    onChange={(e) => setIntakeExercise(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-wellness-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Medical Flags / Pre-existing Conditions
                </label>
                <input
                  type="text"
                  placeholder="e.g. Hypothyroid (Eltroxin 50), Pre-diabetic, Knee pain, PCOS"
                  value={intakeMedicalFlags}
                  onChange={(e) => setIntakeMedicalFlags(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-wellness-500"
                />
              </div>

              <button
                type="submit"
                disabled={isSavingIntake}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-wellness-600 hover:bg-wellness-700 text-white font-bold text-xs transition-colors shadow-soft"
              >
                {isSavingIntake ? <RefreshCw className="animate-spin" size={14} /> : <CheckCircle size={14} />}
                Save Wellness Intake Profile
              </button>
            </form>
          )}

          {/* TAB 3: WhatsApp Templates */}
          {activeTab === 'whatsapp' && (
            <div className="space-y-4 max-w-2xl">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Select WhatsApp Template
                </label>
                <select
                  value={selectedTemplateId}
                  onChange={(e) => setSelectedTemplateId(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-semibold text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-wellness-500"
                >
                  {templates.map((t) => (
                    <option key={t.id} value={t.id}>
                      [{t.category}] {t.name}
                    </option>
                  ))}
                </select>
              </div>

              {waPreview && (
                <div className="space-y-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                      Rendered Message Preview (Variables Autocompleted)
                    </label>
                    <div className="p-4 rounded-xl bg-emerald-50/60 dark:bg-slate-800 border border-emerald-200 dark:border-slate-700 text-xs text-slate-800 dark:text-slate-100 whitespace-pre-wrap font-sans">
                      {waPreview.message}
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={handleOpenWhatsApp}
                    className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs transition-colors shadow-soft"
                  >
                    <ExternalLink size={14} /> Open in WhatsApp ({waPreview.phone})
                  </button>
                </div>
              )}
            </div>
          )}

          {/* TAB 4: Book Consultation */}
          {activeTab === 'consultation' && (
            <form onSubmit={handleBookConsultation} className="space-y-4 max-w-xl">
              <div className="p-3 rounded-xl bg-wellness-50 dark:bg-emerald-950/40 border border-wellness-200 dark:border-emerald-900 text-xs text-wellness-900 dark:text-emerald-300 flex items-center gap-2">
                <Calendar size={16} className="text-wellness-600 flex-shrink-0" />
                <span>
                  Schedule 1-on-1 discovery consultation with our senior doctor / nutritionist.
                </span>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Consultation Date & Time *
                </label>
                <input
                  type="datetime-local"
                  required
                  value={consultTime}
                  onChange={(e) => setConsultTime(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-wellness-500 text-slate-800 dark:text-slate-100"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Doctor Pre-Consultation Notes
                </label>
                <textarea
                  rows={3}
                  placeholder="e.g. Lead has high HbA1c (8.2), prefers afternoon video consultation, needs low glycemic guide."
                  value={consultNotes}
                  onChange={(e) => setConsultNotes(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-wellness-500 text-slate-800 dark:text-slate-100"
                ></textarea>
              </div>

              <button
                type="submit"
                disabled={isBookingConsult}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-wellness-600 hover:bg-wellness-700 text-white font-bold text-xs transition-colors shadow-soft"
              >
                {isBookingConsult ? <RefreshCw className="animate-spin" size={14} /> : <Calendar size={14} />}
                Confirm Doctor Consultation Booking
              </button>
            </form>
          )}

          {/* TAB 5: Activity Timeline */}
          {activeTab === 'timeline' && (
            <div className="space-y-3">
              {lead.activities?.length === 0 ? (
                <p className="text-xs text-slate-400 text-center py-6">No recorded activity yet.</p>
              ) : (
                <div className="relative border-l-2 border-wellness-200 dark:border-slate-700 ml-3 space-y-4 py-2">
                  {lead.activities?.map((act) => (
                    <div key={act.id} className="relative pl-6">
                      <div className="absolute -left-1.5 top-1 w-3 h-3 rounded-full bg-wellness-500 border-2 border-white dark:border-slate-900"></div>
                      <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                        <div className="flex items-center justify-between text-xs">
                          <span className="font-bold text-slate-800 dark:text-slate-200">{act.title}</span>
                          <span className="text-[10px] text-slate-400">
                            {new Date(act.createdAt).toLocaleString()}
                          </span>
                        </div>
                        {act.description && (
                          <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">{act.description}</p>
                        )}
                        {act.user && (
                          <p className="text-[10px] text-wellness-700 dark:text-emerald-400 font-semibold mt-1">
                            Logged by: {act.user.name}
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
