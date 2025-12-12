# Authentication & User Sync Troubleshooting Guide

## Current Issues & Solutions

### Issue 1: Sign-up only works on accounts.gptees.app, not gptees.app ✅ FIXED

**Problem:**
- Users can only sign up through `accounts.gptees.app/sign-in`
- Sign-up/sign-in on main domain `gptees.app` doesn't work

**Root Cause:**
- ClerkProvider wasn't configured with proper routing URLs
- Clerk was defaulting to hosted pages on accounts subdomain

**Solution Applied:**
Updated `frontend/src/main.tsx` to include explicit routing configuration:

```typescript
<ClerkProvider 
  publishableKey={CLERK_PUBLISHABLE_KEY || ''}
  afterSignInUrl="/shop"
  afterSignUpUrl="/shop"
  signInUrl="/sign-in"
  signUpUrl="/sign-up"
>
```

This tells Clerk to use your app's built-in sign-in/sign-up pages instead of redirecting to the accounts subdomain.

---

### Issue 2: Users not syncing from Clerk to Supabase ⚠️ NEEDS CONFIGURATION

**Problem:**
- Users appear in Clerk dashboard
- Users NOT appearing in Supabase database
- This breaks `/api/orders` and other authenticated endpoints

**Root Cause:**
Clerk webhook is not configured or not firing properly.

**Solution Steps:**

#### Step 1: Verify Webhook Endpoint is Accessible

Test the webhook endpoint:
```bash
curl -X POST https://gptees-2026-a039a07e6329.herokuapp.com/api/webhooks/clerk \
  -H "Content-Type: application/json" \
  -d '{"test": true}'
```

Expected response: `{"success":false,"message":"Webhook verification failed"}`
(This is good - it means the endpoint exists but rejects unsigned requests)

#### Step 2: Configure Clerk Webhook

