# Gambling Platform — Full Project Specification

**Purpose of this document:** a complete build plan you can hand to a developer (or follow yourselves) to build a fully functional, non-templated, security-hardened gambling platform. Every page, every section, every column, and every button is listed with what it does and where it links. No placeholders — every element maps to a real backend endpoint.

---

## 0. Design System (so nothing looks "AI-generated")

Lock these down in a single `design-tokens.css` / theme file before building any screen. Every page pulls from this — no inline one-off styling.

### 0.1 Typography
- **Display / headings:** Space Grotesk or Archivo Expanded (self-hosted, not Google Fonts CDN — avoids the "default template" look)
- **Body:** Inter is fine for body copy only (not headings) — or General Sans
- **Numbers (balances, odds, stats):** JetBrains Mono or IBM Plex Mono with `font-variant-numeric: tabular-nums` — this alone makes it read as a financial product
- Type scale: 12 / 14 / 16 / 20 / 24 / 32 / 48px — nothing else. No arbitrary sizes.

### 0.2 Color System
- Base surfaces (dark theme): `#0B0D10` (page bg) → `#12151A` (card) → `#1A1E24` (raised card/modal) — three flat layers, no blur
- Text: `#F2F3F5` primary, `#9AA1AC` secondary, `#5B6270` disabled
- Functional colors only:
  - Win/positive: `#1FB177` (green)
  - Loss/negative: `#E5484D` (red)
  - Accent/CTA: `#E8A33D` (amber/gold — used sparingly, VIP + primary buttons only)
  - Info: `#3B82C4`
- **No gradients except one**: a subtle 2-stop gradient reserved only for VIP/premium badges — everywhere else flat color.

### 0.3 Shape & Elevation
- Border radius: 4px (buttons/inputs), 6px (cards) — max. Never above 8px anywhere.
- Elevation via `1px solid rgba(255,255,255,0.08)` border + `0 2px 8px rgba(0,0,0,0.4)` shadow. No `backdrop-filter: blur()` anywhere in the codebase — this is the single biggest "glassmorphism/AI slop" tell, ban it at the lint level.
- Buttons: solid fills, sharp state changes (not floaty hover-lift). Primary button = solid amber, filled. Secondary = 1px border, transparent fill. Destructive = solid red.

### 0.4 Motion
- Number count-up animation on balance/win changes (150–300ms ease-out)
- Button press = scale(0.98) + darken, 80ms — snappy, not springy
- No parallax, no floating blobs, no hover-lift shadows growing on cards

### 0.5 Iconography
- One consistent icon set, weight-matched to the type (e.g., Phosphor Icons "duotone" or a custom-cut set) — never mix icon libraries, never use default Font Awesome look.

---

## 1. Site Map (Player-Facing)

```
/                          Home / Lobby
/games/[slug]              Individual game page
/wallet                    Wallet (deposit/withdraw/history)
/account                   Account settings
/account/security          2FA, sessions, devices
/account/limits            Responsible gambling controls
/account/verification      KYC upload & status
/history                   Full bet history
/vip                       VIP/Loyalty program
/leaderboard               Tournaments & leaderboards
/promotions                Active promotions/bonuses
/fairness/[roundId]        Provably fair verification page
/support                   Help center / live chat
/legal/terms, /legal/privacy, /legal/responsible-gambling
/login, /register, /forgot-password, /reset-password/[token]
```

## 1.1 Site Map (Admin/Operator-Facing — separate subdomain, e.g. admin.site.com)

```
/admin/dashboard           Real-time KPI overview
/admin/users               User management
/admin/users/[id]          Individual user deep-dive
/admin/transactions        Full transaction ledger
/admin/games               Game configuration
/admin/risk                Risk & fraud queue
/admin/withdrawals         Manual withdrawal review queue
/admin/promotions          Promotion/bonus CMS
/admin/affiliates          Affiliate/referral management
/admin/audit-log           Immutable action log
/admin/reports             GGR/RTP/financial reports
/admin/staff               Staff roles & permissions
```

---

## 2. Page-by-Page Breakdown

### 2.1 Home / Lobby (`/`)

