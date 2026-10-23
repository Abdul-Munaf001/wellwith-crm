# 🌿 WELLWITH CRM — End-to-End Lead Management System for Wellness Brands

A complete, production-quality, multi-workspace CRM designed specifically for **WELLWITH** and modern wellness brands running Meta, Google, and social ad campaigns for weight loss, diabetes reversal, yoga, PCOS, and nutrition programs.

Built with a calm, premium wellness aesthetic (clean white, deep forest greens, and mint accents) and backed by a real database, server-side RBAC, automated speed-to-lead scoring, and an internal AI telecalling module.

---

## 🌟 Architecture & Tech Stack

| Layer | Technology | Key Details |
|---|---|---|
| **Frontend** | React 18 + TypeScript + Vite | Tailwind CSS, Lucide Icons, Recharts, React Router v6, TanStack Query |
| **Backend** | Node.js + Express + TypeScript | Strict RBAC middleware, Zod validation, JWT authentication, Bcrypt password hashing |
| **Database** | Prisma ORM + SQLite (local) / PostgreSQL ready | Complete schema with 23 tables, foreign keys, indexes, and full relational integrity |
| **Security** | Server-side Query Scoping | Multi-workspace tenant isolation and telecaller row-level query scoping on every API endpoint |

---

## 👥 Demo Logins & Access Roles

All demo accounts use the standard password: `Password123!`

| Role | Email | Password | Permissions & Scope |
|---|---|---|---|
| **Super Admin (Owner)** | `admin@wellwith.com` | `Password123!` | Sees ALL leads across ALL workspaces, team activity, ad spend/ROAS, full AI Telecalling module, workspace switcher, and "View as User" simulation. |
| **Team Member / Telecaller** | `sai@wellwith.com` | `Password123!` | Sees **ONLY** leads assigned to Sai (18 leads). Cannot view other telecallers' leads, ad spend, or admin settings. Has access to Today's Focus queue. |
| **Team Member / Telecaller** | `shashi@wellwith.com` | `Password123!` | Sees **ONLY** leads assigned to Shashi. Strict server-side data isolation. |
| **Client Admin (Brand Client)** | `client@demo.com` | `Password123!` | Assigned to **Zenith Wellness Studio** workspace. Sees only Zenith leads, team, and local campaigns. Zero access to WELLWITH HQ leads or AI Telecalling. |

*(Quick 1-click login pills are provided directly on the login screen for instantaneous testing!)*

---

## 🚀 Quick Start & Local Setup

### 1. Prerequisites
- **Node.js**: v18+ (tested on Node v24)
- **npm**: v9+

### 2. Installation
Clone the repository and install dependencies:
```bash
# From project root
npm run start
```
Or run separately:
```bash
# 1. Install & seed backend
cd server
npm install
npx prisma db push
npm run seed

# 2. Run RBAC Verification Test Suite
npm test

# 3. Start Server (serves both API on port 5000 and built frontend)
npm run dev
```

If developing the frontend with Vite hot-reload (HMR):
```bash
# In a separate terminal
cd client
npm install
npm run dev
# Frontend runs on http://localhost:5173 with automatic proxy to http://localhost:5000/api
```

---

## 🧪 RBAC & Data Isolation Test Suite

To execute the automated verification test proving server-side role enforcement and multi-workspace isolation:
```bash
cd server
npm test
```

### Verified Test Checklist:
- [x] **Test 1: Super Admin global visibility** — Admin retrieves all 60+ leads across both WELLWITH HQ and Zenith Client workspaces.
- [x] **Test 2: Telecaller (Sai) query scoping** — Sai retrieves strictly 18 assigned leads (`assignedToId = sai.id`). 100% of returned leads belong exclusively to Sai.
- [x] **Test 2B: Direct URL query bypass prevention** — Direct `GET /api/leads/:id` for another user's lead returns `404 Not Found` for Sai.
- [x] **Test 3: Multi-Workspace isolation** — Client Admin (`client@demo.com`) can only query leads belonging to `Zenith Wellness Studio` workspace. Zero data leakage from WELLWITH HQ.
- [x] **Test 4: AI Telecalling protection** — AI Telecalling endpoint returns `200 OK` for Super Admin when feature flag is ON, and strictly `403 Forbidden` for Telecaller Sai and Client Admin.
- [x] **Test 5: Webhook Lead Ingestion** — Meta/Google Lead webhook correctly ingests new leads and detects duplicates via phone normalization.

---

## 💡 Unique Wellness CRM Features

1. **Wellness Journey Pipeline**:
   Stages designed specifically for health transformations:
   `New Enquiry` &rarr; `Contacted` &rarr; `Wellness Assessment Done` &rarr; `Consultation Booked` &rarr; `Trial/Demo Attended` &rarr; `Program Enrolled` &rarr; `Active Member` &rarr; `Renewal Due` &rarr; `Lost`
2. **Lead Heat Score (0–100)**:
   Auto-calculated from source quality, stage progression, call outcomes, response speed, budget readiness, and recency. Displayed as a colored flame badge on tables and Kanban cards.
