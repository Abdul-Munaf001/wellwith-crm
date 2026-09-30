export type UserRole = 'owner' | 'manager' | 'closer' | 'viewer';

export interface UserProfile {
  id: string;
  name: string;
  phone: string;
  role: UserRole;
  active: boolean;
  avatar?: string;
  email?: string;
}

export type LeadScore = 'Hot' | 'Warm' | 'Cold';

export type LeadStage =
  | 'New'
  | 'Contacted'
  | 'Qualified'
  | 'Offer sent'
  | 'Ordered'
  | 'Delivered/Visited'
  | 'Reorder due';

export interface Lead {
  id: string;
  created_at: string;
  name: string;
  phone_raw: string;
  phone_clean: string;
  valid: boolean;
  source: string;
  campaign_id?: string;
  campaign_name?: string;
  coupon_code?: string;
  concern: string;
  area: string;
  first_contact_at?: string;
  response_time_sec?: number;
  call_attempts: number;
  call_outcome?: string;
  lead_score: LeadScore;
  stage: LeadStage;
  product_interest?: string;
  owner_id?: string;
  owner_name?: string;
  next_followup_at?: string;
  opt_in: boolean;
  dnd: boolean;
  escalated: boolean;
  escalation_reason?: string;
  notes?: string;
  is_test: boolean;
}

export type PackType = 'single' | '2-pack' | '4-pack';
export type ChannelType = 'Call' | 'WhatsApp' | 'Store';

export interface Order {
  id: string;
  lead_id: string;
  lead_name?: string;
  lead_phone?: string;
  order_date: string;
  product: string;
  pack: PackType;
  amount: number;
  coupon_code?: string;
  channel: ChannelType;
  payment_status: 'paid' | 'pending' | 'failed';
  delivery_status: 'pending' | 'dispatched' | 'delivered';
  reorder_due_date: string;
  created_at?: string;
}

export interface CallLog {
  id: string;
  lead_id: string;
  attempt_no: number;
  called_at: string;
  duration_sec: number;
  outcome: string; // 'Answered - Interested', 'Answered - Not Interested', 'No Answer', 'Busy', 'Callback Requested', 'Escalated Medical'
  score_given?: LeadScore;
  transcript_url?: string;
  recording_url?: string;
  transcript_text?: string;
  escalated: boolean;
}

export interface Message {
  id: string;
  lead_id: string;
  direction: 'inbound' | 'outbound';
  template?: string;
  content: string;
  sent_at: string;
  status: 'sent' | 'delivered' | 'read' | 'replied';
}

export interface Activity {
  id: string;
  lead_id: string;
  lead_name?: string;
  user_id?: string;
  user_name?: string;
  type: 'stage change' | 'note' | 'call' | 'assignment';
  detail: string;
  created_at: string;
}

export interface Campaign {
  id: string;
  name: string;
  source: string;
  coupon_code?: string;
  active: boolean;
  spend: number;
  meta_leads: number;
}

export interface Product {
  id: string;
  name: string;
  sku: string;
  price: number;
  margin: number;
  category: string;
  description: string;
}