**Header (sticky, present on every page):**
| Element | Purpose | Links to / Action |
|---|---|---|
| Logo | Brand anchor | → `/` |
| Nav: Casino / Live / Promotions / VIP | Category navigation | → respective category pages |
| Search bar | Filter games by name (debounced, hits `GET /api/games/search?q=`) | Live results dropdown |
| Balance display (tabular-nums, click to expand) | Shows real-time balance | Click → opens Wallet quick-panel (dropdown, not new page) |
| Deposit button (primary/amber) | Fast path to funding | → `/wallet?tab=deposit` |
| Notifications bell | Shows unread system messages (bonus credited, withdrawal approved, etc.) | Dropdown, marks read via `PATCH /api/notifications/:id/read` |
| Avatar/profile menu | Account access | Dropdown: Account / Security / Verification / Logout |

**Section: Live Activity Ticker**
- Horizontal scrolling feed: `username (masked), game, bet amount, win/loss, multiplier`
- Real-time via WebSocket (`ws://.../live-feed`), falls back to polling every 5s if WS fails
- Purpose: social proof + transparency. Click a row → opens that round's fairness verification (`/fairness/[roundId]`)

**Section: Game Grid**
- Filter chips: All / Slots / Table Games / Live / Originals (dice, crash, etc.)
- Each game card: thumbnail, name, current RTP badge, "Play" button (real button → `/games/[slug]`, not a dead card)
- Sort dropdown: Popular / New / RTP High-Low — hits `GET /api/games?sort=`

**Section: VIP Progress Bar** (only visible when logged in)
- Shows current tier icon, XP progress to next tier, "View Benefits" button → `/vip`

**Section: Active Promotions carousel**
- Each card: promo title, terms summary, countdown timer, "Claim" button → `POST /api/promotions/:id/claim`, disabled/greyed if ineligible with tooltip explaining why (real logic, not decorative)