3. **Today's Focus (Smart Call Queue)**:
   Algorithmic priority queue for telecallers with a 1-click **"Start Next Call Now"** button. Telecallers never have to manually choose who to dial next.
4. **Speed-to-Lead Timer**:
   Tracks elapsed response time for new enquiries with color thresholds (Green &le;15m, Amber &le;60m, Red &gt;60m). Admin sees average response times per telecaller.
5. **Wellness Intake Mini-Form**:
   In-call assessment capture (sleep hours, stress level, dietary habits, exercise, medical flags). Completing intake awards a +10 Heat Score bonus and creates a shareable summary.
6. **Smart Program Matching & Talking Points**:
   System analyzes the lead's wellness goal (e.g. Weight Loss, Diabetes Care, PCOS, Gut Health) and automatically generates suggested program pricing and bulleted doctor-approved talking points for the caller.
7. **WhatsApp Quick Templates**:
   1-click prefilled message generator with dynamic variable insertion (`{{name}}`, `{{goal}}`, `{{preferred_time}}`, `{{program}}`) that opens direct `wa.me` links and logs message history.
8. **Doctor & Nutrition Consultation Booking**:
   Schedule 1-on-1 discovery calls with Google Meet links, reminder tags, and attendance/no-show tracking.
9. **Retention & Renewal Tracker**:
   Tracks active memberships, automatically highlights programs expiring in &le; 7 days, and maintains a "Win-Back" opportunity list for lapsed members.
10. **Best Time to Call Insights Heatmap**:
    Visual weekday &times; hour matrix showing historical connect/answer rates so telecallers schedule calls during peak windows.
11. **Team Leaderboard with Streaks**:
    Friendly gamification badges (calling streaks, top closers, connect rates) visible on the dashboard and team activity drill-down.
12. **AI Telecalling Module (Maya AI)**:
    Super Admin internal module behind the per-workspace `ai_telecalling_enabled` feature flag. Includes campaign builder, script manager, call queue, and simulated test runner that updates lead status and generates conversational transcripts.
13. **Dark Mode Toggle**:
    Green-on-dark theme variant with persistent toggle.

---

## 🔗 Meta & Google Lead Ads Webhook Setup

WELLWITH CRM provides a secure lead intake endpoint with unique workspace secret tokens:

### Endpoint:
```http
POST /api/campaigns/webhooks/leads/:workspaceSecretToken
```

### Headers:
```http
Content-Type: application/json
```

### Payload Structure:
```json
{
  "name": "Pooja Hegde",
  "phone": "+919820011223",
  "email": "pooja.hegde@gmail.com",
  "wellness_goal": "Weight Loss",
  "city": "Mumbai",
  "source": "Meta",
  "utm_campaign": "wl_reset_q4",
  "ad_name": "Video_DrPooja_BeforeAfter_30Day"
}
```

### Responses:
- **`201 Created`**: Lead ingested, phone normalized to +91, heat score calculated, and initial activity logged.
- **`200 OK`**: Duplicate phone detected; logs repeat ad engagement on existing lead timeline without creating redundant rows.
- **`403 Forbidden`**: Invalid or missing workspace secret token.

---

## 📁 Project Structure

```
wellwith-crm/
├── server/                      # Node.js + Express Backend
│   ├── prisma/
│   │   ├── schema.prisma        # Complete 23-table Prisma schema
│   │   └── seed.ts              # 60+ realistic wellness leads & 5 users seed
│   ├── src/
│   │   ├── middleware/auth.ts   # Strict JWT & RBAC query scoping
│   │   ├── routes/              # Modular REST routes (leads, calls, etc.)
│   │   ├── utils/crm-helpers.ts # Normalization, heat score, program matcher
│   │   └── index.ts             # Server entry point & static SPA host
│   └── test/
│       └── rbac.test.ts         # Automated security & RBAC verification
├── client/                      # React + Vite + TypeScript Frontend
│   ├── src/
│   │   ├── api/client.ts        # Typed API client with auto-injected headers
│   │   ├── context/             # AuthContext & ThemeContext
│   │   ├── components/          # Sidebar, Navbar, LeadDetailModal, AppLayout
│   │   ├── pages/               # Dashboard, Leads, FocusQueue, Renewals, etc.
│   │   └── types/crm.ts         # TypeScript definitions
│   └── tailwind.config.js       # Calm green & wellness design system
└── README.md                    # System documentation & setup guide
```

---

## 🛡️ Security & Privacy
- **Password Protection**: Passwords hashed with bcrypt (salt rounds = 10).
- **JWT Expiration**: 7-day signed JWT tokens with user id, email, role, and workspaceId.
- **Strict Server Scoping**: Telecallers can **never** query other users' leads, even by manually passing lead IDs in direct REST calls.
- **Client Workspace Isolation**: Client Admins can **never** access leads or campaigns outside their assigned workspace.
- **Feature Flags**: Critical internal tools (such as AI Telecalling) are blocked on the server by default for clients unless explicitly enabled.
