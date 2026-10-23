import React, { useState, useEffect } from 'react';
import { api } from '../api/client';
import {
  Flame,
  PhoneCall,
  Clock,
  Sparkles,
  ArrowRight,
  RefreshCw,
  AlertCircle,
  Calendar,
  Heart,
  ChevronRight,
} from 'lucide-react';
import { useOutletContext } from 'react-router-dom';

export const FocusQueuePage: React.FC = () => {
  const { onOpenLeadDetail } = useOutletContext<{ onOpenLeadDetail: (id: string) => void }>();

  const [queue, setQueue] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const fetchQueue = async () => {
    setIsLoading(true);
    try {
      const res = await api.getFocusQueue();
      setQueue(res.queue || []);
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchQueue();
  }, []);

  const handleStartNextCall = () => {
    if (queue.length > 0) {
      onOpenLeadDetail(queue[0].id);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner with big "Start Next Call" action */}
      <div className="p-6 rounded-3xl bg-gradient-to-r from-wellness-600 via-emerald-600 to-teal-700 text-white shadow-soft-lg flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-2 max-w-xl">
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-xl bg-white/20 backdrop-blur-md">
              <Flame size={20} className="text-amber-300 fill-amber-300" />
            </span>
            <span className="text-xs font-black uppercase tracking-widest text-emerald-200">
              Smart Call Queue
            </span>
          </div>
          <h1 className="text-2xl font-black tracking-tight font-sans">
            Today's Focus: Who to Call Right Now
          </h1>
          <p className="text-xs text-emerald-100 leading-relaxed">
            Algorithmic prioritization combining overdue scheduled callbacks, lead heat score (0-100), and speed-to-lead response times. Never guess who to call next.
          </p>
        </div>

        {queue.length > 0 && (
          <div className="flex flex-col items-center sm:items-end gap-2 flex-shrink-0">
            <button
              onClick={handleStartNextCall}
              className="flex items-center gap-3 px-6 py-4 rounded-2xl bg-white text-wellness-900 font-extrabold text-sm hover:bg-emerald-50 transition-all shadow-xl hover:scale-105 active:scale-95 group"
            >
              <PhoneCall size={18} className="text-wellness-600 animate-bounce" />
              <span>Start Next Call Now</span>
              <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
            </button>
            <span className="text-[11px] text-emerald-200 font-medium">
              Top lead: {queue[0]?.name} (Heat: {queue[0]?.heatScore})
            </span>
          </div>
        )}
      </div>

      {/* Queue List */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-bold text-slate-800 dark:text-slate-200 flex items-center gap-2">
            <span>Ranked Priority List</span>
            <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300">
              {queue.length} Leads in Queue
            </span>
          </h2>
          <button
            onClick={fetchQueue}
            className="flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
          >
            <RefreshCw size={13} className={isLoading ? 'animate-spin' : ''} /> Refresh Queue
          </button>
        </div>

        {queue.length === 0 ? (
          <div className="p-12 text-center bg-white dark:bg-slate-900 rounded-2xl border border-wellness-border dark:border-slate-800">
            <Sparkles size={32} className="mx-auto text-wellness-600 mb-2" />
            <h3 className="font-bold text-slate-800 dark:text-slate-100 text-sm">All caught up!</h3>
            <p className="text-xs text-slate-400 mt-1">
              No overdue follow-ups or high-heat leads waiting in your queue. Great job! 🌿
            </p>
          </div>
        ) : (
          <div className="space-y-2.5">
            {queue.map((lead, idx) => (
              <div
                key={lead.id}
                onClick={() => onOpenLeadDetail(lead.id)}
                className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-wellness-border dark:border-slate-800 shadow-soft hover:border-wellness-500 cursor-pointer transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4 group"
              >
                {/* Left: Rank, Avatar, Info */}
                <div className="flex items-start gap-4">
                  <div className="w-9 h-9 rounded-xl bg-wellness-100 dark:bg-emerald-950 font-black text-wellness-800 dark:text-emerald-300 flex items-center justify-center text-sm border border-wellness-200 dark:border-emerald-800 flex-shrink-0">
                    #{idx + 1}
                  </div>
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="font-extrabold text-sm text-slate-900 dark:text-slate-100 group-hover:text-wellness-600 transition-colors">
                        {lead.name}
                      </h3>
                      {/* Priority reason badge */}
                      <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-amber-50 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300 border border-amber-200 dark:border-amber-800">
                        {lead.focusReason}
                      </span>
                    </div>

                    <div className="flex items-center gap-2.5 text-xs text-slate-500 dark:text-slate-400 mt-1 flex-wrap">
                      <span className="font-medium text-slate-800 dark:text-slate-200">{lead.phone}</span>
                      <span>•</span>
                      <span className="font-semibold text-wellness-700 dark:text-emerald-400">
                        {lead.wellnessGoal}
                      </span>
                      <span>•</span>
                      <span>Pref: {lead.preferredCallTime || 'Anytime'}</span>
                    </div>

                    {lead.programRecommendation && (
                      <div className="mt-2 text-[11px] text-slate-600 dark:text-slate-300 flex items-center gap-1.5">
                        <Sparkles size={12} className="text-emerald-500" />
                        <span className="font-medium">Suggested:</span>
                        <span className="font-bold">{lead.programRecommendation.suggestedProgram}</span>
                        <span className="text-wellness-700 dark:text-emerald-400 font-extrabold">
                          (₹{lead.programRecommendation.priceINR.toLocaleString('en-IN')})
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Right: Heat Score, Actions */}
                <div className="flex items-center justify-between sm:justify-end gap-4 border-t sm:border-none pt-2 sm:pt-0">
                  <div className="text-right">
                    <div className="flex items-center gap-1 text-sm font-black text-amber-600 dark:text-amber-400 justify-end">
                      <Flame size={16} className="fill-amber-500 text-amber-500" />
                      <span>{lead.heatScore}/100</span>
                    </div>
                    <span className="text-[10px] text-slate-400 block capitalize">
                      {lead.status}
                    </span>
                  </div>

                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onOpenLeadDetail(lead.id);
                    }}
                    className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-wellness-600 hover:bg-wellness-700 text-white font-bold text-xs transition-colors shadow-soft"
                  >
                    <PhoneCall size={14} /> Call Now
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
