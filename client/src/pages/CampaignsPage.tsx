import React, { useState, useEffect } from 'react';
import { api } from '../api/client';
import { useAuth } from '../context/AuthContext';
import {
  Megaphone,
  TrendingUp,
  DollarSign,
  Users,
  Percent,
  Sparkles,
  RefreshCw,
  Plus,
  Copy,
  Check,
  Code2,
  ExternalLink,
  ShieldCheck,
} from 'lucide-react';

export const CampaignsPage: React.FC = () => {
  const { currentWorkspace, isSuperAdmin } = useAuth();
  const [campaigns, setCampaigns] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [showWebhookModal, setShowWebhookModal] = useState<boolean>(false);
  const [copied, setCopied] = useState<boolean>(false);

  // Manual spend state
  const [spendModalCampId, setSpendModalCampId] = useState<string | null>(null);
  const [spendAmount, setSpendAmount] = useState('');
  const [spendImpressions, setSpendImpressions] = useState('');
  const [spendClicks, setSpendClicks] = useState('');

  const fetchCampaigns = async () => {
    setIsLoading(true);
    try {
      const res = await api.getCampaigns();
      setCampaigns(res.campaigns || []);
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchCampaigns();
  }, []);

  const handleRecordSpend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!spendModalCampId || !spendAmount) return;
    try {
      await api.recordSpend({
        campaignId: spendModalCampId,
        amount: parseFloat(spendAmount),
        impressions: spendImpressions ? parseInt(spendImpressions, 10) : 0,
        clicks: spendClicks ? parseInt(spendClicks, 10) : 0,
      });
      setSpendModalCampId(null);
      setSpendAmount('');
      fetchCampaigns();
    } catch (e) {
      console.error(e);
    }
  };

  const webhookUrl = `${window.location.origin}/api/campaigns/webhooks/leads/${currentWorkspace?.secretWebhookToken || 'wh_sec_wellwith_hq_2026'}`;

  const copyToClipboard = () => {
    navigator.clipboard.writeText(webhookUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 dark:text-slate-100 tracking-tight font-sans">
            Ad Campaign Response & Attribution
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Track Meta & Google ads down to revenue, Cost per Lead (CPL), and Ad Quality Scores
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowWebhookModal(true)}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 font-bold text-xs hover:bg-slate-200 transition-colors"
          >
            <Code2 size={14} /> Webhook API Docs
          </button>
          <button
            onClick={fetchCampaigns}
            className="p-2 rounded-xl bg-white dark:bg-slate-900 border border-wellness-border dark:border-slate-800 text-xs font-semibold shadow-sm hover:bg-slate-50"
          >
            <RefreshCw size={13} className={isLoading ? 'animate-spin' : ''} />
          </button>
        </div>
      </div>

      {/* Campaigns Grid */}
      <div className="space-y-4">
        {campaigns.length === 0 ? (
          <div className="p-12 text-center bg-white dark:bg-slate-900 rounded-2xl border border-wellness-border dark:border-slate-800">
            <Megaphone size={32} className="mx-auto text-wellness-600 mb-2" />
            <h3 className="font-bold text-slate-800 dark:text-slate-100 text-sm">No campaigns connected yet</h3>
            <p className="text-xs text-slate-400 mt-1">Connect your Meta or Google Lead Ad campaigns using the webhook token.</p>
          </div>
        ) : (
          campaigns.map((camp) => (
            <div
              key={camp.id}
              className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-wellness-border dark:border-slate-800 shadow-soft space-y-4"
            >
              {/* Campaign Header */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100 dark:border-slate-800">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-wellness-100 dark:bg-emerald-950 font-bold text-wellness-800 dark:text-emerald-300 flex items-center justify-center text-sm border border-wellness-200 dark:border-emerald-800 flex-shrink-0">
                    <Megaphone size={18} />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-bold text-sm text-slate-900 dark:text-slate-100">{camp.name}</h3>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-wellness-100 text-wellness-800 dark:bg-emerald-950 dark:text-emerald-300">
                        {camp.source}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      Platform: {camp.platform || 'Meta/Google'} • UTM: <span className="font-mono text-slate-600 dark:text-slate-300">{camp.utmCampaign}</span>
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  {/* Ad Quality Score */}
                  <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 text-xs font-bold text-emerald-800 dark:text-emerald-300">
                    <Sparkles size={14} className="text-emerald-600" />
                    <span>Ad Quality: {camp.adQualityScore}/10</span>
                  </div>

                  {isSuperAdmin && (
                    <button
                      onClick={() => setSpendModalCampId(camp.id)}
                      className="px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-bold hover:bg-slate-50"
                    >
                      + Add Spend
                    </button>
                  )}
                </div>
              </div>

              {/* 5 Campaign Key Metrics */}
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 text-center">
                <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800">
                  <span className="text-[10px] font-bold uppercase text-slate-400 block">Total Spend</span>
                  <span className="text-base font-black text-slate-900 dark:text-slate-100">
                    ₹{camp.spend.toLocaleString('en-IN')}
                  </span>
                </div>

                <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800">
                  <span className="text-[10px] font-bold uppercase text-slate-400 block">Leads Ingested</span>
                  <span className="text-base font-black text-slate-900 dark:text-slate-100">
                    {camp.totalLeads}
                  </span>
                </div>

                <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800">
                  <span className="text-[10px] font-bold uppercase text-slate-400 block">Cost Per Lead (CPL)</span>
                  <span className="text-base font-black text-slate-900 dark:text-slate-100">
                    ₹{camp.cpl.toLocaleString('en-IN')}
                  </span>
                </div>

                <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800">
                  <span className="text-[10px] font-bold uppercase text-slate-400 block">Conversions</span>
                  <span className="text-base font-black text-wellness-700 dark:text-emerald-400">
                    {camp.converted} ({camp.conversionRate}%)
                  </span>
                </div>

                <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800">
                  <span className="text-[10px] font-bold uppercase text-slate-400 block">Revenue & ROAS</span>
                  <span className="text-base font-black text-purple-700 dark:text-purple-400">
                    ₹{camp.revenue.toLocaleString('en-IN')} ({camp.roas}x)
                  </span>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* WEBHOOK DOCUMENTATION MODAL */}
      {showWebhookModal && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-xl w-full p-6 border border-slate-200 dark:border-slate-800 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                <Code2 size={18} className="text-wellness-600" /> Meta & Google Lead Ads Webhook
              </h3>
              <button onClick={() => setShowWebhookModal(false)} className="text-slate-400 hover:text-slate-600">
                &times;
              </button>
            </div>

            <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
              Use this webhook URL inside Zapier, Make, Meta Lead Ads Graph API, or Google Lead Forms. New leads are ingested instantly with duplicate detection and auto-assignment.
            </p>

            <div>
              <label className="block text-[11px] font-bold uppercase text-slate-400 mb-1">
                Your Workspace Webhook Endpoint (Keep Private)
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  readOnly
                  value={webhookUrl}
                  className="w-full px-3 py-2 rounded-xl text-xs font-mono bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200"
                />
                <button
                  onClick={copyToClipboard}
                  className="flex items-center gap-1 px-3 py-2 rounded-xl bg-wellness-600 text-white font-bold text-xs hover:bg-wellness-700 flex-shrink-0"
                >
                  {copied ? <Check size={14} /> : <Copy size={14} />} {copied ? 'Copied' : 'Copy'}
                </button>
              </div>
            </div>

            <div className="p-3 rounded-xl bg-slate-900 text-slate-200 font-mono text-[11px] space-y-1">
              <p className="text-slate-400">// Sample POST JSON Payload:</p>
              <p>{'{'}</p>
              <p className="pl-4">"name": "Priya Sharma",</p>
              <p className="pl-4">"phone": "+919820011223",</p>
              <p className="pl-4">"wellness_goal": "Weight Loss",</p>
              <p className="pl-4">"source": "Meta",</p>
              <p className="pl-4">"utm_campaign": "wl_reset_q4"</p>
              <p>{'}'}</p>
            </div>

            <div className="flex justify-end">
              <button
                onClick={() => setShowWebhookModal(false)}
                className="px-4 py-2 rounded-xl text-xs font-bold bg-slate-100 hover:bg-slate-200 text-slate-700"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ADD SPEND MODAL */}
      {spendModalCampId && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-sm w-full p-5 border border-slate-200 dark:border-slate-800 shadow-xl">
            <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 mb-2">Record Ad Spend</h3>
            <form onSubmit={handleRecordSpend} className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Spend Amount (₹) *
                </label>
                <input
                  type="number"
                  required
                  placeholder="5000"
                  value={spendAmount}
                  onChange={(e) => setSpendAmount(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-wellness-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Impressions
                  </label>
                  <input
                    type="number"
                    placeholder="12000"
                    value={spendImpressions}
                    onChange={(e) => setSpendImpressions(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Clicks
                  </label>
                  <input
                    type="number"
                    placeholder="450"
                    value={spendClicks}
                    onChange={(e) => setSpendClicks(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setSpendModalCampId(null)}
                  className="px-3 py-1.5 rounded-xl text-xs font-bold text-slate-500 hover:bg-slate-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded-xl text-xs font-bold text-white bg-wellness-600 hover:bg-wellness-700 shadow-soft"
                >
                  Save Spend
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