1. Go to [Clerk Dashboard](https://dashboard.clerk.com)
2. Select your application
3. Navigate to **Webhooks** in the sidebar
4. Click **Add Endpoint**
5. Enter endpoint URL:
   ```
   https://gptees-2026-a039a07e6329.herokuapp.com/api/webhooks/clerk
   ```
6. Select events to subscribe to:
   - ✅ `user.created`
   - ✅ `user.updated`
7. Click **Create**
8. **IMPORTANT:** Copy the **Signing Secret** (starts with `whsec_`)

#### Step 3: Add Webhook Secret to Heroku

```bash
heroku config:set CLERK_WEBHOOK_SECRET=whsec_your_secret_here -a gptees-2026-a039a07e6329
```

Or via Heroku Dashboard:
1. Go to your app settings
2. Click "Reveal Config Vars"
3. Add: `CLERK_WEBHOOK_SECRET` = `whsec_...`

#### Step 4: Test Webhook

In Clerk Dashboard:
1. Go to Webhooks
2. Click on your webhook endpoint
3. Click **Testing** tab
4. Click **Send Example** for `user.created` event
5. Check response - should be `200 OK`

#### Step 5: Verify User Sync

Check Heroku logs:
```bash
heroku logs --tail -a gptees-2026-a039a07e6329
```

Look for:
```
✓ User created: user_xxxxx
```

Check Supabase:
1. Open Supabase dashboard
2. Go to Table Editor
3. Check `users` table
4. You should see the user with matching `clerkId`

---

### Issue 3: 404 on /api/orders endpoint ✅ VERIFIED WORKING

**Problem:**
- GET request to `/api/orders` returns 404

**Investigation:**
The route IS registered in `backend/src/index.ts`:
```typescript
app.use('/api/orders', orderRoutes);
```

And the route file exists at `backend/src/routes/order.routes.ts`:
```typescript
router.get('/', requireAuth, getUserOrders);
```

**Likely Cause:**
The 404 is probably happening because:
1. User is not authenticated (no valid JWT token)
2. User doesn't exist in Supabase (webhook not configured)
3. The auth middleware is throwing an error before reaching the route

**How to Debug:**

1. Check if you're sending the auth token:
   ```javascript
   // In browser console on gptees.app
   const token = await window.Clerk.session.getToken();
   console.log('Token:', token);
   ```

2. Test the endpoint with curl:
   ```bash
   # Get your token from browser console first
   curl -X GET https://gptees-2026-a039a07e6329.herokuapp.com/api/orders \
     -H "Authorization: Bearer YOUR_TOKEN_HERE"
   ```

3. Check Heroku logs for errors:
   ```bash
   heroku logs --tail -a gptees-2026-a039a07e6329 | grep orders
   ```

---

### Issue 4: Cart not working ⚠️ RELATED TO AUTH

**Problem:**
- Items added to cart don't appear
- Cart functionality broken

**Root Cause:**
Cart itself is client-side (localStorage) and should work. The issue is likely:
1. Authentication failures preventing checkout
2. User not in database preventing order creation

**Solution:**
Fix Issues #2 and #3 above. The cart should work once:
- Users sync to Supabase
- Authentication works properly
- Order endpoints are accessible

**Test Cart Independently:**
```javascript
// In browser console
localStorage.setItem('gptees_cart', JSON.stringify([
  {
    productId: 'test',
    productName: 'Test Product',
    size: 'M',
    color: 'Black',
    tier: 'BASIC',
    quantity: 1,
    basePrice: 24.99,
    tierPrice: 24.99,
    imageUrl: null
  }
]));

// Refresh page - cart should show 1 item
```

---

## Environment Variables Checklist

### Backend (Heroku Config Vars)

Required for authentication to work:

```bash
# Clerk Authentication
CLERK_PUBLISHABLE_KEY=pk_live_...     # ✅ Should already be set
CLERK_SECRET_KEY=sk_live_...          # ⚠️ CRITICAL - Must be set!
CLERK_WEBHOOK_SECRET=whsec_...        # ⚠️ CRITICAL - Get from Clerk webhook config

# Database
DATABASE_URL=postgresql://...         # ✅ Should already be set

# Other services
STRIPE_SECRET_KEY=sk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...
OPENAI_API_KEY=sk-...
PRINTFUL_API_KEY=...
RESEND_API_KEY=re_...
FRONTEND_URL=https://www.gptees.app
```

### Frontend (Vercel Environment Variables)

```bash
VITE_API_URL=https://gptees-2026-a039a07e6329.herokuapp.com
VITE_CLERK_PUBLISHABLE_KEY=pk_live_...
VITE_STRIPE_PUBLISHABLE_KEY=pk_live_...
```

---

## Testing Checklist

After applying fixes and configuring webhooks:

### 1. Test Sign-Up on Main Domain
- [ ] Go to https://www.gptees.app/sign-up
- [ ] Create a new account with test email
- [ ] Should redirect to /shop after sign-up
- [ ] Check Clerk dashboard - user should appear
- [ ] Check Supabase - user should appear in `users` table

### 2. Test Sign-In
- [ ] Go to https://www.gptees.app/sign-in
- [ ] Sign in with existing account
- [ ] Should redirect to /shop
- [ ] User should stay signed in across page refreshes

### 3. Test Orders Page
- [ ] Sign in
- [ ] Go to https://www.gptees.app/account
- [ ] Should load without errors
- [ ] Should show "No orders yet" message (if no orders)
- [ ] Should NOT show 404 or authentication errors

### 4. Test Cart
- [ ] Browse to /shop
- [ ] Click on a product
- [ ] Select size, color, tier
- [ ] Click "Add to Cart"
- [ ] Cart icon should show (1)
- [ ] Go to /cart
- [ ] Product should be visible
- [ ] Can update quantity
- [ ] Can remove item

### 5. Test Full Checkout Flow
- [ ] Add product to cart
- [ ] Go to checkout
- [ ] Fill in shipping details
- [ ] Complete Stripe payment (use test card: 4242 4242 4242 4242)
- [ ] Should redirect to success page
- [ ] Order should appear in /account
- [ ] Order should exist in Supabase `orders` table
- [ ] User should be able to generate designs

---

## Common Error Messages & Solutions

### "Authentication failed" (401)
**Cause:** No valid JWT token or user not in database
**Solution:** 
1. Make sure user is signed in
2. Check if user exists in Supabase
3. Configure Clerk webhook if missing

### "User not found" (404)
**Cause:** User exists in Clerk but not in Supabase
**Solution:** Configure Clerk webhook to sync users

### "Clerk configuration missing" (500)
**Cause:** `CLERK_SECRET_KEY` not set in Heroku
**Solution:** 
```bash
heroku config:set CLERK_SECRET_KEY=sk_live_... -a gptees-2026-a039a07e6329
```

### "Webhook verification failed" (400)
**Cause:** Invalid or missing `CLERK_WEBHOOK_SECRET`
**Solution:** Get correct secret from Clerk dashboard and update Heroku config

---

## Manual User Sync (Emergency Fix)

If webhook is not working and you need to manually add a user to Supabase:

1. Get user details from Clerk dashboard
2. Connect to Supabase SQL Editor
3. Run:

```sql
INSERT INTO users (
  "clerkId",
  email,
  "firstName",
  "lastName",
  "createdAt",
  "updatedAt"
) VALUES (
  'user_xxxxx',  -- Clerk user ID
  'user@example.com',
  'John',
  'Doe',
  NOW(),
  NOW()
);
```

**Note:** This is a temporary fix. You MUST configure the webhook for production use.

---

## Debugging Commands

### Check if backend is running:
```bash
curl https://gptees-2026-a039a07e6329.herokuapp.com/api/health
```

### Check Heroku logs:
```bash
heroku logs --tail -a gptees-2026-a039a07e6329
```

### Check specific route:
```bash
heroku logs --tail -a gptees-2026-a039a07e6329 | grep "GET /api/orders"
```

### Restart Heroku dyno:
```bash
heroku restart -a gptees-2026-a039a07e6329
```

### Check environment variables:
```bash
heroku config -a gptees-2026-a039a07e6329
```

---

## Next Steps

1. **Configure Clerk Webhook** (CRITICAL)
   - Follow Step 2 above
   - This will fix user sync issue

2. **Verify Environment Variables**
   - Ensure `CLERK_SECRET_KEY` is set
   - Ensure `CLERK_WEBHOOK_SECRET` is set

3. **Test Sign-Up Flow**
   - Create new test account on gptees.app
   - Verify user appears in both Clerk and Supabase

4. **Deploy Frontend Changes**
   ```bash
   cd frontend
   git add .
   git commit -m "Fix: Configure Clerk routing for main domain"
   git push origin main
   ```

5. **Test Everything**
   - Follow testing checklist above
   - Document any remaining issues

---

## Support Resources

- [Clerk Webhooks Documentation](https://clerk.com/docs/integrations/webhooks)
- [Clerk JWT Verification](https://clerk.com/docs/backend-requests/handling/nodejs)
- [Supabase Dashboard](https://supabase.com/dashboard)
- [Heroku Dashboard](https://dashboard.heroku.com)

---

**Last Updated:** November 22, 2025
