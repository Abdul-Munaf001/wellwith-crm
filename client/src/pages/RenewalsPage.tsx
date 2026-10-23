import React, { useState, useEffect } from 'react';
import { api } from '../api/client';
import {
  RefreshCw,
  Clock,
  Sparkles,
  CheckCircle2,
  AlertTriangle,
  Gift,
  ArrowRight,
  Phone,
  MessageSquare,
  ShieldAlert,
} from 'lucide-react';
import { useOutletContext } from 'react-router-dom';

export const RenewalsPage: React.FC = () => {
  const { onOpenLeadDetail } = useOutletContext<{ onOpenLeadDetail: (id: string) => void }>();

  const [enrollmentsData, setEnrollmentsData] = useState<any>({
    activeMembers: [],
    renewalDue: [],
    winBackLapsed: [],
  });
  const [activeTab, setActiveTab] = useState<'renewalDue' | 'active' | 'winBack'>('renewalDue');
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Renewal action modal state
  const [renewModalItem, setRenewModalItem] = useState<any | null>(null);
  const [renewDays, setRenewDays] = useState('30');
  const [renewAmount, setRenewAmount] = useState('');

  const fetchEnrollments = async () => {
    setIsLoading(true);
    try {
      const res = await api.getEnrollments();
      setEnrollmentsData(res);
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchEnrollments();
  }, []);

  const handleRenew = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!renewModalItem) return;
    try {
      await api.renewEnrollment(renewModalItem.id, {
        additionalDays: parseInt(renewDays, 10),
        amountPaid: renewAmount ? parseFloat(renewAmount) : renewModalItem.program.price,
      });
      setRenewModalItem(null);
      fetchEnrollments();
    } catch (e) {
      console.error(e);
    }
  };

  const currentList =
    activeTab === 'renewalDue'
      ? enrollmentsData.renewalDue
      : activeTab === 'active'
      ? enrollmentsData.activeMembers
      : enrollmentsData.winBackLapsed;

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 dark:text-slate-100 tracking-tight font-sans">
            Retention & Renewal Tracker
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Monitor active wellness program enrollments, upcoming renewals, and win back lapsed members
          </p>
        </div>

        <button
          onClick={fetchEnrollments}
          className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white dark:bg-slate-900 border border-wellness-border dark:border-slate-800 text-xs font-semibold shadow-sm hover:bg-slate-50"
        >
          <RefreshCw size={13} className={isLoading ? 'animate-spin' : ''} /> Refresh
        </button>
      </div>

      {/* 3 Retention Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <button
          onClick={() => setActiveTab('renewalDue')}
          className={`p-4 rounded-2xl border text-left transition-all ${
            activeTab === 'renewalDue'
              ? 'bg-amber-50 dark:bg-amber-950/40 border-amber-300 dark:border-amber-800 shadow-soft'
              : 'bg-white dark:bg-slate-900 border-wellness-border dark:border-slate-800 hover:bg-slate-50'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-amber-700 dark:text-amber-400 flex items-center gap-1.5">
              <Clock size={16} /> Renewals Due (Next 7 Days)
            </span>
            <span className="text-xl font-black text-amber-800 dark:text-amber-200">
              {enrollmentsData.renewalDue?.length || 0}
            </span>
          </div>
          <p className="text-[11px] text-slate-400 mt-1">High retention conversion window</p>
        </button>

        <button
          onClick={() => setActiveTab('active')}
          className={`p-4 rounded-2xl border text-left transition-all ${
            activeTab === 'active'
              ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-300 dark:border-emerald-800 shadow-soft'
              : 'bg-white dark:bg-slate-900 border-wellness-border dark:border-slate-800 hover:bg-slate-50'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-emerald-700 dark:text-emerald-400 flex items-center gap-1.5">
              <CheckCircle2 size={16} /> Active Program Members
            </span>
            <span className="text-xl font-black text-emerald-800 dark:text-emerald-200">
              {enrollmentsData.activeMembers?.length || 0}
            </span>
          </div>
          <p className="text-[11px] text-slate-400 mt-1">Ongoing wellness protocols</p>
        </button>

        <button
          onClick={() => setActiveTab('winBack')}
          className={`p-4 rounded-2xl border text-left transition-all ${
            activeTab === 'winBack'
              ? 'bg-purple-50 dark:bg-purple-950/40 border-purple-300 dark:border-purple-800 shadow-soft'
              : 'bg-white dark:bg-slate-900 border-wellness-border dark:border-slate-800 hover:bg-slate-50'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-purple-700 dark:text-purple-400 flex items-center gap-1.5">
              <Gift size={16} /> Win-Back Opportunities
            </span>
            <span className="text-xl font-black text-purple-800 dark:text-purple-200">
              {enrollmentsData.winBackLapsed?.length || 0}
            </span>
          </div>
          <p className="text-[11px] text-slate-400 mt-1">Lapsed members to re-engage</p>
        </button>
      </div>

      {/* Member List */}
      <div className="space-y-3">
        {currentList?.length === 0 ? (
          <div className="p-12 text-center bg-white dark:bg-slate-900 rounded-2xl border border-wellness-border dark:border-slate-800">
            <Sparkles size={32} className="mx-auto text-wellness-600 mb-2" />
            <h3 className="font-bold text-slate-800 dark:text-slate-100 text-sm">No members in this category</h3>
            <p className="text-xs text-slate-400 mt-1">Enroll leads to track memberships and auto-generate renewal reminders.</p>
          </div>
        ) : (
          currentList?.map((item: any) => {
            const daysLeft = Math.round((new Date(item.endDate).getTime() - Date.now()) / 86400000);
            return (
              <div
                key={item.id}
                onClick={() => item.lead?.id && onOpenLeadDetail(item.lead.id)}
                className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-wellness-border dark:border-slate-800 shadow-soft hover:border-wellness-500 cursor-pointer transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4"
              >
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-xl bg-wellness-100 dark:bg-emerald-950 font-bold text-wellness-800 dark:text-emerald-300 flex items-center justify-center text-sm border border-wellness-200 dark:border-emerald-800 flex-shrink-0">
                    🌿
                  </div>
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="font-bold text-sm text-slate-900 dark:text-slate-100">
                        {item.lead?.name}
                      </h3>
                      <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-wellness-100 dark:bg-emerald-950 text-wellness-800 dark:text-emerald-300">
                        {item.program?.name}
                      </span>
                    </div>

                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                      Phone: <span className="text-slate-700 dark:text-slate-300 font-medium">{item.lead?.phone}</span> • Goal: {item.lead?.wellnessGoal} • Paid: ₹{item.amountPaid?.toLocaleString('en-IN')}
                    </p>

                    <div className="flex items-center gap-3 text-[11px] text-slate-400 mt-1.5 flex-wrap">
                      <span>Started: {new Date(item.startDate).toLocaleDateString()}</span>
                      <span>•</span>
                      <span>Expires: {new Date(item.endDate).toLocaleDateString()}</span>
                      <span>•</span>
                      <span
                        className={`font-bold ${
                          daysLeft <= 7
                            ? 'text-amber-600 dark:text-amber-400'
                            : 'text-emerald-600 dark:text-emerald-400'
                        }`}
                      >
                        {daysLeft > 0 ? `${daysLeft} days remaining` : `${Math.abs(daysLeft)} days ago`}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between sm:justify-end gap-2 border-t sm:border-none pt-2 sm:pt-0">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setRenewModalItem(item);
                      setRenewAmount(String(item.program?.price || ''));
                    }}
                    className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-wellness-600 hover:bg-wellness-700 text-white font-bold text-xs shadow-soft"
                  >
                    <RefreshCw size={13} /> Process Renewal
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* RENEW MODAL */}
      {renewModalItem && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-sm w-full p-5 border border-slate-200 dark:border-slate-800 shadow-xl">
            <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 mb-1">
              Renew Membership for {renewModalItem.lead?.name}
            </h3>
            <p className="text-xs text-slate-500 mb-4">Program: {renewModalItem.program?.name}</p>

            <form onSubmit={handleRenew} className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Extension Duration
                </label>
                <select
                  value={renewDays}
                  onChange={(e) => setRenewDays(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
                >
                  <option value="30">Extend by 30 Days (1 Month)</option>
                  <option value="60">Extend by 60 Days (2 Months)</option>
                  <option value="90">Extend by 90 Days (Quarterly Protocol)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Renewal Amount (₹)
                </label>
                <input
                  type="number"
                  required
                  value={renewAmount}
                  onChange={(e) => setRenewAmount(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-wellness-500"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setRenewModalItem(null)}
                  className="px-3 py-1.5 rounded-xl text-xs font-bold text-slate-500 hover:bg-slate-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded-xl text-xs font-bold text-white bg-wellness-600 hover:bg-wellness-700 shadow-soft"
                >
                  Confirm Renewal
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
