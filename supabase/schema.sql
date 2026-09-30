-- ==============================================================================
-- WELLWITH CRM - SUPABASE SCHEMA & SECURITY CONFIGURATION
-- ==============================================================================
-- Stack: Supabase (Postgres, Auth, Row Level Security, Realtime)
-- Recommended Region: ap-south-1 (Mumbai, India) for low latency across retail stores

-- 1. EXTENSIONS
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 2. ENUMS & DOMAINS
DO $$ BEGIN
    CREATE TYPE user_role AS ENUM ('owner', 'manager', 'closer', 'viewer');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE lead_score_type AS ENUM ('Hot', 'Warm', 'Cold');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE lead_stage_type AS ENUM (
        'New', 'Contacted', 'Qualified', 'Offer sent', 'Ordered', 'Delivered/Visited', 'Reorder due'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE pack_type AS ENUM ('single', '2-pack', '4-pack');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE channel_type AS ENUM ('Call', 'WhatsApp', 'Store');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE message_status_type AS ENUM ('sent', 'delivered', 'read', 'replied');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE activity_type AS ENUM ('stage change', 'note', 'call', 'assignment');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- 3. TABLES DEFINITION

-- 3.1 PROFILES (Linked to auth.users)
CREATE TABLE IF NOT EXISTS profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    phone TEXT,
    role user_role NOT NULL DEFAULT 'closer',
    active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 3.2 CAMPAIGNS
CREATE TABLE IF NOT EXISTS campaigns (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    source TEXT NOT NULL,
    coupon_code TEXT,
    active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 3.3 LEADS
CREATE TABLE IF NOT EXISTS leads (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    name TEXT NOT NULL,
    phone_raw TEXT NOT NULL,
    phone_clean TEXT UNIQUE,
    valid BOOLEAN NOT NULL DEFAULT TRUE,
    source TEXT NOT NULL DEFAULT 'Meta Instant Form',
    campaign_id UUID REFERENCES campaigns(id) ON DELETE SET NULL,
    coupon_code TEXT,
    concern TEXT,
    area TEXT,
    first_contact_at TIMESTAMPTZ,
    response_time_sec INTEGER,
    call_attempts INTEGER NOT NULL DEFAULT 0,
    call_outcome TEXT,
    lead_score lead_score_type NOT NULL DEFAULT 'Warm',
    stage lead_stage_type NOT NULL DEFAULT 'New',
    product_interest TEXT,
    owner_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
    next_followup_at TIMESTAMPTZ,
    opt_in BOOLEAN NOT NULL DEFAULT TRUE,
    dnd BOOLEAN NOT NULL DEFAULT FALSE,
    escalated BOOLEAN NOT NULL DEFAULT FALSE,
    notes TEXT,
    is_test BOOLEAN NOT NULL DEFAULT FALSE,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 3.4 PRODUCTS
CREATE TABLE IF NOT EXISTS products (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    sku TEXT UNIQUE NOT NULL,
    price NUMERIC(10, 2) NOT NULL,
    margin NUMERIC(5, 2) NOT NULL DEFAULT 0.0,
    active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 3.5 ORDERS
CREATE TABLE IF NOT EXISTS orders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    lead_id UUID NOT NULL REFERENCES leads(id) ON DELETE CASCADE,
    order_date DATE NOT NULL DEFAULT CURRENT_DATE,
    product TEXT NOT NULL,
    pack pack_type NOT NULL DEFAULT 'single',
    amount NUMERIC(10, 2) NOT NULL,
    coupon_code TEXT,
    channel channel_type NOT NULL DEFAULT 'Store',
    payment_status TEXT NOT NULL DEFAULT 'paid',
    delivery_status TEXT NOT NULL DEFAULT 'delivered',
    reorder_due_date DATE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 3.6 CALL_LOG
CREATE TABLE IF NOT EXISTS call_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    lead_id UUID NOT NULL REFERENCES leads(id) ON DELETE CASCADE,
    attempt_no INTEGER NOT NULL DEFAULT 1,
    called_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    duration_sec INTEGER NOT NULL DEFAULT 0,
    outcome TEXT NOT NULL,
    score_given lead_score_type,
    transcript_url TEXT,
    recording_url TEXT,
    escalated BOOLEAN NOT NULL DEFAULT FALSE
);

-- 3.7 MESSAGES
CREATE TABLE IF NOT EXISTS messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    lead_id UUID NOT NULL REFERENCES leads(id) ON DELETE CASCADE,
    direction TEXT NOT NULL CHECK (direction IN ('inbound', 'outbound')),
    template TEXT,
    content TEXT,
    sent_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    status message_status_type NOT NULL DEFAULT 'sent'
);

-- 3.8 ACTIVITIES (Audit trail)
CREATE TABLE IF NOT EXISTS activities (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    lead_id UUID NOT NULL REFERENCES leads(id) ON DELETE CASCADE,
    user_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
    type activity_type NOT NULL,
    detail TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 3.9 AD_SPEND
CREATE TABLE IF NOT EXISTS ad_spend (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    date DATE NOT NULL,
    campaign_id UUID NOT NULL REFERENCES campaigns(id) ON DELETE CASCADE,
    spend NUMERIC(10, 2) NOT NULL,
    meta_leads INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 4. DATABASE TRIGGERS & PROCEDURES

-- 4.1 Trigger: Sanitize phone, check validity, and compute response time
CREATE OR REPLACE FUNCTION trg_leads_sanitize_and_timing()
RETURNS TRIGGER AS $$
DECLARE
    digits TEXT;
BEGIN
    -- Strip non-digit characters
    digits := regexp_replace(COALESCE(NEW.phone_raw, ''), '[^0-9]', '', 'g');
    
    -- Normalize Indian numbers (10 digits -> +91XXXXXXXXXX; 12 digits starting with 91 -> +91XXXXXXXXXX)
    IF length(digits) = 10 THEN
        NEW.phone_clean := '+91' || digits;
        NEW.valid := TRUE;
    ELSIF length(digits) = 12 AND digits LIKE '91%' THEN
        NEW.phone_clean := '+' || digits;
        NEW.valid := TRUE;
    ELSIF length(digits) = 11 AND digits LIKE '0%' THEN
        NEW.phone_clean := '+91' || substring(digits from 2);
        NEW.valid := TRUE;
    ELSE
        NEW.phone_clean := digits;
        NEW.valid := FALSE;
    END IF;

    -- Compute response time in seconds if first_contact_at is provided
    IF NEW.first_contact_at IS NOT NULL AND NEW.created_at IS NOT NULL THEN
        NEW.response_time_sec := ROUND(EXTRACT(EPOCH FROM (NEW.first_contact_at - NEW.created_at)));
    END IF;

    NEW.updated_at := timezone('utc'::text, now());
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_leads_sanitize ON leads;
CREATE TRIGGER trg_leads_sanitize
BEFORE INSERT OR UPDATE OF phone_raw, first_contact_at ON leads
FOR EACH ROW
EXECUTE FUNCTION trg_leads_sanitize_and_timing();

-- 4.2 Trigger: Set reorder_due_date = order_date + 25 days on Order insert/update
CREATE OR REPLACE FUNCTION trg_orders_set_reorder_due()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.reorder_due_date IS NULL AND NEW.order_date IS NOT NULL THEN
        NEW.reorder_due_date := NEW.order_date + INTERVAL '25 days';
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_orders_reorder ON orders;
CREATE TRIGGER trg_orders_reorder
BEFORE INSERT OR UPDATE OF order_date ON orders
FOR EACH ROW
EXECUTE FUNCTION trg_orders_set_reorder_due();

-- 4.3 Trigger: Audit trail logger to activities whenever stage or owner changes
CREATE OR REPLACE FUNCTION trg_leads_audit_activity()
RETURNS TRIGGER AS $$
BEGIN
    -- Detect stage change
    IF (OLD.stage IS DISTINCT FROM NEW.stage) THEN
        INSERT INTO activities (lead_id, user_id, type, detail, created_at)
        VALUES (
            NEW.id,
            auth.uid(),
            'stage change',
            format('Stage changed from "%s" to "%s"', OLD.stage, NEW.stage),
            timezone('utc'::text, now())
        );
    END IF;

    -- Detect owner assignment change
    IF (OLD.owner_id IS DISTINCT FROM NEW.owner_id) THEN
        INSERT INTO activities (lead_id, user_id, type, detail, created_at)
        VALUES (
            NEW.id,
            auth.uid(),
            'assignment',
            format('Lead assigned to user %s', COALESCE(NEW.owner_id::text, 'Unassigned')),
            timezone('utc'::text, now())
        );
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_leads_audit ON leads;
CREATE TRIGGER trg_leads_audit
AFTER UPDATE OF stage, owner_id ON leads
FOR EACH ROW
EXECUTE FUNCTION trg_leads_audit_activity();

-- 5. ANALYTICAL DATABASE VIEWS

-- 5.1 Daily Funnel View
CREATE OR REPLACE VIEW view_daily_funnel AS
SELECT 
    created_at::date AS day,
    COUNT(*) AS total_leads,
    COUNT(*) FILTER (WHERE valid = TRUE) AS valid_leads,
    COUNT(*) FILTER (WHERE first_contact_at IS NOT NULL) AS reached_leads,
    COUNT(*) FILTER (WHERE stage IN ('Qualified', 'Offer sent', 'Ordered', 'Delivered/Visited', 'Reorder due')) AS qualified_leads,
    COUNT(*) FILTER (WHERE stage IN ('Ordered', 'Delivered/Visited', 'Reorder due')) AS ordered_leads
FROM leads
WHERE is_test = FALSE
GROUP BY created_at::date
ORDER BY day DESC;

-- 5.2 Campaign Performance View with Cost Per Order (CPO)
CREATE OR REPLACE VIEW view_campaign_performance AS
WITH c_leads AS (
    SELECT campaign_id, COUNT(*) AS leads_count
    FROM leads WHERE is_test = FALSE GROUP BY campaign_id
),
c_orders AS (
    SELECT l.campaign_id, COUNT(o.id) AS orders_count, COALESCE(SUM(o.amount), 0) AS total_revenue
    FROM orders o
    JOIN leads l ON o.lead_id = l.id
    WHERE l.is_test = FALSE
    GROUP BY l.campaign_id
),
c_spend AS (
    SELECT campaign_id, COALESCE(SUM(spend), 0) AS total_spend
    FROM ad_spend GROUP BY campaign_id
)
SELECT 
    c.id AS campaign_id,
    c.name AS campaign_name,
    c.source AS source,
    c.coupon_code AS coupon_code,
    COALESCE(cl.leads_count, 0) AS leads,
    COALESCE(co.orders_count, 0) AS orders,
    COALESCE(co.total_revenue, 0) AS revenue,
    COALESCE(cs.total_spend, 0) AS spend,
    CASE 
        WHEN COALESCE(co.orders_count, 0) > 0 THEN ROUND(cs.total_spend / co.orders_count, 2)
        ELSE cs.total_spend
    END AS cost_per_order
FROM campaigns c
LEFT JOIN c_leads cl ON c.id = cl.campaign_id
LEFT JOIN c_orders co ON c.id = co.campaign_id
LEFT JOIN c_spend cs ON c.id = cs.campaign_id;

-- 5.3 Coupon Performance View
CREATE OR REPLACE VIEW view_coupon_performance AS
SELECT 
    COALESCE(o.coupon_code, 'NO_COUPON') AS coupon_code,
    COUNT(o.id) AS total_orders,
    SUM(o.amount) AS total_revenue,
    COUNT(*) FILTER (WHERE o.channel = 'Store') AS store_orders,
    COUNT(*) FILTER (WHERE o.channel = 'WhatsApp') AS whatsapp_orders,
    COUNT(*) FILTER (WHERE o.channel = 'Call') AS call_orders
FROM orders o
JOIN leads l ON o.lead_id = l.id
WHERE l.is_test = FALSE
GROUP BY o.coupon_code;

-- 5.4 Response Time Buckets View
CREATE OR REPLACE VIEW view_response_time_buckets AS
SELECT 
    COUNT(*) FILTER (WHERE response_time_sec <= 60) AS under_60s,
    COUNT(*) FILTER (WHERE response_time_sec > 60 AND response_time_sec <= 300) AS min_1_to_5,
    COUNT(*) FILTER (WHERE response_time_sec > 300) AS over_5_min,
    ROUND(PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY response_time_sec)::numeric, 1) AS median_response_sec
FROM leads
WHERE valid = TRUE AND response_time_sec IS NOT NULL AND is_test = FALSE;

-- 5.5 Call Answer Rate by Hour of Day View
CREATE OR REPLACE VIEW view_answer_rate_by_hour AS
SELECT 
    EXTRACT(HOUR FROM called_at) AS hour_of_day,
    COUNT(*) AS total_calls,
    COUNT(*) FILTER (WHERE outcome NOT IN ('No Answer', 'Busy', 'Failed')) AS answered_calls,
    ROUND(
        (COUNT(*) FILTER (WHERE outcome NOT IN ('No Answer', 'Busy', 'Failed'))::numeric / NULLIF(COUNT(*), 0) * 100), 
        1
    ) AS answer_rate_percent
FROM call_log
GROUP BY EXTRACT(HOUR FROM called_at)
ORDER BY hour_of_day;

-- 5.6 Reorders Due in Next 7 Days View
CREATE OR REPLACE VIEW view_reorders_due AS
SELECT 
    o.id AS order_id,
    l.id AS lead_id,
    l.name AS customer_name,
    l.phone_clean AS phone,
    o.product,
    o.pack,
    o.order_date,
    o.reorder_due_date,
    (o.reorder_due_date - CURRENT_DATE) AS days_until_due,
    l.owner_id
FROM orders o
JOIN leads l ON o.lead_id = l.id
WHERE o.reorder_due_date BETWEEN CURRENT_DATE AND (CURRENT_DATE + INTERVAL '7 days')
  AND l.dnd = FALSE
  AND l.opt_in = TRUE
ORDER BY o.reorder_due_date ASC;

-- 6. ROW LEVEL SECURITY (RLS) POLICIES

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE call_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE ad_spend ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;

-- Helper function to fetch current user's role from profiles
CREATE OR REPLACE FUNCTION get_current_user_role()
RETURNS user_role AS $$
    SELECT role FROM profiles WHERE id = auth.uid() LIMIT 1;
$$ LANGUAGE sql STABLE SECURITY DEFINER;

-- Profiles: Users can view all active profiles, owners can update
CREATE POLICY "View active profiles" ON profiles FOR SELECT USING (active = true);
CREATE POLICY "Owner manage profiles" ON profiles FOR ALL USING (get_current_user_role() = 'owner');

-- Leads Policies:
-- Owner & Manager can see all leads
CREATE POLICY "Owner and Manager select all leads" ON leads FOR SELECT 
USING (get_current_user_role() IN ('owner', 'manager'));

-- Closers see only assigned leads OR unassigned Hot/New queue leads
CREATE POLICY "Closer select assigned or hot leads" ON leads FOR SELECT 
USING (
    get_current_user_role() = 'closer' AND (
        owner_id = auth.uid() OR owner_id IS NULL OR lead_score = 'Hot' OR stage = 'New'
    )
);

-- Viewers can see non-test leads
CREATE POLICY "Viewer select leads" ON leads FOR SELECT 
USING (get_current_user_role() = 'viewer' AND is_test = FALSE);

-- Closers can update their assigned leads or claim unassigned
CREATE POLICY "Closer update assigned leads" ON leads FOR UPDATE 
USING (
    get_current_user_role() IN ('owner', 'manager') OR (
        get_current_user_role() = 'closer' AND (owner_id = auth.uid() OR owner_id IS NULL)
    )
);

-- Prevent Closers and Viewers from deleting leads
CREATE POLICY "Owner and Manager delete leads" ON leads FOR DELETE 
USING (get_current_user_role() IN ('owner', 'manager'));

-- Orders Policies:
CREATE POLICY "All authenticated users view orders" ON orders FOR SELECT USING (true);
CREATE POLICY "Staff insert orders" ON orders FOR INSERT WITH CHECK (
    get_current_user_role() IN ('owner', 'manager', 'closer')
);

-- Realtime publication enablement for Hot Lead Queue
ALTER PUBLICATION supabase_realtime ADD TABLE leads;
ALTER PUBLICATION supabase_realtime ADD TABLE orders;
