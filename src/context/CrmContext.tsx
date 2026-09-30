'use client';

import React, { createContext, useContext, useState, useEffect, useMemo, ReactNode } from 'react';
import {
  Lead,
  Order,
  UserProfile,
  CallLog,
  Message,
  Activity,
  Campaign,
  Product,
  LeadStage,
  LeadScore,
  UserRole,
} from '@/types/crm';
import {
  INITIAL_PROFILES,
  INITIAL_LEADS,
  INITIAL_ORDERS,
  INITIAL_CALL_LOGS,
  INITIAL_MESSAGES,
  INITIAL_ACTIVITIES,
  INITIAL_CAMPAIGNS,
  INITIAL_PRODUCTS,
} from '@/lib/mockData';
import { cleanPhone, calculateReorderDueDate } from '@/lib/utils';

interface CrmContextType {
  currentUser: UserProfile;
  setCurrentUser: (user: UserProfile) => void;
  switchRole: (role: UserRole) => void;
  profiles: UserProfile[];
  leads: Lead[];
  orders: Order[];
  callLogs: CallLog[];
  messages: Message[];
  activities: Activity[];
  campaigns: Campaign[];
  products: Product[];
  audioAlertEnabled: boolean;
  setAudioAlertEnabled: (enabled: boolean) => void;
  playHotLeadChime: () => void;
  
  // Actions
  updateLeadStage: (leadId: string, newStage: LeadStage) => void;
  updateLeadScore: (leadId: string, newScore: LeadScore) => void;
  updateLead: (leadId: string, updates: Partial<Lead>) => void;
  addLead: (lead: Partial<Lead>) => Lead;
  deleteLead: (leadId: string) => void;
  assignLead: (leadId: string, ownerId: string) => void;
  toggleDnd: (leadId: string) => void;
  clearEscalation: (leadId: string) => void;
  addLeadNote: (leadId: string, note: string) => void;
  
  createOrder: (orderData: Omit<Order, 'id' | 'reorder_due_date'>) => Order;
  sendWhatsAppMessage: (leadId: string, content: string, template?: string) => void;
  logManualCall: (leadId: string, outcome: string, notes?: string) => void;
  
  // Simulator triggers
  simulateIncomingMetaLead: (scenario?: 'hot' | 'invalid' | 'pregnancy' | 'regular') => Lead;
  simulateBolnaCallCompletion: (leadId: string) => void;
  simulateWhatsAppReply: (leadId: string, text: string) => void;
  resetToDemoData: () => void;
}

const CrmContext = createContext<CrmContextType | undefined>(undefined);

const STORAGE_KEY = 'wellwith_crm_state_v1';

