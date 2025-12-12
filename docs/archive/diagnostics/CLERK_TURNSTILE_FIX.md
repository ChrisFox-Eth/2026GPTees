# Fix: Clerk Sign-Up Hanging (Cloudflare Turnstile Issue)

## 🚨 The Problem

Your sign-up page is hanging because **Cloudflare Turnstile** (bot protection) is timing out with error `300030`.

From your logs:
```
[Cloudflare Turnstile] Error: 300030.
Turnstile Widget seem to have hung: mcj02
```

This is a Clerk security feature that's blocking legitimate sign-ups.

## ✅ The Solution

You need to **disable Turnstile** in your Clerk Dashboard (or configure it properly).

### Option 1: Disable Turnstile (Recommended for Development)

1. Go to https://dashboard.clerk.com
2. Select your GPTees application
3. Navigate to **User & Authentication** → **Attack Protection**
4. Find **Bot Protection** or **Turnstile** settings
5. **Disable** or set to **Invisible mode**
6. Save changes

### Option 2: Configure Turnstile Properly (For Production)

If you want to keep bot protection:

1. Go to Clerk Dashboard → **Attack Protection**
2. Change Turnstile mode from **Managed** to **Invisible**
3. Or add your domain to the allowlist
4. Save changes

## 📝 Code Changes Made

I've already updated your frontend code to use the new Clerk redirect props:

### Files Updated:
1. `frontend/src/main.tsx` - Changed `afterSignInUrl` → `signInFallbackRedirectUrl`
2. `frontend/src/pages/SignUpPage.tsx` - Changed `redirectUrl` → `fallbackRedirectUrl`
3. `frontend/src/pages/SignInPage.tsx` - Changed `redirectUrl` → `fallbackRedirectUrl`

These changes fix the deprecation warnings you were seeing.

## 🚀 Deploy Frontend Changes

```bash
cd frontend
git add .
git commit -m "Fix: Update Clerk redirect props and prepare for Turnstile fix"
git push origin main
```

Vercel will auto-deploy.

## 🧪 Testing After Fix

1. **Disable Turnstile in Clerk Dashboard** (see Option 1 above)
2. Wait 1-2 minutes for Clerk to propagate changes
3. Clear browser cache or use incognito mode
4. Go to https://www.gptees.app/sign-up
5. Try signing up with email/password or Google SSO
6. Should redirect to /shop immediately after sign-up

## 🔍 Alternative: Check Clerk Instance Settings

If Turnstile settings aren't visible:

1. Clerk Dashboard → **Settings** → **General**
2. Check if you're on the correct instance (Development vs Production)
3. Make sure you're using the correct publishable key

## 📊 Verify It's Working

After disabling Turnstile, check browser console:
- ✅ No more "Turnstile Widget seem to have hung" errors
- ✅ No more "Error: 300030" messages
- ✅ Sign-up completes successfully
- ✅ Redirects to /shop

## 🆘 If Still Hanging

### Check 1: Clerk Instance
Make sure your frontend is using the correct Clerk publishable key:
```bash
# In frontend/.env
VITE_CLERK_PUBLISHABLE_KEY=pk_test_...  # Should match Clerk dashboard
```

### Check 2: Domain Configuration
In Clerk Dashboard → **Domains**:
- Add `www.gptees.app` to allowed domains
- Add `gptees.app` to allowed domains

### Check 3: Clear Clerk Cache
```javascript
// In browser console on gptees.app
localStorage.clear();
sessionStorage.clear();
// Then refresh page
```

### Check 4: Test on accounts.gptees.app
If sign-up works on `accounts.gptees.app` but not `www.gptees.app`:
- This confirms it's a domain/Turnstile issue
- Follow Option 1 above to disable Turnstile

## 📞 Quick Commands

```bash
# Deploy frontend
cd frontend
git add .
git commit -m "Fix: Clerk redirect props"
git push origin main

# Check if frontend deployed
curl -I https://www.gptees.app

# Test sign-up endpoint
curl https://www.gptees.app/sign-up
```

## ⏱️ Expected Timeline

- **Disable Turnstile**: 2 minutes
- **Frontend deploy**: 2-3 minutes (Vercel)
- **Clerk propagation**: 1-2 minutes
- **Total**: ~5-7 minutes

## 🎯 Success Criteria

After completing all steps:
- ✅ No Turnstile errors in console
- ✅ Sign-up completes in < 5 seconds
- ✅ Redirects to /shop after sign-up
- ✅ User appears in Clerk dashboard
- ✅ User syncs to Supabase (via webhook)

---

**Priority**: 🚨 CRITICAL - This is blocking all sign-ups!

**Next**: After sign-ups work, configure the Clerk webhook to sync users to Supabase (see `IMMEDIATE_ACTIONS.md`)
