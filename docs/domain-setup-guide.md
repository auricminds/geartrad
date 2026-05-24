# GearTrad — Domain Setup Guide

---

## Step 1: Buy the Domain

### Recommended registrar: Namecheap
Go to **namecheap.com** → search for `geartrad.com`

- If taken, try: `geartrad.io`, `gear-trad.com`, `geartrad.gg`
- Avoid the upsells (WhoisGuard is free, skip everything else)
- Pay and complete purchase

---

## Step 2: Deploy GearTrad on Vercel

You need to host the Next.js app before connecting a domain.

### 2a. Push your code to GitHub
1. Go to **github.com** → New repository → name it `geartrad`
2. In your terminal inside the GearTrad folder:
```bash
git init
git add .
git commit -m "initial commit"
git remote add origin https://github.com/YOUR_USERNAME/geartrad.git
git push -u origin main
```

### 2b. Deploy on Vercel
1. Go to **vercel.com** → Sign up with GitHub
2. Click **Add New Project** → Import your `geartrad` repo
3. Vercel auto-detects Next.js — click **Deploy**
4. Add your environment variables before deploying:
   - Click **Environment Variables** and add:
     ```
     NEXT_PUBLIC_SUPABASE_URL        = (from Supabase → Settings → API)
     NEXT_PUBLIC_SUPABASE_ANON_KEY   = (from Supabase → Settings → API)
     SUPABASE_SERVICE_ROLE_KEY       = (from Supabase → Settings → API)
     NEXT_PUBLIC_SITE_URL            = https://geartrad.com
     ```
5. Click **Deploy** — Vercel gives you a `.vercel.app` URL to test

---

## Step 3: Connect Your Domain to Vercel

1. In Vercel → your project → **Settings** → **Domains**
2. Type `geartrad.com` → click **Add**
3. Also add `www.geartrad.com` → Vercel will redirect www → root automatically
4. Vercel shows you two DNS records to add — copy them

---

## Step 4: Point Your Domain at Vercel (via Namecheap)

1. Go to **namecheap.com** → Dashboard → your domain → **Manage** → **Advanced DNS**
2. Delete any existing A records and CNAME records
3. Add the records Vercel gave you. It will be one of these two options:

**Option A — Vercel gives you an A record:**
| Type | Host | Value |
|------|------|-------|
| A    | @    | 76.76.21.21 |
| CNAME | www | cname.vercel-dns.com |

**Option B — Vercel gives you a CNAME:**
| Type  | Host | Value |
|-------|------|-------|
| CNAME | @    | cname.vercel-dns.com |
| CNAME | www  | cname.vercel-dns.com |

4. Save. DNS propagation takes **10 minutes to 48 hours** (usually under 1 hour)
5. Go back to Vercel → Domains — it will show a green checkmark when live

---

## Step 5: Update Supabase Auth Settings

Supabase blocks auth from unknown URLs by default.

1. Go to **Supabase Dashboard** → your project → **Authentication** → **URL Configuration**
2. Set **Site URL** to: `https://geartrad.com`
3. Under **Redirect URLs**, add:
   ```
   https://geartrad.com/**
   https://www.geartrad.com/**
   ```
4. Save

---

## Step 6: Update Supabase CORS (if needed)

1. **Supabase** → **Settings** → **API**
2. Under **Allowed origins**, add `https://geartrad.com`

---

## Step 7: Verify Everything Works

- [ ] `https://geartrad.com` loads the homepage
- [ ] `https://www.geartrad.com` redirects to `https://geartrad.com`
- [ ] Sign up / sign in works
- [ ] SSL padlock shows in browser (Vercel handles this automatically)

---

## Costs Summary

| Item | Cost |
|------|------|
| Domain (Namecheap) | ~$10–15/year |
| Hosting (Vercel) | Free (Hobby plan) |
| Supabase | Free (up to 500MB, 50k users) |
| **Total** | **~$10–15/year** |

Vercel free tier is enough to launch. Upgrade only when you have consistent traffic.
