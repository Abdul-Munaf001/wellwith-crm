import React, { useState, useEffect } from 'react';
import { api } from '../api/client';
import { useAuth } from '../context/AuthContext';
import {
  Bot,
  Sparkles,
  PhoneCall,
  Play,
  FileText,
  Clock,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  Plus,
  MessageSquare,
  ShieldAlert,
} from 'lucide-react';
import { useOutletContext } from 'react-router-dom';

export const AiTelecallingPage: React.FC = () => {
  const { isSuperAdmin, canAccessAiTelecalling } = useAuth();
  const { onOpenLeadDetail } = useOutletContext<{ onOpenLeadDetail: (id: string) => void }>();

  const [campaigns, setCampaigns] = useState<any[]>([]);
  const [scripts, setScripts] = useState<any[]>([]);
  const [queue, setQueue] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isSimulating, setIsSimulating] = useState<boolean>(false);

  // Active view tab
  const [activeTab, setActiveTab] = useState<'queue' | 'scripts' | 'campaigns'>('queue');

  // Selected transcript modal
  const [selectedTranscript, setSelectedTranscript] = useState<any | null>(null);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const [cRes, sRes, qRes] = await Promise.all([
        api.getAiCampaigns(),
        api.getAiScripts(),
        api.getAiQueue(),
      ]);
      setCampaigns(cRes.campaigns || []);
      setScripts(sRes.scripts || []);
      setQueue(qRes.results || []);
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (canAccessAiTelecalling) {
      fetchData();
    }
  }, [canAccessAiTelecalling]);

  const handleSimulateRun = async () => {
    setIsSimulating(true);
    try {
      const res = await api.simulateAiCalls();
      alert(`AI Telecalling simulator completed: ${res.processedCount} queued calls processed with transcripts and intent detection!`);
      fetchData();
    } catch (err: any) {
      alert(err.message || 'AI Telecalling simulation failed');
    } finally {
      setIsSimulating(false);
    }
  };

  if (!canAccessAiTelecalling) {
    return (
      <div className="p-12 text-center max-w-md mx-auto my-12 bg-white dark:bg-slate-900 rounded-3xl border border-red-200 dark:border-red-900 shadow-soft">
        <ShieldAlert size={48} className="mx-auto text-red-500 mb-3" />
        <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100">Access Restricted</h2>
        <p className="text-xs text-slate-500 mt-2 leading-relaxed">
          AI Telecalling is an internal automated outreach module reserved strictly for Super Admin and requires the workspace feature flag <code className="bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded text-red-600 font-mono">ai_telecalling_enabled</code>.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Top Header Banner */}
      <div className="p-6 rounded-3xl bg-gradient-to-r from-purple-700 via-indigo-700 to-slate-900 text-white shadow-soft-lg flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-2 max-w-xl">
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-xl bg-white/20 backdrop-blur-md">
              <Bot size={20} className="text-purple-200" />
            </span>
            <span className="text-xs font-black uppercase tracking-widest text-purple-200">
              Admin Internal Module
            </span>
          </div>
          <h1 className="text-2xl font-black tracking-tight font-sans">
            AI Telecalling & Voice Outreach
          </h1>
          <p className="text-xs text-purple-100 leading-relaxed">
            Autonomous conversational agent (Maya AI) for high-speed lead qualification, objection handling, and appointment booking. Pluggable into Vapi / Retell / Bland telephony adapters.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handleSimulateRun}
            disabled={isSimulating}
            className="flex items-center gap-2 px-5 py-3 rounded-2xl bg-white text-purple-950 font-extrabold text-xs hover:bg-purple-50 transition-all shadow-xl active:scale-95 disabled:opacity-50"
          >
            {isSimulating ? <RefreshCw className="animate-spin text-purple-600" size={16} /> : <Play size={16} className="text-purple-600 fill-purple-600" />}
            <span>Run AI Calls Simulator</span>
          </button>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex bg-white dark:bg-slate-900 border border-wellness-border dark:border-slate-800 rounded-xl p-1 w-fit shadow-sm">
        <button
          onClick={() => setActiveTab('queue')}
          className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-2 ${
            activeTab === 'queue' ? 'bg-purple-600 text-white shadow-soft' : 'text-slate-600 dark:text-slate-400'
          }`}
        >
          <PhoneCall size={14} /> Call Queue & Results ({queue.length})
        </button>
        <button
          onClick={() => setActiveTab('scripts')}
          className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-2 ${
            activeTab === 'scripts' ? 'bg-purple-600 text-white shadow-soft' : 'text-slate-600 dark:text-slate-400'
          }`}
        >
          <FileText size={14} /> Conversational Scripts ({scripts.length})
        </button>
        <button
          onClick={() => setActiveTab('campaigns')}
          className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-2 ${
            activeTab === 'campaigns' ? 'bg-purple-600 text-white shadow-soft' : 'text-slate-600 dark:text-slate-400'
          }`}
        >
          <Sparkles size={14} /> Outreach Campaigns ({campaigns.length})
        </button>
      </div>

      {/* TAB 1: CALL QUEUE & RESULTS */}
      {activeTab === 'queue' && (
        <div className="space-y-3">
          {queue.length === 0 ? (
            <div className="p-12 text-center bg-white dark:bg-slate-900 rounded-2xl border border-wellness-border dark:border-slate-800">
              <Bot size={32} className="mx-auto text-purple-600 mb-2" />
              <h3 className="font-bold text-slate-800 dark:text-slate-100 text-sm">No items in AI queue</h3>
              <p className="text-xs text-slate-400 mt-1">Queue leads from campaign builder to trigger automated voice outreach.</p>
            </div>
          ) : (
            queue.map((item) => (
              <div
                key={item.id}
                className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-wellness-border dark:border-slate-800 shadow-soft flex flex-col sm:flex-row sm:items-center justify-between gap-4"
              >
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-xl bg-purple-100 dark:bg-purple-950 font-bold text-purple-800 dark:text-purple-300 flex items-center justify-center text-sm border border-purple-200 dark:border-purple-800 flex-shrink-0">
                    <Bot size={18} />
                  </div>
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <h4 className="font-bold text-sm text-slate-900 dark:text-slate-100">{item.lead?.name}</h4>
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                          item.status === 'COMPLETED'
                            ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                            : item.status === 'CALLING'
                            ? 'bg-blue-50 text-blue-800 border-blue-200 animate-pulse'
                            : 'bg-slate-100 text-slate-700 border-slate-200'
                        }`}
                      >
                        {item.status}
                      </span>
                      {item.detectedIntent && (
                        <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-purple-100 text-purple-800 border border-purple-300">
                          Intent: {item.detectedIntent}
                        </span>
                      )}
                      {item.sentiment && (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-teal-50 text-teal-800 border border-teal-200">
                          Sentiment: {item.sentiment}
                        </span>
                      )}
                    </div>

                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                      Phone: <span className="font-medium text-slate-700 dark:text-slate-300">{item.lead?.phone}</span> • Goal: {item.lead?.wellnessGoal} • City: {item.lead?.city || 'N/A'}
                    </p>

                    {item.calledAt && (
                      <p className="text-[11px] text-slate-400 mt-1 flex items-center gap-2">
                        <Clock size={11} />
                        <span>Called at: {new Date(item.calledAt).toLocaleString()} ({item.durationSeconds}s duration)</span>
                      </p>
                    )}
                  </div>
                </div>

                <div className="flex items-center justify-between sm:justify-end gap-2 border-t sm:border-none pt-2 sm:pt-0">
                  {item.transcript && (
                    <button
                      onClick={() => setSelectedTranscript(item)}
                      className="px-3 py-1.5 rounded-xl bg-purple-50 hover:bg-purple-100 text-purple-700 dark:bg-purple-950/60 dark:text-purple-300 text-xs font-bold border border-purple-200 dark:border-purple-800"
                    >
                      View Transcript
                    </button>
                  )}
                  {item.lead && (
                    <button
                      onClick={() => onOpenLeadDetail(item.lead.id)}
                      className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-semibold"
                    >
                      Lead Profile
                    </button>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* TAB 2: SCRIPTS */}
      {activeTab === 'scripts' && (
        <div className="space-y-4">
          {scripts.map((script) => (
            <div
              key={script.id}
              className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-wellness-border dark:border-slate-800 shadow-soft space-y-3"
            >
              <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
                <h3 className="font-bold text-sm text-slate-900 dark:text-slate-100">{script.name}</h3>
                <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600">
                  {script.language}
                </span>
              </div>

              <div>
                <span className="text-[11px] font-bold uppercase text-slate-400 block mb-1">Greeting Hook</span>
                <p className="text-xs text-slate-700 dark:text-slate-200 bg-slate-50 dark:bg-slate-800 p-3 rounded-xl italic">
                  "{script.greeting}"
                </p>
              </div>

              <div>
                <span className="text-[11px] font-bold uppercase text-slate-400 block mb-1">Closing & Booking</span>
                <p className="text-xs text-slate-700 dark:text-slate-200 bg-slate-50 dark:bg-slate-800 p-3 rounded-xl italic">
                  "{script.closing}"
                </p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* TAB 3: CAMPAIGNS */}
      {activeTab === 'campaigns' && (
        <div className="space-y-4">
          {campaigns.map((camp) => (
            <div
              key={camp.id}
              className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-wellness-border dark:border-slate-800 shadow-soft flex items-center justify-between"
            >
              <div>
                <h3 className="font-bold text-sm text-slate-900 dark:text-slate-100">{camp.name}</h3>
                <p className="text-xs text-slate-400 mt-0.5">Calling hours: {camp.callingHours} • Script: {camp.script?.name || 'Standard'}</p>
              </div>

              <div className="text-right">
                <span className="text-xs font-bold text-purple-600 block">
                  {camp.totalCalled} of {camp.totalQueued} Calls Completed
                </span>
                <span className="text-[10px] text-slate-400 uppercase font-semibold">Status: {camp.status}</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* TRANSCRIPT VIEWER MODAL */}
      {selectedTranscript && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-xl w-full p-6 border border-slate-200 dark:border-slate-800 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                <Bot size={18} className="text-purple-600" /> AI Call Transcript: {selectedTranscript.lead?.name}
              </h3>
              <button onClick={() => setSelectedTranscript(null)} className="text-slate-400 hover:text-slate-600">
                &times;
              </button>
            </div>

            <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800 text-xs text-slate-800 dark:text-slate-200 whitespace-pre-wrap font-sans leading-relaxed border border-slate-200 dark:border-slate-700">
              {selectedTranscript.transcript}
            </div>

            <div className="flex items-center justify-between text-xs text-slate-500 pt-2 border-t border-slate-100 dark:border-slate-800">
              <span>Intent: <strong className="text-purple-600">{selectedTranscript.detectedIntent}</strong></span>
              <span>Sentiment: <strong className="text-emerald-600">{selectedTranscript.sentiment}</strong></span>
              <button
                onClick={() => setSelectedTranscript(null)}
                className="px-4 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 font-bold"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
