# Deployment Notes — GearTrad & AuricMinds

## SITUATION — Two Vercel Accounts

The Vercel CLI is currently logged into **auic-lub-s-projects**.
The GearTrad project lives on **auricminds-6199s-projects** (different account).

AuricMinds deployed OK (created as a new project under auic-lub-s-projects).
GearTrad cannot deploy until you re-login to the correct account.

---

## AuricMinds — Already Deployed

- **New project URL:** `auricminds-website-r0bkq56bb-auic-lub-s-projects.vercel.app`
- Project ID: `prj_VFG5GpqWeNOnFg3FVypHfdSKL2kB`
- **Action needed:** Go to Vercel dashboard → `auicminds.com` domain → point it to this new project

---

## GearTrad — Vercel CLI Re-login (do this when CLI is logged into wrong account)

```bash
vercel login
```
Choose **auricminds-6199s-projects** account, then:

```bash
cd /Users/osamahussein/Desktop/Work/Products/GearTrad
npx vercel --prod
```

---

## Pending Changes (deployed in code, not yet pushed)

### Banner
- Banner image is now fully visible — no text on top of it
- Text (title, subtitle, CTA buttons) appears **below** the carousel
- Mobile: `aspect-[4/3]` | Desktop: `aspect-[16/7]` — no more cutting

### Sign-up
- Age field added between email and password
- Validates 13–100, rejects outside range
- Saved to user metadata (visible in Supabase Auth → Users)

---

## Email Not Going to Junk — Fix

### 1 — Supabase Custom SMTP
Supabase → project → **Settings → Auth → SMTP Settings**

| Field | Value |
|---|---|
| Host | `smtp.resend.com` |
| Port | `465` |
| Username | `resend` |
| Password | your Resend API key (`re_xxx`) |
| From Email | `noreply@geartrad.com` |
| From Name | `GearTrad` |

### 2 — Update DMARC DNS Record

Change from `p=none` → `p=quarantine`:

```
Type:  TXT
Name:  _dmarc
Value: v=DMARC1; p=quarantine; rua=mailto:osama@auricminds.com
```

---

## Vercel Environment Variables (set in Vercel dashboard)

| Variable | Value |
|---|---|
| `RESEND_API_KEY` | `re_xxx...` (from resend.com) |
| `ADMIN_EMAIL` | `osama@auricminds.com` |
| `RESEND_FROM_EMAIL` | `GearTrad <noreply@geartrad.com>` |
| `SUPABASE_SERVICE_ROLE_KEY` | from Supabase → Settings → API |
