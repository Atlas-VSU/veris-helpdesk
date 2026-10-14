# VERIS Helpdesk

A ticketing system for VERIS clients (subscribers and students) to submit support requests, track their status, and get replies from VERIS admins — with an admin dashboard for managing incoming tickets.

**Scope note:** This project's feature list was deliberately trimmed to a Core MVP after team lead feedback ("keep it simple," "don't over-engineer"). The bar for v1 is: clients can **submit** a ticket, **track** its status, and **receive replies**. Anything beyond that lives in the Post-MVP backlog — see [Feature Scope](#feature-scope) below.

---

## Tech Stack

- **Framework**: Next.js (App Router), TypeScript
- **Styling**: Tailwind CSS
- **Icons**: Lucide React
- **Backend / Database**: Supabase (Postgres, Auth, Storage, Edge Functions)
- **Email**: Gmail SMTP via `nodemailer` (OTP codes today; ticket confirmations and admin notifications are planned)
- **Forms & Validation**: React Hook Form + Zod (schemas live in `features/<domain>/schemas/`, see [Repository Architecture](#repository-architecture))
- **Migrations**: Supabase CLI (migration-first workflow — see [Database Setup](#database-setup))

---

## Repository Architecture

```text
app/                              # Next.js App Router (Routes & Layouts)
├── (public)/                     # Client-facing routes (route group)
│   ├── page.tsx                  # Landing page
│   ├── privacy/                  # Privacy Policy
│   ├── submit-ticket/            # Submit Ticket Form
│   ├── verify/                   # Email Verification (OTP)
│   └── tickets/                  # My Tickets Dashboard
│       └── [ticketNumber]/       # Single ticket view
├── admin/
│   ├── login/                    # Admin Login
│   └── (protected)/              # Auth-gated admin routes (route group)
│       ├── dashboard/            # Admin Dashboard (stats, notifications inbox)
│       ├── tickets/              # Tickets Management (search, filter, table)
│       │   └── [ticketNumber]/   # Admin Ticket Workspace (thread, reply, status)
│       ├── clients/              # Client records
│       ├── categories/           # Ticket categories
│       └── admins/               # Admin account management
├── api/
│   ├── admin/
│   │   ├── login/                # Admin login endpoint (Zod-validated)
│   │   └── logout/               # Admin logout (clears the admin_session cookie)
│   └── otp/
│       ├── request/              # Email a 6-digit code
│       └── verify/               # Check the code, set the client_session cookie
├── layout.tsx
components/
└── ui/                            # Shared UI primitives (button, card, ...)
features/                          # Feature-scoped logic, grouped by domain
├── landing/                       # components/, data/, types/ for the landing page
├── shared/                        # Navbar, footer, navigation items
├── submit-ticket/                 # Ticket form components, hook, and submit action
├── tickets/
│   └── schemas/                   # Zod schemas — create ticket, OTP request/verify
├── admin/
│   ├── components/                # Admin sidebar
│   └── schemas/                   # Zod schemas — admin login
└── admin-tickets/                 # Tickets Management screen (table, filters, pagination)
lib/
├── supabase-server.ts             # Supabase service-role client (server-side only)
├── rate-limit.ts                  # Upstash rate-limit settings (login, ticket submit, OTP)
├── client-token.ts                # Makes and checks the client_session token
├── client-auth.ts                 # getClientEmail() — who is this client? (server side)
├── otp.ts                         # OTP settings, code generation, hashing
├── otp-email.ts                   # Sends the OTP email (Gmail SMTP)
└── utils.ts
proxy.ts                           # Applies the rate limits to ticket-submit and OTP routes
docs/
├── openapi.yaml                   # API contract — source of truth for endpoints
└── pr-description-prompt.md       # AI prompt for drafting PR descriptions
types/
├── database.ts                    # Shared DB row types
└── supabase.ts                    # Supabase table types
supabase/
├── config.toml
└── migrations/                    # Versioned schema migrations (source of truth for DB)
```

**Convention:** feature-specific logic (validation schemas, and eventually feature-scoped components/hooks) lives under `features/<domain>/`, following the pattern already established by `features/landing/`. Shared, non-feature-specific code (Supabase clients, generic utilities) stays in `lib/`.

---

## Feature Scope

### Core MVP

**Client-facing**

- Landing page (nav, hero, submit/track CTAs, expected response time, footer)
- Submit Ticket Form (name, email, user type, service, subject, description, priority, attachment, consent, CAPTCHA)
- Email Verification (OTP) to access "My Tickets"
- Submission Confirmation (ticket number, summary, next actions)
- My Tickets Dashboard (status filter, search, ticket cards)

**Admin-facing**

- Admin Login
- Admin Dashboard (ticket totals, urgent count, status breakdown, recent tickets, **notifications inbox**)
- Tickets Management (search, status filter, table, pagination)
- Admin Ticket Workspace (conversation thread, reply-to-client with auto-email, attach file to reply, change status/priority, resolve/request-info actions)

**Backend**

- DB schema (see [Database Setup](#database-setup))
- Ticket number generator
- Client OTP verification, Admin login, session timeout, route auth middleware, rate limiting
- Server-side validation (fields, email format, CAPTCHA, attachment type/size)
- Create ticket endpoint, attachment upload handler, Supabase Storage integration
- Ticket confirmation email (Gmail SMTP)
- Get/list/filter/search tickets, update status, override priority, change category, close/reopen
- Client + admin reply endpoints, auto-email on admin reply
- Notifications: insert on new ticket + client reply, list/mark-read/delete endpoints, admin notification email (Gmail SMTP)
- Input validation middleware, centralized error handling

### Post-MVP (explicitly deferred)

Categories CRUD, activity log (table + panel), admin roles / role-based access, admin account management UI, admin password reset (custom-built), admin login lockout (custom-built), internal notes, assign/reassign admin, merge duplicate tickets, sort tickets, status-change email, client profile card, CSV/PDF export, scheduled DB backup, data retention rules automation.

> Rationale: these were cut to match leads' "submit / track / reply, keep it simple" guidance. Most rely on Supabase's built-in tooling in the meantime (e.g. Supabase Auth covers password reset and login lockout; Supabase itself handles automated backups on paid tiers).

---

## API Contract

`docs/openapi.yaml` is the source of truth for endpoint URLs, request bodies, responses, cookies, and error codes. **Read it before building or calling an endpoint.** If you change an endpoint, update the file in the same PR, and check it with:

```bash
npx @redocly/cli lint docs/openapi.yaml
```

Ticket submission is a server action (`features/submit-ticket/actions.ts`), not an HTTP endpoint, so it is not in that file.

---

## Authentication & Sessions

Clients have no accounts. They prove they own an email with a one-time code, and admins log in with a password. Each gets a cookie. Both cookies are signed with `JWT_SECRET` and are `httpOnly` (and `secure` in production).

| Cookie | Who | Set by | Lasts | Token holds |
| --- | --- | --- | --- | --- |
| `client_session` | Clients | `POST /api/otp/verify` (after a correct code) | 2 hours | `{ email, role: "client" }` |
| `admin_session` | Admins | `POST /api/admin/login` (cleared by `POST /api/admin/logout`) | 24 hours | `{ adminId, email }` |

**Client OTP flow**

1. `POST /api/otp/request` — makes a 6-digit code, stores it hashed in `otp_verifications`, and emails it. The code expires in 10 minutes, and a new one can be requested every 60 seconds. The answer is always the same message, whether or not the email has tickets, so nobody can use it to find out which emails have tickets. A code is only emailed if the email has at least one ticket.
2. `POST /api/otp/verify` — checks the code. A code works once, and 5 wrong tries lock it. A correct code sets the `client_session` cookie.
3. Client routes read the cookie on the server with `getClientEmail()` from `lib/client-auth.ts`. It returns the email in lowercase, or `null` (the route then answers `401`).

**Emails are saved in lowercase** (the Zod schemas trim and lowercase them), so `John@Mail.com` and `john@mail.com` are the same person.

**Rate limits** (Upstash, per IP): login 5 per minute, ticket submission 5 per hour, OTP code requests 5 per 5 minutes, and OTP verification 10 per 5 minutes. They are set in `lib/rate-limit.ts`. Login is limited in its route; OTP request and verification use independent quotas enforced only in `proxy.ts`. The OTP resend wait and five wrong attempts per code are separate checks required by the API contract.

In production, login and OTP return a JSON `500` before processing the request if Upstash credentials are missing, Redis fails, or the rate-limit check times out. Exceeding a working quota returns `429`. Development can run without Redis; ticket submissions retain their existing fallback when Redis is unavailable.

---

## Database Setup

Schema lives in `supabase/migrations/` — **not** the dashboard SQL editor. Always add new schema changes as a migration file first, then push, so migration history stays in sync with the repo (a past feature hit painful schema drift doing it dashboard-first — don't repeat that).

### Tables

| Table               | Purpose                                                              |
| ------------------- | -------------------------------------------------------------------- |
| `admins`            | Flat admin accounts (no roles for MVP)                               |
| `tickets`           | Core ticket record — submitter info, issue details, priority, status |
| `messages`          | Conversation thread — client and admin replies                       |
| `attachments`       | Files linked to a ticket or a specific message                       |
| `otp_verifications` | Hashed email OTP codes + wrong-try counter (`attempts`) for the "My Tickets" access flow |
| `notifications`     | Admin dashboard inbox — new ticket / client reply events             |

### Enums

`user_type` (subscriber, student) · `ticket_status` (new, open, in_progress, waiting_for_client, resolved, closed) · `priority_level` (low, medium, high, urgent) · `message_sender` (client, admin)

### Workflow

```bash
supabase login
supabase link --project-ref <your-project-ref>
supabase migration new <migration_name>
# edit the generated .sql file in supabase/migrations/
supabase db push --dry-run   # lists what would run, changes nothing
supabase db push
```

- Never edit a migration that is already on `dev`. Add a new file instead.
- Run `supabase db push --dry-run` first. It should list **only your new file**.
- If it says remote migration versions are missing from your folder, `git pull` the latest `dev` first. Don't run `supabase migration repair` or `supabase db pull` without asking the PM.

### Known open items

- **RLS policies are not yet written.** Tables are open by default — this must be done before any real data touches the project.
- **Notification insert hooks** still need to be wired into the create-ticket and client-reply endpoints — the `notifications` table exists but nothing writes to it yet.
- **Attachment restriction**: images (jpg, png) and PDFs only, 10MB max per file — enforced in the upload handler, not the database.

---

## Run Locally

### Prerequisites

- Node.js (v18+ recommended)
- npm
- Supabase CLI (`npm install supabase --save-dev`)

### Setup Steps

1. **Install dependencies**:

```bash
   npm install
```

2. **Configure environment variables**:
   Create `.env.local` with the names below (if a `.env.example` exists, copy it instead), then fill in the values shared in the team's Discord/Messenger group. **Never put a real value in the README, and never commit `.env.local`.**

```text
   SUPABASE_URL=
   SUPABASE_SECRET_KEY=           # service-role key, server only
   JWT_SECRET=                    # signs the client_session and admin_session cookies
   UPSTASH_REDIS_REST_URL=        # required in production for login and OTP
   UPSTASH_REDIS_REST_TOKEN=
   GMAIL_USER=                    # sender account for OTP emails
   GMAIL_APP_PASSWORD=            # a Google "app password", not the account password
```

   > Env vars change frequently as new features are added (Gmail app password, JWT secret, etc.) — always check the group for the latest values rather than relying on old ones you may have saved locally.

   Use the REST URL and token from the project's Upstash Redis database. The token needs write access for rate limiting. Set both variables in `.env.local` and in the deployment's production environment, then restart or redeploy. Verify the connection with `node scripts/check-upstash.cjs`; it uses a separate expiring test key and does not consume login or OTP quotas.

   Without the two Gmail variables the OTP email is not sent. In development the code is also printed in the terminal that runs `npm run dev`, so you can still test the flow.

3. **Run the development server**:

```bash
   npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

4. **Verify code quality**:

```bash
   npm run lint
   npm run build
```

### Testing the OTP flow locally

1. Create a ticket with an email you can read (the OTP only sends a code to emails that have a ticket).
2. `POST /api/otp/request` with `{ "email": "..." }`. The code appears in the `npm run dev` terminal (and in the inbox if Gmail is set up).
3. `POST /api/otp/verify` with `{ "email": "...", "code": "123456" }`. A correct code returns `200` and a `set-cookie: client_session=...` header.

If the Upstash variables are set, OTP code requests are limited to 5 per 5 minutes per IP and verification to 10 per 5 minutes per IP, with independent counters. A generic `429` means that endpoint's IP quota is exhausted; `OTP_LOCKED` means the code's five wrong attempts were used.

---

## Notes for Contributors

- This is a **team learning project** — first time several of us are working in these roles, PM included. Ask questions early rather than guessing on scope; if something feels like it might be over-engineering, flag it before building.
- Stick to Core MVP unless a lead has explicitly signed off on adding something (see the notifications inbox in this README's Core MVP section as an example of a feature added _after_ lead review, not before).
- Emails are sent from server code, not from Supabase Edge Functions. OTP emails use Gmail SMTP in `lib/otp-email.ts` — check that file before building another email, and reuse its approach unless the team decides otherwise.
