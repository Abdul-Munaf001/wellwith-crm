import React, { useState, useEffect } from 'react';
import { api } from '../api/client';
import {
  Calendar,
  Clock,
  Video,
  CheckCircle2,
  XCircle,
  AlertCircle,
  User,
  ExternalLink,
  RefreshCw,
  Plus,
} from 'lucide-react';
import { useOutletContext } from 'react-router-dom';

export const ConsultationsPage: React.FC = () => {
  const { onOpenLeadDetail } = useOutletContext<{ onOpenLeadDetail: (id: string) => void }>();

  const [consultations, setConsultations] = useState<any[]>([]);
  const [scheduled, setScheduled] = useState<any[]>([]);
  const [past, setPast] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState<'scheduled' | 'past'>('scheduled');
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const fetchConsultations = async () => {
    setIsLoading(true);
    try {
      const res = await api.getConsultations();
      setConsultations(res.consultations || []);
      setScheduled(res.scheduled || []);
      setPast(res.past || []);
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchConsultations();
  }, []);

  const handleUpdateStatus = async (id: string, status: string) => {
    try {
      await api.updateConsultation(id, { status });
      fetchConsultations();
    } catch (e) {
      console.error(e);
    }
  };

  const currentList = activeTab === 'scheduled' ? scheduled : past;

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 dark:text-slate-100 tracking-tight font-sans">
            Doctor & Nutrition Consultations
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            1-on-1 discovery sessions, Google Meet links, and attendance tracking
          </p>
        </div>

        <button
          onClick={fetchConsultations}
          className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white dark:bg-slate-900 border border-wellness-border dark:border-slate-800 text-xs font-semibold shadow-sm hover:bg-slate-50"
        >
          <RefreshCw size={13} className={isLoading ? 'animate-spin' : ''} /> Refresh
        </button>
      </div>

      {/* Tabs */}
      <div className="flex bg-white dark:bg-slate-900 border border-wellness-border dark:border-slate-800 rounded-xl p-1 w-fit shadow-sm">
        <button
          onClick={() => setActiveTab('scheduled')}
          className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-2 ${
            activeTab === 'scheduled' ? 'bg-wellness-600 text-white shadow-soft' : 'text-slate-600 dark:text-slate-400'
          }`}
        >
          <Calendar size={14} /> Upcoming ({scheduled.length})
        </button>
        <button
          onClick={() => setActiveTab('past')}
          className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-2 ${
            activeTab === 'past' ? 'bg-wellness-600 text-white shadow-soft' : 'text-slate-600 dark:text-slate-400'
          }`}
        >
          <CheckCircle2 size={14} /> Completed & Past ({past.length})
        </button>
      </div>

      {/* List */}
      <div className="space-y-3">
        {currentList.length === 0 ? (
          <div className="p-12 text-center bg-white dark:bg-slate-900 rounded-2xl border border-wellness-border dark:border-slate-800">
            <Calendar size={32} className="mx-auto text-wellness-600 mb-2" />
            <h3 className="font-bold text-slate-800 dark:text-slate-100 text-sm">No consultations found</h3>
            <p className="text-xs text-slate-400 mt-1">Book discovery sessions directly from the lead detail modal.</p>
          </div>
        ) : (
          currentList.map((item) => (
            <div
              key={item.id}
              onClick={() => item.lead?.id && onOpenLeadDetail(item.lead.id)}
              className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-wellness-border dark:border-slate-800 shadow-soft hover:border-wellness-500 cursor-pointer transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4"
            >
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-xl bg-wellness-100 dark:bg-emerald-950 font-bold text-wellness-800 dark:text-emerald-300 flex items-center justify-center text-sm border border-wellness-200 dark:border-emerald-800 flex-shrink-0">
                  <Video size={18} />
                </div>
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="font-bold text-sm text-slate-900 dark:text-slate-100">
                      {item.lead?.name}
                    </h3>
                    <span
                      className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full border ${
                        item.status === 'SCHEDULED'
                          ? 'bg-blue-50 text-blue-800 border-blue-200 dark:bg-blue-950/60 dark:text-blue-300'
                          : item.status === 'COMPLETED'
                          ? 'bg-emerald-50 text-emerald-800 border-emerald-200 dark:bg-emerald-950/60 dark:text-emerald-300'
                          : 'bg-red-50 text-red-800 border-red-200 dark:bg-red-950/60 dark:text-red-300'
                      }`}
                    >
                      {item.status}
                    </span>
                  </div>

                  <p className="text-xs text-wellness-800 dark:text-emerald-400 font-semibold mt-0.5">
                    Goal: {item.lead?.wellnessGoal} • Location: {item.lead?.city || 'N/A'} • {item.lead?.phone}
                  </p>

                  {item.notes && (
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                      {item.notes}
                    </p>
                  )}

                  <div className="flex items-center gap-2 text-[11px] text-slate-400 mt-1.5">
                    <Clock size={12} />
                    <span>Time: {new Date(item.scheduledAt).toLocaleString()}</span>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between sm:justify-end gap-2 border-t sm:border-none pt-2 sm:pt-0">
                {item.meetingLink && (
                  <a
                    href={item.meetingLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={(e) => e.stopPropagation()}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-blue-50 hover:bg-blue-100 text-blue-700 text-xs font-bold border border-blue-200"
                  >
                    <ExternalLink size={13} /> Join Meet
                  </a>
                )}

                {item.status === 'SCHEDULED' && (
                  <>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleUpdateStatus(item.id, 'COMPLETED');
                      }}
                      className="px-3 py-1.5 rounded-xl bg-wellness-600 hover:bg-wellness-700 text-white text-xs font-bold shadow-soft"
                    >
                      Attended / Done
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleUpdateStatus(item.id, 'NO_SHOW');
                      }}
                      className="px-3 py-1.5 rounded-xl bg-red-100 text-red-700 hover:bg-red-200 text-xs font-bold"
                    >
                      No Show
                    </button>
                  </>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
