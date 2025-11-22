# Immediate Actions Required

## 🚨 Critical Issues to Fix Now

### 1. Configure Clerk Webhook (5 minutes) - **MOST IMPORTANT**

This is why users aren't syncing to Supabase!

**Steps:**
1. Go to https://dashboard.clerk.com
2. Select your 2026GPTees application
3. Click **Webhooks** in sidebar
4. Click **Add Endpoint**
5. Enter URL: `https://gptees-2026-a039a07e6329.herokuapp.com/api/webhooks/clerk`
6. Select events:
   - ✅ `user.created`
   - ✅ `user.updated`
7. Click **Create**
8. **Copy the Signing Secret** (starts with `whsec_`)
9. Add to Heroku:
   ```bash
   heroku config:set CLERK_WEBHOOK_SECRET=whsec_YOUR_SECRET -a gptees-2026-a039a07e6329
   ```

### 2. Verify CLERK_SECRET_KEY in Heroku (1 minute)

Check if it's set:
```bash
heroku config:get CLERK_SECRET_KEY -a gptees-2026-a039a07e6329
```

If empty, set it:
```bash
heroku config:set CLERK_SECRET_KEY=sk_live_YOUR_KEY -a gptees-2026-a039a07e6329
```

Get the key from: https://dashboard.clerk.com → API Keys

### 3. Deploy Frontend Changes (2 minutes)

```bash
cd frontend
git add src/main.tsx
git commit -m "Fix: Configure Clerk routing for main domain sign-in/sign-up"
git push origin main
```

This will auto-deploy to Vercel.

### 4. Test the Webhook (2 minutes)

After configuring webhook in Clerk:

1. In Clerk Dashboard → Webhooks → Your endpoint
2. Click **Testing** tab
3. Click **Send Example** for `user.created`
4. Should get 200 OK response
5. Check Heroku logs:
   ```bash
   heroku logs --tail -a gptees-2026-a039a07e6329
   ```
6. Look for: `✓ User created: user_xxxxx`

### 5. Create Test User (1 minute)

1. Go to https://www.gptees.app/sign-up (after frontend deploys)
2. Create new account with test email
3. Should redirect to /shop
4. Check Supabase → users table → user should appear!

---

## ✅ What We Fixed Today

1. **Clerk Authentication Middleware** - Updated to use modern JWT verification
2. **Frontend Routing** - Configured ClerkProvider to use app's sign-in/sign-up pages
3. **Placeholder Images** - Fixed broken image URLs
4. **API Calls** - Removed deprecated sessionId parameter

---

## 🔍 Why Things Are Broken Right Now

### Issue: Users not in Supabase
**Cause:** Clerk webhook not configured
**Impact:** 
- `/api/orders` returns 404 (user not found in DB)
- Cart checkout fails
- Account page breaks
- Design generation fails

**Fix:** Configure webhook (Step 1 above)

### Issue: Sign-up only works on accounts subdomain
**Cause:** ClerkProvider not configured with routing
**Impact:** Users confused, can't sign up on main site
**Fix:** ✅ FIXED - Deploy frontend changes (Step 3 above)

---

## 📋 Testing Checklist (After Fixes)

Do these in order:

- [ ] Webhook configured in Clerk
- [ ] CLERK_WEBHOOK_SECRET set in Heroku
- [ ] CLERK_SECRET_KEY verified in Heroku
- [ ] Frontend deployed to Vercel
- [ ] Test webhook with example event (should get 200 OK)
- [ ] Create new test user on gptees.app/sign-up
- [ ] Verify user appears in Supabase users table
- [ ] Sign in with test user
- [ ] Go to /account page (should load, show "No orders yet")
- [ ] Add product to cart
- [ ] View cart (product should appear)
- [ ] Test checkout flow

---

## 🆘 If Something Goes Wrong

### Webhook test fails (400 error)
- Check CLERK_WEBHOOK_SECRET is correct
- Make sure you copied the FULL secret including `whsec_` prefix
- Restart Heroku: `heroku restart -a gptees-2026-a039a07e6329`

### User still not in Supabase after sign-up
- Check Heroku logs for webhook errors
- Manually test webhook from Clerk dashboard
- Check DATABASE_URL is correct in Heroku config

### Still getting 404 on /api/orders
- Make sure user exists in Supabase first
- Check you're signed in (token in Authorization header)
- Check Heroku logs for actual error

### Frontend not deploying
- Check Vercel dashboard for build errors
- Make sure you pushed to correct branch (main)
- Check environment variables in Vercel

---

## 📞 Quick Commands Reference

```bash
# Check Heroku config
heroku config -a gptees-2026-a039a07e6329

# Watch Heroku logs
heroku logs --tail -a gptees-2026-a039a07e6329

# Restart Heroku
heroku restart -a gptees-2026-a039a07e6329

# Test health endpoint
curl https://gptees-2026-a039a07e6329.herokuapp.com/api/health

# Test webhook endpoint (should fail with 400 - that's good!)
curl -X POST https://gptees-2026-a039a07e6329.herokuapp.com/api/webhooks/clerk \
  -H "Content-Type: application/json" \
  -d '{"test": true}'
```

---

## 🎯 Expected Results

After completing all steps above:

1. ✅ Users can sign up on www.gptees.app/sign-up
2. ✅ Users automatically sync to Supabase
3. ✅ /api/orders returns orders (or empty array)
4. ✅ Cart works end-to-end
5. ✅ Checkout creates orders
6. ✅ Design generation works

---

**Time to complete:** ~15 minutes
**Difficulty:** Easy (mostly configuration)
**Priority:** 🚨 CRITICAL - Nothing works without this!

See `TROUBLESHOOTING_AUTH.md` for detailed debugging steps.
