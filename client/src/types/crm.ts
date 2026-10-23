export type UserRole = 'SUPER_ADMIN' | 'TEAM_MEMBER' | 'CLIENT_ADMIN';

export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  phone?: string;
  avatar?: string;
  isActive: boolean;
  workspaceId?: string;
  workspace?: Workspace;
}

export interface Workspace {
  id: string;
  name: string;
  slug: string;
  logoUrl?: string;
  customTheme?: string;
  secretWebhookToken: string;
  featureFlags?: FeatureFlag[];
  _count?: {
    leads?: number;
    users?: number;
    campaigns?: number;
  };
}

export interface FeatureFlag {
  id: string;
  workspaceId: string;
  key: string;
  enabled: boolean;
  description?: string;
}

export type LeadStatus =
  | 'New Enquiry'
  | 'Contacted'
  | 'Wellness Assessment Done'
  | 'Consultation Booked'
  | 'Trial/Demo Attended'
  | 'Program Enrolled'
  | 'Active Member'
  | 'Renewal Due'
  | 'Lost';

export type LeadTemperature = 'Hot' | 'Warm' | 'Cold';

export interface Lead {
  id: string;
  workspaceId: string;
  name: string;
  phone: string;
  whatsappNumber?: string;
  email?: string;
  age?: number;
  gender?: string;
  city?: string;
  wellnessGoal?: string;
  healthConcerns?: string;
  budgetRange?: string;
  preferredCallTime?: string;
  language?: string;
  source: string;
  campaignId?: string;
  adSetName?: string;
  adName?: string;
  utmSource?: string;
  utmCampaign?: string;
  assignedToId?: string;
  assignedTo?: {
    id: string;
    name: string;
    email: string;
    avatar?: string;
  };
  status: LeadStatus;
  temperature: LeadTemperature;
  heatScore: number;
  notes?: string;
  intakeCompleted: boolean;
  intakeSleep?: string;
  intakeStress?: string;
  intakeDiet?: string;
  intakeExercise?: string;
  intakeMedicalFlags?: string;
  lastContactedAt?: string;
  nextFollowupAt?: string;
  createdAt: string;
  updatedAt: string;
  speedToLead?: {
    elapsedMinutes: number;
    isContacted: boolean;
    status: 'fast' | 'warning' | 'breached';
  };
  programRecommendation?: {
    suggestedProgram: string;
    priceINR: number;
    keyBenefit: string;
    talkingPoints: string[];
  };
  callLogs?: CallLog[];
  followUps?: FollowUp[];
  activities?: LeadActivity[];
  consultations?: Consultation[];
  enrollments?: Enrollment[];
  campaign?: {
    id: string;
    name: string;
    source: string;
  };
  _count?: {
    callLogs: number;
    followUps: number;
  };
}

export interface CallLog {
  id: string;
  leadId: string;
  userId: string;
  outcome: string;
  notes?: string;
  durationSeconds?: number;
  nextFollowupAt?: string;
  createdAt: string;
  user?: {
    id: string;
    name: string;
  };
}

export interface FollowUp {
  id: string;
  leadId: string;
  userId: string;
  title: string;
  notes?: string;
  dueDate: string;
  status: 'PENDING' | 'COMPLETED' | 'SNOOZED' | 'CANCELLED';
  priority: 'HIGH' | 'MEDIUM' | 'LOW';
  createdAt: string;
  lead?: {
    id: string;
    name: string;
    phone: string;
    whatsappNumber?: string;
    wellnessGoal?: string;
    status: LeadStatus;
    temperature: LeadTemperature;
    heatScore: number;
  };
  user?: {
    id: string;
    name: string;
    avatar?: string;
  };
}

export interface LeadActivity {
  id: string;
  leadId: string;
  userId?: string;
  type: string;
  title: string;
  description?: string;
  createdAt: string;
  user?: {
    id: string;
    name: string;
    avatar?: string;
  };
  lead?: {
    id: string;
    name: string;
    phone: string;
  };
}

export interface Campaign {
  id: string;
  name: string;
  source: string;
  platform?: string;
  utmCampaign?: string;
  budget: number;
  spend: number;
  status: string;
  startDate?: string;
  totalLeads: number;
  contacted: number;
  contactedPct: number;
  interested: number;
  converted: number;
  conversionRate: number;
  revenue: number;
  cpl: number;
  roas: number;
  adQualityScore: number;
  ads?: Array<{
    id: string;
    name: string;
    adSetName?: string;
    spend: number;
    impressions: number;
    clicks: number;
  }>;
}

export interface Program {
  id: string;
  name: string;
  category: string;
  price: number;
  durationDays: number;
  description?: string;
  talkingPoints?: string;
  isActive: boolean;
}

export interface Enrollment {
  id: string;
  leadId: string;
  programId: string;
  amountPaid: number;
  startDate: string;
  endDate: string;
  status: 'ACTIVE' | 'COMPLETED' | 'RENEWAL_DUE' | 'LAPSED';
  program: Program;
  lead: {
    id: string;
    name: string;
    phone: string;
    email?: string;
    wellnessGoal?: string;
    status: LeadStatus;
    assignedTo?: {
      id: string;
      name: string;
    };
  };
}

export interface Consultation {
  id: string;
  leadId: string;
  userId?: string;
  scheduledAt: string;
  status: 'SCHEDULED' | 'COMPLETED' | 'NO_SHOW' | 'CANCELLED';
  notes?: string;
  meetingLink?: string;
  createdAt: string;
  lead: {
    id: string;
    name: string;
    phone: string;
    wellnessGoal?: string;
    status: LeadStatus;
    city?: string;
  };
  user?: {
    id: string;
    name: string;
    avatar?: string;
  };
}

export interface WhatsappTemplate {
  id: string;
  name: string;
  category: string;
  bodyTemplate: string;
  isActive: boolean;
}

export interface AiCallCampaign {
  id: string;
  name: string;
  callingHours: string;
  status: string;
  totalQueued: number;
  totalCalled: number;
  script?: AiCallScript;
  _count?: {
    results: number;
  };
}

export interface AiCallScript {
  id: string;
  name: string;
  language: string;
  greeting: string;
  qualificationQuestions: string;
  objectionHandling: string;
  closing: string;
}

export interface AiCallResult {
  id: string;
  campaignId: string;
  leadId: string;
  status: string;
  transcript?: string;
  detectedIntent?: string;
  sentiment?: string;
  durationSeconds?: number;
  calledAt?: string;
  lead: {
    id: string;
    name: string;
    phone: string;
    wellnessGoal?: string;
    status: LeadStatus;
    city?: string;
  };
  campaign: {
    id: string;
    name: string;
  };
}
