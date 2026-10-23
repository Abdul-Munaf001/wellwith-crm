import React, { useState, useEffect } from 'react';
import { api } from '../api/client';
import { useAuth } from '../context/AuthContext';
import {
  Users,
  Trophy,
  Flame,
  PhoneCall,
  CheckCircle2,
  Calendar,
  UserCheck,
  ArrowRight,
  RefreshCw,
  Search,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export const TeamActivityPage: React.FC = () => {
  const { user, isSuperAdmin, setViewAsUser } = useAuth();
  const navigate = useNavigate();

  const [stats, setStats] = useState<any>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const fetchStats = async () => {
    setIsLoading(true);
    try {
      const res = await api.getCallStats();
      setStats(res);
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  const handleSimulateUser = (userId: string) => {
    setViewAsUser(userId);
    navigate('/');
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 dark:text-slate-100 tracking-tight font-sans">
            Team Calling Activity & Performance
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Per-telecaller leads assigned, calls made, answer connect rates, conversions, and streaks
          </p>
        </div>

        <button
          onClick={fetchStats}
          className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white dark:bg-slate-900 border border-wellness-border dark:border-slate-800 text-xs font-semibold shadow-sm hover:bg-slate-50"
        >
          <RefreshCw size={13} className={isLoading ? 'animate-spin' : ''} /> Refresh
        </button>
      </div>

      {/* Aggregate KPI Summary */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-wellness-border dark:border-slate-800 shadow-soft">
          <span className="text-[10px] font-bold uppercase text-slate-400 block">Total Outbound Calls</span>
          <span className="text-2xl font-black text-slate-900 dark:text-slate-100">
            {stats?.summary?.totalCalls || 0}
          </span>
          <span className="text-[11px] text-slate-400 block mt-1">Across all team telecallers</span>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-wellness-border dark:border-slate-800 shadow-soft">
          <span className="text-[10px] font-bold uppercase text-slate-400 block">Answered Connections</span>
          <span className="text-2xl font-black text-emerald-600">
            {stats?.summary?.answeredCalls || 0}
          </span>
          <span className="text-[11px] text-slate-400 block mt-1">{stats?.summary?.connectRate || 0}% overall connect</span>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-wellness-border dark:border-slate-800 shadow-soft">
          <span className="text-[10px] font-bold uppercase text-slate-400 block">Unique Leads Contacted</span>
          <span className="text-2xl font-black text-blue-600">
            {stats?.summary?.uniqueLeadsContacted || 0}
          </span>
          <span className="text-[11px] text-slate-400 block mt-1">Individual people spoken to</span>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-wellness-border dark:border-slate-800 shadow-soft">
          <span className="text-[10px] font-bold uppercase text-slate-400 block">Active Telecallers</span>
          <span className="text-2xl font-black text-purple-600">
            {stats?.teamBreakdown?.length || 0}
          </span>
          <span className="text-[11px] text-slate-400 block mt-1">Full-time wellness closers</span>
        </div>
      </div>

      {/* Team Member Cards / Table */}
      <div className="bg-white dark:bg-slate-900 border border-wellness-border dark:border-slate-800 rounded-2xl shadow-soft overflow-hidden">
        <div className="p-4 border-b border-wellness-border dark:border-slate-800 flex items-center justify-between">
          <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <Trophy size={16} className="text-amber-500" /> Leaderboard & Caller Breakdown
          </h3>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-500 uppercase font-bold border-b border-slate-100 dark:border-slate-800">
              <tr>
                <th className="p-3.5">Telecaller</th>
                <th className="p-3.5">Assigned Leads</th>
                <th className="p-3.5">Calls Made</th>
                <th className="p-3.5">Answered</th>
                <th className="p-3.5">Connect %</th>
                <th className="p-3.5">Conversions</th>
                <th className="p-3.5">Calling Streak</th>
                <th className="p-3.5 text-right">Admin Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {stats?.teamBreakdown?.map((member: any, idx: number) => (
                <tr key={member.user.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                  <td className="p-3.5">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-wellness-100 dark:bg-emerald-950 font-bold text-wellness-800 dark:text-emerald-300 flex items-center justify-center text-xs">
                        #{idx + 1}
                      </div>
                      <div>
                        <div className="font-bold text-slate-900 dark:text-slate-100">{member.user.name}</div>
                        <div className="text-[11px] text-slate-400">{member.user.email}</div>
                      </div>
                    </div>
                  </td>
                  <td className="p-3.5 font-semibold text-slate-800 dark:text-slate-200">
                    {member.assignedLeads} leads
                  </td>
                  <td className="p-3.5 font-bold text-slate-900 dark:text-slate-100">
                    {member.callsMade}
                  </td>
                  <td className="p-3.5 font-bold text-emerald-600">
                    {member.answered}
                  </td>
                  <td className="p-3.5">
                    <span className="font-bold text-slate-800 dark:text-slate-200">
                      {member.connectRate}%
                    </span>
                  </td>
                  <td className="p-3.5">
                    <span className="px-2.5 py-1 rounded-full text-[10px] font-black bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                      {member.conversions} Enrolled
                    </span>
                  </td>
                  <td className="p-3.5">
                    <div className="flex items-center gap-1 font-bold text-amber-600 dark:text-amber-400">
                      <Flame size={13} className="fill-amber-500" />
                      <span>{member.streakDays} Days</span>
                    </div>
                  </td>
                  <td className="p-3.5 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => navigate(`/leads?assignedToId=${member.user.id}`)}
                        className="px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-300 text-xs font-semibold"
                      >
                        Drill Down Leads
                      </button>
                      {isSuperAdmin && (
                        <button
                          onClick={() => handleSimulateUser(member.user.id)}
                          className="px-2.5 py-1 rounded-lg bg-amber-50 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-800 hover:bg-amber-100 text-xs font-bold"
                          title="Simulate this user's view"
                        >
                          View as User
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
