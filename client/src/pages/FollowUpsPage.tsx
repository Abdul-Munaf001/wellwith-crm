import React, { useState, useEffect } from 'react';
import { api } from '../api/client';
import {
  CalendarCheck,
  Clock,
  CheckCircle2,
  AlertTriangle,
  Calendar,
  Flame,
  Phone,
  MessageSquare,
  ChevronRight,
  RefreshCw,
  Plus,
} from 'lucide-react';
import { useOutletContext } from 'react-router-dom';

export const FollowUpsPage: React.FC = () => {
  const { onOpenLeadDetail } = useOutletContext<{ onOpenLeadDetail: (id: string) => void }>();

  const [followupsData, setFollowupsData] = useState<any>({ overdue: [], dueToday: [], upcoming: [] });
  const [activeTab, setActiveTab] = useState<'overdue' | 'dueToday' | 'upcoming'>('dueToday');
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Reschedule state
  const [snoozeModalId, setSnoozeModalId] = useState<string | null>(null);
  const [newDueDate, setNewDueDate] = useState<string>('');

  const fetchFollowUps = async () => {
    setIsLoading(true);
    try {
      const res = await api.getFollowUps();
      setFollowupsData(res);
      // Auto-switch to overdue if dueToday is empty but overdue has items
      if (res.dueToday?.length === 0 && res.overdue?.length > 0) {
        setActiveTab('overdue');
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchFollowUps();
  }, []);

  const handleComplete = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await api.updateFollowUpStatus(id, 'COMPLETED');
      fetchFollowUps();
    } catch (e) {
      console.error(e);
    }
  };

  const handleSnooze = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!snoozeModalId || !newDueDate) return;
    try {
      await api.snoozeFollowUp(snoozeModalId, newDueDate);
      setSnoozeModalId(null);
      setNewDueDate('');
      fetchFollowUps();
    } catch (e) {
      console.error(e);
    }
  };

  const currentList =
    activeTab === 'overdue'
      ? followupsData.overdue
      : activeTab === 'dueToday'
      ? followupsData.dueToday
      : followupsData.upcoming;

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 dark:text-slate-100 tracking-tight font-sans">
            Follow-ups & Reminders
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Never lose momentum with prospects. Action overdue and upcoming callbacks.
          </p>
        </div>

        <button
          onClick={fetchFollowUps}
          className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white dark:bg-slate-900 border border-wellness-border dark:border-slate-800 text-xs font-semibold shadow-sm hover:bg-slate-50"
        >
          <RefreshCw size={13} className={isLoading ? 'animate-spin' : ''} /> Refresh
        </button>
      </div>

      {/* Tabs */}
      <div className="grid grid-cols-3 gap-3">
        <button
          onClick={() => setActiveTab('overdue')}
          className={`p-4 rounded-2xl border text-left transition-all ${
            activeTab === 'overdue'
              ? 'bg-red-50 dark:bg-red-950/40 border-red-300 dark:border-red-800 shadow-soft'
              : 'bg-white dark:bg-slate-900 border-wellness-border dark:border-slate-800 hover:bg-slate-50'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-red-600 dark:text-red-400 flex items-center gap-1.5">
              <AlertTriangle size={15} /> Overdue
            </span>
            <span className="text-lg font-black text-red-700 dark:text-red-300">
              {followupsData.overdue?.length || 0}
            </span>
          </div>
          <p className="text-[11px] text-slate-400 mt-1">Requires urgent callback</p>
        </button>

        <button
          onClick={() => setActiveTab('dueToday')}
          className={`p-4 rounded-2xl border text-left transition-all ${
            activeTab === 'dueToday'
              ? 'bg-amber-50 dark:bg-amber-950/40 border-amber-300 dark:border-amber-800 shadow-soft'
              : 'bg-white dark:bg-slate-900 border-wellness-border dark:border-slate-800 hover:bg-slate-50'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-amber-600 dark:text-amber-400 flex items-center gap-1.5">
              <Clock size={15} /> Due Today
            </span>
            <span className="text-lg font-black text-amber-700 dark:text-amber-300">
              {followupsData.dueToday?.length || 0}
            </span>
          </div>
          <p className="text-[11px] text-slate-400 mt-1">Scheduled for today</p>
        </button>

        <button
          onClick={() => setActiveTab('upcoming')}
          className={`p-4 rounded-2xl border text-left transition-all ${
            activeTab === 'upcoming'
              ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-300 dark:border-emerald-800 shadow-soft'
              : 'bg-white dark:bg-slate-900 border-wellness-border dark:border-slate-800 hover:bg-slate-50'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5">
              <CalendarCheck size={15} /> Upcoming
            </span>
            <span className="text-lg font-black text-emerald-700 dark:text-emerald-300">
              {followupsData.upcoming?.length || 0}
            </span>
          </div>
          <p className="text-[11px] text-slate-400 mt-1">Next 7 to 30 days</p>
        </button>
      </div>

      {/* Follow-up Cards List */}
      <div className="space-y-3">
        {currentList?.length === 0 ? (
          <div className="p-12 text-center bg-white dark:bg-slate-900 rounded-2xl border border-wellness-border dark:border-slate-800">
            <CalendarCheck size={32} className="mx-auto text-wellness-600 mb-2" />
            <h3 className="font-bold text-slate-800 dark:text-slate-100 text-sm">No follow-ups in this tab</h3>
            <p className="text-xs text-slate-400 mt-1">Check the other tabs or schedule new reminders from the leads page.</p>
          </div>
        ) : (
          currentList?.map((item: any) => (
            <div
              key={item.id}
              onClick={() => item.lead?.id && onOpenLeadDetail(item.lead.id)}
              className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-wellness-border dark:border-slate-800 shadow-soft hover:border-wellness-500 cursor-pointer transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4"
            >
              <div className="flex items-start gap-4">
                <button
                  onClick={(e) => handleComplete(item.id, e)}
                  className="mt-0.5 p-1 rounded-lg text-slate-300 hover:text-wellness-600 hover:bg-wellness-50 transition-colors"
                  title="Mark as completed"
                >
                  <CheckCircle2 size={22} />
                </button>
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="font-bold text-sm text-slate-900 dark:text-slate-100">
                      {item.title}
                    </h3>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                      {item.priority}
                    </span>
                  </div>

                  {item.lead && (
                    <p className="text-xs text-wellness-800 dark:text-emerald-400 font-semibold mt-0.5">
                      Lead: {item.lead.name} ({item.lead.phone}) • {item.lead.wellnessGoal}
                    </p>
                  )}

                  {item.notes && (
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                      {item.notes}
                    </p>
                  )}

                  <div className="flex items-center gap-2 text-[11px] text-slate-400 mt-1.5">
                    <Clock size={12} />
                    <span>Due: {new Date(item.dueDate).toLocaleString()}</span>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between sm:justify-end gap-2 border-t sm:border-none pt-2 sm:pt-0">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setSnoozeModalId(item.id);
                  }}
                  className="px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-50"
                >
                  Snooze / Reschedule
                </button>

                {item.lead && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onOpenLeadDetail(item.lead.id);
                    }}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-wellness-600 hover:bg-wellness-700 text-white font-bold text-xs shadow-soft"
                  >
                    <Phone size={13} /> Call Now
                  </button>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      {/* SNOOZE / RESCHEDULE MODAL */}
      {snoozeModalId && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-sm w-full p-5 border border-slate-200 dark:border-slate-800 shadow-xl">
            <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 mb-2">
              Reschedule Follow-up
            </h3>
            <form onSubmit={handleSnooze} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  New Due Date & Time *
                </label>
                <input
                  type="datetime-local"
                  required
                  value={newDueDate}
                  onChange={(e) => setNewDueDate(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-wellness-500"
                />
              </div>
              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setSnoozeModalId(null)}
                  className="px-3 py-1.5 rounded-xl text-xs font-bold text-slate-500 hover:bg-slate-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded-xl text-xs font-bold text-white bg-wellness-600 hover:bg-wellness-700 shadow-soft"
                >
                  Save Reschedule
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