export function CrmProvider({ children }: { children: ReactNode }) {
  const [profiles] = useState<UserProfile[]>(INITIAL_PROFILES);
  const [currentUser, setCurrentUser] = useState<UserProfile>(INITIAL_PROFILES[0]); // Default to Dr. Vikram Rao (Owner)
  const [leads, setLeads] = useState<Lead[]>(INITIAL_LEADS);
  const [orders, setOrders] = useState<Order[]>(INITIAL_ORDERS);
  const [callLogs, setCallLogs] = useState<CallLog[]>(INITIAL_CALL_LOGS);
  const [messages, setMessages] = useState<Message[]>(INITIAL_MESSAGES);
  const [activities, setActivities] = useState<Activity[]>(INITIAL_ACTIVITIES);
  const [campaigns, setCampaigns] = useState<Campaign[]>(INITIAL_CAMPAIGNS);
  const [products] = useState<Product[]>(INITIAL_PRODUCTS);
  const [audioAlertEnabled, setAudioAlertEnabled] = useState<boolean>(true);
  const [isHydrated, setIsHydrated] = useState(false);

  // Load from local storage
  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.leads) setLeads(parsed.leads);
        if (parsed.orders) setOrders(parsed.orders);
        if (parsed.callLogs) setCallLogs(parsed.callLogs);
        if (parsed.messages) setMessages(parsed.messages);
        if (parsed.activities) setActivities(parsed.activities);
        if (parsed.campaigns) setCampaigns(parsed.campaigns);
        if (parsed.currentUserId) {
          const user = INITIAL_PROFILES.find((p) => p.id === parsed.currentUserId);
          if (user) setCurrentUser(user);
        }
      }
    } catch {
      // ignore JSON parse error
    }
    setIsHydrated(true);
  }, []);

  // Save on state change
  useEffect(() => {
    if (!isHydrated) return;
    try {
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({
          leads,
          orders,
          callLogs,
          messages,
          activities,
          campaigns,
          currentUserId: currentUser.id,
        })
      );
    } catch {
      // storage full or blocked
    }
  }, [leads, orders, callLogs, messages, activities, campaigns, currentUser, isHydrated]);

  // Clean Web Audio API chime (Dual Tone 587Hz -> 880Hz)
  const playHotLeadChime = () => {
    if (!audioAlertEnabled) return;
    try {
      const audioCtx = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
      const now = audioCtx.currentTime;

      // Note 1 (D5)
      const osc1 = audioCtx.createOscillator();
      const gain1 = audioCtx.createGain();
      osc1.type = 'sine';
      osc1.frequency.setValueAtTime(587.33, now);
      gain1.gain.setValueAtTime(0.15, now);
      gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.35);
      osc1.connect(gain1);
      gain1.connect(audioCtx.destination);
      osc1.start(now);
      osc1.stop(now + 0.35);

      // Note 2 (A5 - pleasant alert bell)
      const osc2 = audioCtx.createOscillator();
      const gain2 = audioCtx.createGain();
      osc2.type = 'sine';
      osc2.frequency.setValueAtTime(880.0, now + 0.15);
      gain2.gain.setValueAtTime(0.2, now + 0.15);
      gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.7);
      osc2.connect(gain2);
      gain2.connect(audioCtx.destination);
      osc2.start(now + 0.15);
      osc2.stop(now + 0.7);
    } catch (e) {
      console.warn('Audio chime unsupported or blocked by browser gesture policy', e);
    }
  };

  const switchRole = (role: UserRole) => {
    const target = profiles.find((p) => p.role === role) || profiles[0];
    setCurrentUser(target);
  };

  const logActivity = (leadId: string, type: 'stage change' | 'note' | 'call' | 'assignment', detail: string) => {
    const newAct: Activity = {
      id: 'act-' + Date.now() + '-' + Math.random().toString(36).substr(2, 4),
      lead_id: leadId,
      user_id: currentUser.id,
      user_name: currentUser.name,
      type,
      detail,
      created_at: new Date().toISOString(),
    };
    setActivities((prev) => [newAct, ...prev]);
  };

  const updateLeadStage = (leadId: string, newStage: LeadStage) => {
    setLeads((prev) =>
      prev.map((lead) => {
        if (lead.id === leadId) {
          logActivity(leadId, 'stage change', `Stage updated from "${lead.stage}" to "${newStage}"`);
          return { ...lead, stage: newStage };
        }
        return lead;
      })
    );
  };

  const updateLeadScore = (leadId: string, newScore: LeadScore) => {
    setLeads((prev) =>
      prev.map((lead) => (lead.id === leadId ? { ...lead, lead_score: newScore } : lead))
    );
  };

  const updateLead = (leadId: string, updates: Partial<Lead>) => {
    setLeads((prev) =>
      prev.map((lead) => (lead.id === leadId ? { ...lead, ...updates } : lead))
    );
  };

  const addLead = (partialLead: Partial<Lead>): Lead => {
    const rawPhone = partialLead.phone_raw || '';
    const { phoneClean, isValid } = cleanPhone(rawPhone);

    const newLead: Lead = {
      id: 'lead-' + Date.now(),
      created_at: new Date().toISOString(),
      name: partialLead.name || 'Anonymous Lead',
      phone_raw: rawPhone,
      phone_clean: phoneClean,
      valid: isValid,
      source: partialLead.source || 'Meta Instant Form',
      campaign_id: partialLead.campaign_id,
      campaign_name: partialLead.campaign_name,
      coupon_code: partialLead.coupon_code,
      concern: partialLead.concern || 'General Wellness & Immunity Consultation',
      area: partialLead.area || 'Hyderabad / Online',
      call_attempts: 0,
      lead_score: partialLead.lead_score || 'Warm',
      stage: partialLead.stage || 'New',
      product_interest: partialLead.product_interest,
      owner_id: partialLead.owner_id || 'user-closer-1',
      owner_name: partialLead.owner_name || 'Rohit Reddy',
      opt_in: partialLead.opt_in !== false,
      dnd: partialLead.dnd || false,
      escalated: partialLead.escalated || false,
      notes: partialLead.notes || '',
      is_test: partialLead.is_test || false,
    };

    setLeads((prev) => [newLead, ...prev]);
    logActivity(newLead.id, 'stage change', `New lead received from ${newLead.source}`);

    if (newLead.lead_score === 'Hot') {
      playHotLeadChime();
    }

    return newLead;
  };

  const deleteLead = (leadId: string) => {
    if (currentUser.role === 'closer' || currentUser.role === 'viewer') {
      alert('Access Denied: Closers and Viewers cannot delete leads.');
      return;
    }
    setLeads((prev) => prev.filter((l) => l.id !== leadId));
  };

  const assignLead = (leadId: string, ownerId: string) => {
    const assignee = profiles.find((p) => p.id === ownerId);
    setLeads((prev) =>
      prev.map((lead) => {
        if (lead.id === leadId) {
          logActivity(leadId, 'assignment', `Lead assigned to ${assignee ? assignee.name : 'Unassigned'}`);
          return { ...lead, owner_id: ownerId, owner_name: assignee ? assignee.name : undefined };
        }
        return lead;
      })
    );
  };

  const toggleDnd = (leadId: string) => {
    setLeads((prev) =>
      prev.map((lead) => {
        if (lead.id === leadId) {
          const nextDnd = !lead.dnd;
          logActivity(leadId, 'note', `DND set to ${nextDnd ? 'TRUE (Promotions & Calling Blocked)' : 'FALSE'}`);
          return { ...lead, dnd: nextDnd };
        }
        return lead;
      })
    );
  };

  const clearEscalation = (leadId: string) => {
    setLeads((prev) =>
      prev.map((lead) => {
        if (lead.id === leadId) {
          logActivity(leadId, 'note', `Escalation cleared by ${currentUser.name}. Resuming normal workflows.`);
          return { ...lead, escalated: false, escalation_reason: undefined };
        }
        return lead;
      })
    );
  };

  const addLeadNote = (leadId: string, noteText: string) => {
    setLeads((prev) =>
      prev.map((lead) => {
        if (lead.id === leadId) {
          const updatedNotes = lead.notes ? `${lead.notes}\n[${currentUser.name}]: ${noteText}` : `[${currentUser.name}]: ${noteText}`;
          logActivity(leadId, 'note', `Added note: "${noteText}"`);
          return { ...lead, notes: updatedNotes };
        }
        return lead;
      })
    );
  };

  const createOrder = (orderData: Omit<Order, 'id' | 'reorder_due_date'>): Order => {
    const reorderDueDate = calculateReorderDueDate(orderData.order_date, 25);
    const newOrder: Order = {
      ...orderData,
      id: 'ord-' + Date.now(),
      reorder_due_date: reorderDueDate,
    };

    setOrders((prev) => [newOrder, ...prev]);

    // Update lead stage to Ordered
    updateLeadStage(newOrder.lead_id, 'Ordered');
    logActivity(
      newOrder.lead_id,
      'stage change',
      `Order placed: ${newOrder.product} (${newOrder.pack}) - ₹${newOrder.amount} via ${newOrder.channel}. Day-25 reorder set to ${reorderDueDate}`
    );

    return newOrder;
  };

  const sendWhatsAppMessage = (leadId: string, content: string, template?: string) => {
    const lead = leads.find((l) => l.id === leadId);
    if (lead?.dnd) {
      alert('Action blocked: Customer has active DND.');
      return;
    }
    const newMsg: Message = {
      id: 'msg-' + Date.now(),
      lead_id: leadId,
      direction: 'outbound',
      template,
      content,
      sent_at: new Date().toISOString(),
      status: 'delivered',
    };
    setMessages((prev) => [...prev, newMsg]);
    logActivity(leadId, 'note', `WhatsApp message sent: "${content.substring(0, 45)}..."`);
  };

  const logManualCall = (leadId: string, outcome: string, notes?: string) => {
    const newCall: CallLog = {
      id: 'call-' + Date.now(),
      lead_id: leadId,
      attempt_no: 1,
      called_at: new Date().toISOString(),
      duration_sec: 120,
      outcome,
      transcript_text: notes || 'Manual store agent consultation logged.',
      escalated: false,
    };
    setCallLogs((prev) => [newCall, ...prev]);
    setLeads((prev) =>
      prev.map((l) =>
        l.id === leadId
          ? {
              ...l,
              call_attempts: l.call_attempts + 1,
              call_outcome: outcome,
              first_contact_at: l.first_contact_at || new Date().toISOString(),
              response_time_sec:
                l.response_time_sec ||
                Math.round((Date.now() - new Date(l.created_at).getTime()) / 1000),
            }
          : l
      )
    );
    logActivity(leadId, 'call', `Call logged by ${currentUser.name}: ${outcome}`);
  };

  // Simulators for testing n8n, Bolna, Meta
  const simulateIncomingMetaLead = (scenario = 'hot'): Lead => {
    const now = new Date();
    if (scenario === 'pregnancy') {
      return addLead({
        name: 'Deepa Vasant',
        phone_raw: '9845099881',
        source: 'Meta Instant Form',
        concern: 'Severe morning nausea & fatigue (1st trimester pregnancy)',
        area: 'Banjara Hills, Hyderabad',
        lead_score: 'Hot',
        campaign_name: 'Meta Instant Leads - Sleep & Anxiety (Sep)',
        escalated: true,
        escalation_reason: 'Pregnancy keyword auto-detected. Escalated for human doctor assessment.',
        notes: 'Pregnancy mentioned. Compliance block enabled on AI auto-calling.',
      });
    }

    if (scenario === 'invalid') {
      return addLead({
        name: 'Incomplete Number Test',
        phone_raw: '9988',
        source: 'Meta Instant Form',
        concern: 'Test invalid intake',
        area: 'Unknown',
        lead_score: 'Cold',
        notes: 'Intake test row with 4-digit number. Flagged as invalid phone automatically.',
      });
    }

    // Default Hot Lead arriving right now
    const hotLead = addLead({
      name: 'Aditya Narayan',
      phone_raw: '+91 98860 11223',
      source: 'Meta Instant Form',
      campaign_name: 'Meta Instant Leads - Sleep & Anxiety (Sep)',
      coupon_code: 'SLEEP20',
      concern: 'Waking up with racing thoughts and gut acidity',
      area: 'Jubilee Hills, Hyderabad',
      lead_score: 'Hot',
      stage: 'New',
      product_interest: 'Deep Sleep Herbal Gummies (Melatonin + Chamomile)',
      owner_id: 'user-closer-1',
      owner_name: 'Rohit Reddy',
      notes: 'Fresh lead from Meta. Bolna AI scheduled to trigger within 60s.',
    });

    return hotLead;
  };

  const simulateBolnaCallCompletion = (leadId: string) => {
    const lead = leads.find((l) => l.id === leadId);
    if (!lead) return;

    const call: CallLog = {
      id: 'call-' + Date.now(),
      lead_id: leadId,
      attempt_no: lead.call_attempts + 1,
      called_at: new Date().toISOString(),
      duration_sec: 84,
      outcome: 'Answered - Highly Interested',
      score_given: 'Hot',
      transcript_text:
        `Bolna AI: Hello ${lead.name}, this is Wellwith AI following up on your sleep & gut inquiry.\nCustomer: Yes, I want to try your natural probiotics pack.\nBolna AI: Wonderful! I am alerting our senior counselor Rohit to send your order link right away.`,
      escalated: false,
    };
    setCallLogs((prev) => [call, ...prev]);
    updateLead(leadId, {
      call_attempts: lead.call_attempts + 1,
      call_outcome: 'Answered - Highly Interested',
      first_contact_at: lead.first_contact_at || new Date().toISOString(),
      response_time_sec: 48,
      lead_score: 'Hot',
      stage: lead.stage === 'New' ? 'Contacted' : lead.stage,
    });
    logActivity(leadId, 'call', 'Bolna AI automated call completed (84s). Classified as HOT.');
  };

  const simulateWhatsAppReply = (leadId: string, text: string) => {
    const lead = leads.find((l) => l.id === leadId);
    if (!lead) return;

    if (text.trim().toUpperCase() === 'STOP') {
      updateLead(leadId, { dnd: true });
      logActivity(leadId, 'note', 'Customer replied "STOP". DND enabled automatically per TRAI compliance.');
    }

    const replyMsg: Message = {
      id: 'msg-' + Date.now(),
      lead_id: leadId,
      direction: 'inbound',
      content: text,
      sent_at: new Date().toISOString(),
      status: 'replied',
    };
    setMessages((prev) => [...prev, replyMsg]);
  };

  const resetToDemoData = () => {
    setLeads(INITIAL_LEADS);
    setOrders(INITIAL_ORDERS);
    setCallLogs(INITIAL_CALL_LOGS);
    setMessages(INITIAL_MESSAGES);
    setActivities(INITIAL_ACTIVITIES);
    setCampaigns(INITIAL_CAMPAIGNS);
    localStorage.removeItem(STORAGE_KEY);
  };

  return (
    <CrmContext.Provider
      value={{
        currentUser,
        setCurrentUser,
        switchRole,
        profiles,
        leads,
        orders,
        callLogs,
        messages,
        activities,
        campaigns,
        products,
        audioAlertEnabled,
        setAudioAlertEnabled,
        playHotLeadChime,
        updateLeadStage,
        updateLeadScore,
        updateLead,
        addLead,
        deleteLead,
        assignLead,
        toggleDnd,
        clearEscalation,
        addLeadNote,
        createOrder,
        sendWhatsAppMessage,
        logManualCall,
        simulateIncomingMetaLead,
        simulateBolnaCallCompletion,
        simulateWhatsAppReply,
        resetToDemoData,
      }}
    >
      {children}
    </CrmContext.Provider>
  );
}

export function useCrm() {
  const context = useContext(CrmContext);
  if (!context) {
    throw new Error('useCrm must be used within a CrmProvider');
  }
  return context;
}
