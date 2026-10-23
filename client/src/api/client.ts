const API_BASE = '/api';

export class ApiError extends Error {
  status: number;
  data: any;

  constructor(status: number, message: string, data?: any) {
    super(message);
    this.status = status;
    this.data = data;
  }
}

export async function apiRequest<T = any>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const token = localStorage.getItem('wellwith_token');
  const activeWorkspaceId = localStorage.getItem('wellwith_active_workspace_id');
  const viewAsUserId = localStorage.getItem('wellwith_view_as_user_id');

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  if (activeWorkspaceId && activeWorkspaceId !== 'all') {
    headers['x-workspace-id'] = activeWorkspaceId;
  }
  if (viewAsUserId) {
    headers['x-view-as-user'] = viewAsUserId;
  }

  const response = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers,
  });

  if (response.status === 401) {
    // Only clear and redirect if we're not already on the login page
    if (!window.location.pathname.includes('/login')) {
      localStorage.removeItem('wellwith_token');
      localStorage.removeItem('wellwith_user');
      window.location.href = '/login';
    }
  }

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new ApiError(response.status, data.error || 'API Request failed', data);
  }

  return data as T;
}

// API Methods
export const api = {
  // Auth
  login: (credentials: { email: string; password: string }) =>
    apiRequest('/auth/login', { method: 'POST', body: JSON.stringify(credentials) }),
  getMe: () => apiRequest('/auth/me'),

  // Leads
  getLeads: (params: Record<string, any> = {}) => {
    const query = new URLSearchParams();
    Object.entries(params).forEach(([k, v]) => {
      if (v !== undefined && v !== null && v !== '') query.append(k, String(v));
    });
    return apiRequest(`/leads?${query.toString()}`);
  },
  getLead: (id: string) => apiRequest(`/leads/${id}`),
  createLead: (data: any) => apiRequest('/leads', { method: 'POST', body: JSON.stringify(data) }),
  updateLead: (id: string, data: any) =>
    apiRequest(`/leads/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  saveIntake: (id: string, data: any) =>
    apiRequest(`/leads/${id}/intake`, { method: 'POST', body: JSON.stringify(data) }),
  getFocusQueue: () => apiRequest('/leads/focus'),
  getHealthWarnings: () => apiRequest('/leads/warnings'),
  bulkAssign: (leadIds: string[], userId: string) =>
    apiRequest('/leads/bulk-assign', { method: 'POST', body: JSON.stringify({ leadIds, userId }) }),
  bulkStatus: (leadIds: string[], status: string) =>
    apiRequest('/leads/bulk-status', { method: 'POST', body: JSON.stringify({ leadIds, status }) }),
  bulkDelete: (leadIds: string[]) =>
    apiRequest('/leads/bulk-delete', { method: 'POST', body: JSON.stringify({ leadIds }) }),
  mergeLeads: (primaryLeadId: string, secondaryLeadId: string) =>
    apiRequest('/leads/merge', { method: 'POST', body: JSON.stringify({ primaryLeadId, secondaryLeadId }) }),
  autoAssign: (rule: string) =>
    apiRequest('/leads/auto-assign', { method: 'POST', body: JSON.stringify({ rule }) }),

  // Dashboard
  getDashboardStats: (range = '30D') => apiRequest(`/dashboard/stats?range=${range}`),

  // Calls
  logCall: (data: any) => apiRequest('/calls', { method: 'POST', body: JSON.stringify(data) }),
  getCallStats: (params: Record<string, any> = {}) => {
    const query = new URLSearchParams(params).toString();
    return apiRequest(`/calls/stats?${query}`);
  },
  getCallHeatmap: () => apiRequest('/calls/heatmap'),

  // Follow-ups
  getFollowUps: () => apiRequest('/followups'),
  createFollowUp: (data: any) => apiRequest('/followups', { method: 'POST', body: JSON.stringify(data) }),
  updateFollowUpStatus: (id: string, status: string) =>
    apiRequest(`/followups/${id}/status`, { method: 'PUT', body: JSON.stringify({ status }) }),
  snoozeFollowUp: (id: string, newDueDate: string) =>
    apiRequest(`/followups/${id}/snooze`, { method: 'PUT', body: JSON.stringify({ newDueDate }) }),

  // Consultations
  getConsultations: () => apiRequest('/consultations'),
  bookConsultation: (data: any) =>
    apiRequest('/consultations', { method: 'POST', body: JSON.stringify(data) }),
  updateConsultation: (id: string, data: any) =>
    apiRequest(`/consultations/${id}`, { method: 'PUT', body: JSON.stringify(data) }),

  // Enrollments & Renewals
  getEnrollments: () => apiRequest('/enrollments'),
  createEnrollment: (data: any) =>
    apiRequest('/enrollments', { method: 'POST', body: JSON.stringify(data) }),
  renewEnrollment: (id: string, data: any) =>
    apiRequest(`/enrollments/${id}/renew`, { method: 'POST', body: JSON.stringify(data) }),

  // Campaigns & Ad Attribution
  getCampaigns: () => apiRequest('/campaigns'),
  createCampaign: (data: any) =>
    apiRequest('/campaigns', { method: 'POST', body: JSON.stringify(data) }),
  recordSpend: (data: any) =>
    apiRequest('/campaigns/spend', { method: 'POST', body: JSON.stringify(data) }),

  // WhatsApp
  getWhatsAppTemplates: () => apiRequest('/whatsapp/templates'),
  previewWhatsApp: (templateId: string, leadId: string) =>
    apiRequest('/whatsapp/preview', { method: 'POST', body: JSON.stringify({ templateId, leadId }) }),
  logWhatsAppClick: (data: any) =>
    apiRequest('/whatsapp/log', { method: 'POST', body: JSON.stringify(data) }),

  // AI Telecalling (Admin only)
  getAiCampaigns: () => apiRequest('/ai-telecalling/campaigns'),
  createAiCampaign: (data: any) =>
    apiRequest('/ai-telecalling/campaigns', { method: 'POST', body: JSON.stringify(data) }),
  getAiScripts: () => apiRequest('/ai-telecalling/scripts'),
  createAiScript: (data: any) =>
    apiRequest('/ai-telecalling/scripts', { method: 'POST', body: JSON.stringify(data) }),
  getAiQueue: (campaignId?: string) =>
    apiRequest(`/ai-telecalling/queue${campaignId ? `?campaignId=${campaignId}` : ''}`),
  simulateAiCalls: (campaignId?: string) =>
    apiRequest('/ai-telecalling/simulate-run', { method: 'POST', body: JSON.stringify({ campaignId }) }),

  // Workspaces
  getWorkspaces: () => apiRequest('/workspaces'),
  createWorkspace: (data: any) =>
    apiRequest('/workspaces', { method: 'POST', body: JSON.stringify(data) }),
  updateWorkspace: (id: string, data: any) =>
    apiRequest(`/workspaces/${id}`, { method: 'PUT', body: JSON.stringify(data) }),

  // Users
  getUsers: () => apiRequest('/users'),
  createUser: (data: any) => apiRequest('/users', { method: 'POST', body: JSON.stringify(data) }),
  updateUser: (id: string, data: any) =>
    apiRequest(`/users/${id}`, { method: 'PUT', body: JSON.stringify(data) }),

  // Settings & Audit
  getPrograms: () => apiRequest('/settings/programs'),
  createProgram: (data: any) =>
    apiRequest('/settings/programs', { method: 'POST', body: JSON.stringify(data) }),
  getFeatureFlags: () => apiRequest('/settings/feature-flags'),
  toggleFeatureFlag: (data: { workspaceId: string; key: string; enabled: boolean }) =>
    apiRequest('/settings/feature-flags/toggle', { method: 'POST', body: JSON.stringify(data) }),
  getAuditLogs: () => apiRequest('/settings/audit-logs'),
  getNotifications: () => apiRequest('/settings/notifications'),
  markNotificationsRead: () =>
    apiRequest('/settings/notifications/mark-read', { method: 'PUT' }),
};