**Footer:**
| Column | Contents |
|---|---|
| Company | About, Careers, License number + regulator logo (linked to license verification page on regulator's site) |
| Support | Help Center, Live Chat trigger, Contact, Responsible Gambling |
| Legal | Terms, Privacy Policy, AML Policy, Cookie Policy |
| Community | Affiliate Program (→ `/affiliates`), Leaderboard, VIP |
| Payment method icons | Static, purely informational (list accepted deposit rails) |

---

### 2.2 Game Page (`/games/[slug]`)

**Left panel — Bet controls:**
- Bet amount input (with quick-multiply buttons: ½, 2x, Max — each is a real handler, not decorative)
- Currency/token selector (if multi-currency)
- Game-specific parameters (e.g., for dice: target number slider; for crash: auto-cashout input)
- "Bet" button → `POST /api/games/:slug/bet` (server validates balance, applies house edge, returns round result)
- Auto-bet toggle: number of rounds, stop-on-win/loss conditions — all persisted server-side so refresh doesn't lose config

**Center — Game canvas**
- Renders the actual game outcome animation, driven by the server-authoritative result (never client-side RNG)

**Right panel — Round history (this game only)**
- Table columns: `Round ID | Bet Amount | Multiplier | Payout | Time | Fairness ✓`
- "Fairness ✓" is a clickable icon → `/fairness/[roundId]`

**Bottom — Provably Fair widget**
- Shows: current server seed hash (pre-committed), client seed (editable by user), nonce counter
- "Rotate Seed" button → `POST /api/fairness/rotate-seed`
- "How this works" expandable → static explainer

---

### 2.3 Wallet (`/wallet`)

Tabs: **Deposit | Withdraw | History**

**Deposit tab:**
- Payment method selector (cards as real radio-button components, not decorative icons)
- Amount input with preset chips ($20/$50/$100/$500)
- "Deposit" button → `POST /api/wallet/deposit` → redirects to payment provider or shows crypto address + QR
- Deposit limit indicator (shows daily/weekly limit if user has set one under Responsible Gambling)

**Withdraw tab:**
- Available balance shown (withdrawable vs. locked-in-bonus-wagering, shown separately — real distinction, not cosmetic)
- Amount input
- Destination (saved payout methods, "Add new" → verification flow)
- "Request Withdrawal" button → `POST /api/wallet/withdraw` → creates a pending record, triggers admin review queue if above threshold
- Status column showing Pending / Under Review / Approved / Rejected with reason

**History tab:**
- Table columns: `Date | Type (Deposit/Withdraw/Bet/Win/Bonus) | Amount | Balance After | Status | Reference ID`
- Filters: date range, type
- "Export CSV" button → `GET /api/wallet/export?format=csv` (real file generation, not stubbed)

---

### 2.4 Account Settings (`/account`)

**Section: Profile**
- Username (editable, uniqueness-checked live), Email (change requires re-verification), Country/Timezone
- "Save Changes" → `PATCH /api/account/profile`

**Section: Security** (`/account/security`)
- Password change form → `PATCH /api/account/password` (requires current password)
- 2FA setup: QR code + manual key, "Enable 2FA" → `POST /api/account/2fa/enable`, then confirmation input
- Active Sessions table: `Device | Location (IP-derived) | Last Active | [Revoke]` — Revoke button → `DELETE /api/account/sessions/:id`
- Login history table: `Date | IP | Device | Success/Failure`

**Section: Responsible Gambling** (`/account/limits`)
- Deposit limit (daily/weekly/monthly) — input + "Set Limit" button → `PUT /api/account/limits/deposit`
- Loss limit — same pattern
- Session time reminder toggle + interval
- Self-exclusion: duration selector (24h / 7d / 30d / permanent), confirmation modal, "Activate" → `POST /api/account/self-exclude` (irreversible for the chosen duration, enforced server-side on every login/bet check)

**Section: Verification (KYC)** (`/account/verification`)
- Status badge: Unverified / Pending / Verified / Rejected
- Document upload (ID front, ID back, proof of address) — real file upload → `POST /api/kyc/upload` with virus-scan + storage in encrypted bucket
- Status history log

---

### 2.5 Bet History (`/history`)
- Full table, columns: `Date/Time | Game | Bet ID | Amount Wagered | Result | Payout | Net | Fairness`
- Filters: game, date range, win/loss only
- Pagination (server-side, not client-loaded-all)
- Summary bar above table: Total Wagered / Total Won / Net P&L / RTP experienced (all computed server-side)

### 2.6 VIP Program (`/vip`)
- Tier ladder visual (Bronze → Silver → Gold → Platinum → Diamond) with XP thresholds
- Current tier benefits table: `Tier | Rakeback % | Weekly Bonus | Dedicated Support | Withdrawal Priority`
- "Claim Rakeback" button (active only when accrued rakeback > 0) → `POST /api/vip/claim-rakeback`

### 2.7 Leaderboard (`/leaderboard`)
- Tabs: Daily / Weekly / Monthly
- Table columns: `Rank | Username (masked) | Wagered | Prize`
- Countdown timer to next reset
- "Join Tournament" button if an active tournament requires opt-in → `POST /api/tournaments/:id/join`

### 2.8 Fairness Verification (`/fairness/[roundId]`)
- Shows: server seed (revealed), server seed hash (pre-committed — user can verify hash matches), client seed, nonce, resulting hash, and the resulting game outcome derived from it
- "Verify" button runs the hash computation client-side in-browser (SHA-256) and shows a green check if it matches — this is a real cryptographic proof, not a graphic

### 2.9 Support (`/support`)
- FAQ accordion (categorized: Account, Deposits, Withdrawals, Games, Responsible Gambling)
- Live chat widget (WebSocket-based, connects to support queue)
- "Submit Ticket" form → `POST /api/support/tickets`
- Ticket status tracker for logged-in users

---

## 3. Admin Dashboard — Full Detail

### 3.1 Dashboard Overview (`/admin/dashboard`)
Real-time KPI cards (auto-refresh via WebSocket):
- Active users (last 5 min)
- Total wagered (today / 7d / 30d toggle)
- GGR (Gross Gaming Revenue = total wagered − total paid out)
- NGR (Net Gaming Revenue = GGR − bonuses − withdrawal fees)
- Live RTP per game (flags red if actual RTP deviates >2% from configured target — catches bugs or exploits fast)
- Pending withdrawals count (badge, click → `/admin/withdrawals`)
- Pending KYC count (badge, click → user queue)
- New registrations (today)
- Chart: Wagered volume over time (line chart, filterable by game)

### 3.2 User Management (`/admin/users`)
Table columns: `ID | Username | Email | Registered | KYC Status | Balance | Total Wagered | Risk Score | Status (Active/Suspended/Self-excluded) | Actions`
- Search + filters (KYC status, risk score range, registration date)
- Bulk actions: export selected, flag for review

**User Detail (`/admin/users/[id]`):**
- Tabs: Overview / Transactions / Bet History / Sessions/Devices / KYC Documents / Notes / Risk Signals
- Overview: full profile, balance breakdown (withdrawable vs bonus-locked), lifetime deposit/withdraw totals
- Risk Signals tab: multi-accounting flags (shared device/IP with other accounts), unusual win-rate flags, bonus abuse pattern flags — each with evidence and a "Dismiss" or "Escalate" action
- Admin actions: Adjust balance (requires reason + 2-person approval for amounts above threshold), Suspend account, Force logout all sessions, Reset 2FA

### 3.3 Transactions Ledger (`/admin/transactions`)
Columns: `Txn ID | User | Type | Amount | Balance Before | Balance After | Timestamp | Related Round ID | Status`
- This is a read-only view of the immutable ledger — no edits possible, only new correcting entries (double-entry accounting principle)
- Filters: date, type, amount range, user
- "Export" for accounting/audit purposes

### 3.4 Game Configuration (`/admin/games`)
Table: `Game | Status (Live/Maintenance) | House Edge % | Min Bet | Max Bet | Current RTP (30d) | [Edit]`
- Edit modal: adjust house edge, bet limits, enable/disable — changes logged to audit log with admin ID + timestamp + old/new values

### 3.5 Risk & Fraud Queue (`/admin/risk`)
- Auto-generated flags list: `Flag Type | User | Severity | Detected At | Status`
- Flag types: Multi-accounting, Bonus abuse pattern, Unusual win streak, Rapid deposit-withdraw cycling (potential card testing/money laundering), Login from high-risk geography
- Each flag: "Investigate" (opens user detail with context), "Dismiss" (requires note), "Escalate to compliance"

### 3.6 Withdrawal Review Queue (`/admin/withdrawals`)
Columns: `Request ID | User | Amount | Requested At | KYC Status | Risk Score | [Approve] [Reject] [Hold for review]`
- Auto-approval below a configurable threshold if user is KYC-verified and risk score is low (configurable rule, shown transparently)
- Approve/Reject require a reason logged to audit trail

### 3.7 Promotions CMS (`/admin/promotions`)
- List of active/scheduled/expired promotions
- Create/Edit form: title, terms, bonus type (deposit match / free bet / cashback), wagering requirement multiplier, eligible games, start/end date, target segment (all users / VIP tier / new users)
- Preview button shows exactly how it'll render on the player-facing promotions page

### 3.8 Affiliate Management (`/admin/affiliates`)
Columns: `Affiliate | Referral Code | Signups | Depositing Users | Total Wagered by Referrals | Commission Owed | [Pay Out]`

### 3.9 Audit Log (`/admin/audit-log`)
- Immutable, searchable: `Timestamp | Admin/Staff | Action | Target | Old Value → New Value | IP`
- Every balance adjustment, game config change, withdrawal decision, and promotion edit appears here — no exceptions, no manual edits possible

### 3.10 Reports (`/admin/reports`)
- GGR/NGR by period, by game
- Player lifetime value report
- Regulatory report export (formatted for your friend's specific license jurisdiction's required submission format)

### 3.11 Staff & Roles (`/admin/staff`)
- Role-based access control: Super Admin / Finance / Support / Risk Analyst / Read-only Auditor
- Each role scoped to specific admin routes/actions — enforced server-side, not just hidden UI

---

## 4. Backend Architecture

### 4.1 Service Breakdown (logical separation even in a monolith)
1. **Auth Service** — registration, login, 2FA, session management, JWT issuance/refresh
2. **Wallet/Ledger Service** — the financial core (see 4.3)
3. **Game Engine Service** — RNG, provably fair seed management, round resolution
4. **Risk/Fraud Service** — background jobs scanning for flag patterns
5. **KYC Service** — document handling, verification status, integrates with a 3rd-party ID verification provider
6. **Notification Service** — email/SMS/push/in-app, event-driven
7. **Admin/Audit Service** — every privileged action logged here first, applied second

### 4.2 Database Schema (PostgreSQL)

```sql
-- Users
users (
  id UUID PRIMARY KEY,
  username VARCHAR UNIQUE NOT NULL,
  email VARCHAR UNIQUE NOT NULL,
  password_hash VARCHAR NOT NULL,
  role VARCHAR DEFAULT 'player', -- player, staff, admin
  kyc_status VARCHAR DEFAULT 'unverified',
  risk_score INT DEFAULT 0,
  status VARCHAR DEFAULT 'active', -- active, suspended, self_excluded
  self_exclusion_until TIMESTAMPTZ,
  vip_tier VARCHAR DEFAULT 'bronze',
  vip_xp BIGINT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
)

-- Ledger (double-entry, immutable, append-only)
ledger_entries (
  id BIGSERIAL PRIMARY KEY,
  user_id UUID REFERENCES users(id),
  entry_type VARCHAR NOT NULL, -- deposit, withdrawal, bet, payout, bonus, adjustment
  amount_cents BIGINT NOT NULL, -- always integer, positive or negative
  balance_after_cents BIGINT NOT NULL,
  related_round_id UUID,
  related_txn_id UUID,
  created_at TIMESTAMPTZ DEFAULT now(),
  created_by UUID -- system or admin id, for audit
)
-- NEVER UPDATE this table. Corrections = new offsetting rows.

-- Game rounds
game_rounds (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES users(id),
  game_slug VARCHAR NOT NULL,
  bet_amount_cents BIGINT NOT NULL,
  server_seed VARCHAR NOT NULL,
  server_seed_hash VARCHAR NOT NULL, -- shown to user BEFORE bet
  client_seed VARCHAR NOT NULL,
  nonce INT NOT NULL,
  outcome JSONB NOT NULL,
  payout_cents BIGINT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
)

-- Sessions/devices
sessions (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES users(id),
  device_fingerprint VARCHAR,
  ip_address INET,
  user_agent TEXT,
  refresh_token_hash VARCHAR,
  created_at TIMESTAMPTZ,
  last_active_at TIMESTAMPTZ,
  revoked_at TIMESTAMPTZ
)

-- KYC documents
kyc_documents (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES users(id),
  doc_type VARCHAR, -- id_front, id_back, proof_of_address
  storage_path VARCHAR, -- encrypted bucket path, not public
  status VARCHAR DEFAULT 'pending',
  reviewed_by UUID,
  reviewed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now()
)

-- Withdrawals (separate from ledger for workflow state)
withdrawal_requests (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES users(id),
  amount_cents BIGINT,
  destination VARCHAR,
  status VARCHAR DEFAULT 'pending', -- pending, approved, rejected, paid
  reviewed_by UUID,
  review_reason TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
)

-- Risk flags
risk_flags (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES users(id),
  flag_type VARCHAR,
  severity VARCHAR, -- low, medium, high
  evidence JSONB,
  status VARCHAR DEFAULT 'open', -- open, dismissed, escalated
  created_at TIMESTAMPTZ DEFAULT now()
)

-- Audit log (immutable)
audit_log (
  id BIGSERIAL PRIMARY KEY,
  actor_id UUID,
  action VARCHAR NOT NULL,
  target_type VARCHAR,
  target_id UUID,
  old_value JSONB,
  new_value JSONB,
  ip_address INET,
  created_at TIMESTAMPTZ DEFAULT now()
)

-- Promotions
promotions (
  id UUID PRIMARY KEY,
  title VARCHAR,
  bonus_type VARCHAR,
  wagering_multiplier NUMERIC,
  eligible_games JSONB,
  target_segment VARCHAR,
  starts_at TIMESTAMPTZ,
  ends_at TIMESTAMPTZ,
  created_by UUID
)
```

### 4.3 Wallet/Ledger Rules (critical — this is where most gambling sites get exploited)
1. Balance is **never** a single mutable field read/written directly. It's always `SUM(amount_cents) WHERE user_id = ?` from `ledger_entries`, cached in Redis for fast reads, invalidated on write.
2. Every bet placement is wrapped in a DB transaction: `BEGIN → SELECT balance FOR UPDATE → check sufficient funds → INSERT ledger entry (debit) → resolve game round → INSERT ledger entry (credit if won) → COMMIT`.
3. Idempotency keys on all deposit/withdrawal endpoints to prevent double-processing from retried requests.
4. All monetary math in integer cents. Never floats, anywhere, ever.

### 4.4 Provably Fair Algorithm
1. Server generates `server_seed` (random 256-bit), stores it, and sends the client only `SHA256(server_seed)` before the bet — this is the "commitment."
2. Client provides (or auto-generates) a `client_seed`.
3. Round outcome = `HMAC_SHA256(server_seed, client_seed + ':' + nonce)`, mapped to the game's result space (e.g., mod 100 for a dice roll).
4. After the round, server reveals `server_seed`. User (or the `/fairness` page) recomputes the hash and the outcome independently to verify it wasn't altered after the bet was placed.
5. Nonce increments per bet with the same seed pair; seed rotates on user request or automatically every N bets.

---

## 5. Security Implementation Detail

### 5.1 Rate Limiting (Redis-backed, sliding window)
| Endpoint | Limit |
|---|---|
| `POST /auth/login` | 5 attempts / 15 min per IP+username combo, then exponential backoff |
| `POST /auth/register` | 3 / hour per IP |
| `POST /games/:slug/bet` | 10 / second per user (prevents bot exploitation of game logic/latency) |
| `POST /wallet/withdraw` | 3 / day per user (soft), flagged if exceeded |
| `POST /support/tickets` | 5 / hour per user |
| Global API | 100 req / min per IP as a backstop |

Implementation: token bucket in Redis, `INCR` + `EXPIRE`, checked in middleware before hitting the route handler. Return `429` with `Retry-After` header.

### 5.2 Auth Hardening
- Argon2id for password hashing (stronger than bcrypt for this use case)
- Mandatory TOTP 2FA for any withdrawal action, optional-but-encouraged for login
- Refresh token rotation — each use invalidates the previous token, detects token replay
- Device fingerprinting (canvas + user agent + screen params hashed) stored per session, new-device login triggers email alert

### 5.3 Application Security
- Zod/Joi schema validation on every single endpoint input — reject unknown fields
- CSRF tokens on all state-changing requests (cookie-based sessions) or strict SameSite + double-submit pattern if using JWT in headers
- CSP header: no `unsafe-inline`, no wildcard script sources
- All admin routes require role check server-side (never trust frontend route guards alone)
- SQL: parameterized queries only / ORM (Prisma or Drizzle) — no raw string concatenation, ever

### 5.4 Infrastructure
- Cloudflare (or similar) in front for DDoS protection + WAF rules
- Secrets in a vault (Doppler / AWS Secrets Manager), never in `.env` committed anywhere
- DB user for the app has no `DROP`/`ALTER` privileges — migrations run under a separate privileged role
- Automated backups of the DB, tested restore process (not just "backups exist")

### 5.5 Fraud Detection (background jobs)
- Multi-accounting: nightly job clustering accounts by device fingerprint + IP + payment method fingerprint
- Bonus abuse: flags accounts with suspiciously low-variance betting patterns designed to clear wagering requirements without risk
- Rapid deposit-withdraw cycling: flags potential card testing or money laundering patterns for compliance review

### 5.6 Testing Requirements Before Launch
- Concurrency test: simulate 100 simultaneous bet requests from the same user to confirm the row-locking prevents balance exploitation
- OWASP ZAP scan against staging
- Load test the bet endpoint specifically (this is the highest-traffic, highest-risk endpoint)

---

## 6. Build Order (Recommended)

1. Database schema + migrations
2. Auth (with rate limiting from day one)
3. Ledger system + concurrency tests (do not skip the tests — this is the part that breaks in production)
4. One game end-to-end with provably fair logic
5. Wallet UI (deposit/withdraw/history)
6. Admin dashboard: user management + transactions view (read-only first)
7. Risk flags + withdrawal review workflow
8. KYC integration
9. Promotions + VIP system
10. Remaining games
11. Security testing pass + penetration test
12. Polish pass on design system consistency across every page

---

This spec is meant to be handed to a developer directly — every button listed has a named endpoint or destination, so nothing in the build should end up as a dead click or empty placeholder.
