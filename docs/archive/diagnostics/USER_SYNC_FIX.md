# Fix: Users Not Syncing from Clerk to Supabase

## 🎯 The Problem

**Users are in Clerk but NOT in Supabase**, which breaks everything:
- ❌ Can't add products to cart
- ❌ Can't checkout
- ❌ Can't view orders
- ❌ Can't generate designs

**Root Cause:** Clerk webhook is not configured, so `user.created` events never reach your backend.

## ✅ The Solution: Configure Clerk Webhook

### Step 1: Configure Webhook in Clerk Dashboard (5 minutes)

1. Go to https://dashboard.clerk.com
2. Select your **2026GPTees** application
3. Click **Webhooks** in the left sidebar
4. Click **+ Add Endpoint**

5. **Enter Endpoint URL:**
   ```
   https://gptees-2026-a039a07e6329.herokuapp.com/api/webhooks/clerk
   ```

6. **Select Events to Subscribe:**
   - ✅ `user.created`
   - ✅ `user.updated`
   
   (You can add more later, but these two are critical)

7. Click **Create**

8. **IMPORTANT:** Copy the **Signing Secret**
   - It starts with `whsec_`
   - You'll need this in the next step

### Step 2: Add Webhook Secret to Heroku (1 minute)

```bash
heroku config:set CLERK_WEBHOOK_SECRET=whsec_YOUR_SECRET_HERE -a gptees-2026
```

Replace `whsec_YOUR_SECRET_HERE` with the actual secret from Step 1.

Or via Heroku Dashboard:
1. Go to https://dashboard.heroku.com/apps/gptees-2026
2. Click **Settings** tab
3. Click **Reveal Config Vars**
4. Add new var:
   - **Key:** `CLERK_WEBHOOK_SECRET`
   - **Value:** `whsec_...` (paste the secret)
5. Click **Add**

### Step 3: Test the Webhook (2 minutes)

In Clerk Dashboard:
1. Go to **Webhooks**
2. Click on your newly created endpoint
3. Click the **Testing** tab
4. Click **Send Example** for `user.created` event
5. You should see **200 OK** response

### Step 4: Check Heroku Logs

```bash
heroku logs --tail -a gptees-2026
```

Look for:
```
✓ User created: user_xxxxxxxxxxxxx
```

If you see this, the webhook is working! 🎉

### Step 5: Manually Sync Existing User (IMPORTANT!)

Since you already signed up, you need to manually add yourself to Supabase:

**Option A: Trigger Webhook Manually**

1. In Clerk Dashboard → **Users**
2. Find your user
3. Click on the user
4. Click **...** (three dots menu)
5. Click **Trigger webhook**
6. Select `user.created`
7. Click **Send**

**Option B: SQL Insert (if Option A doesn't work)**

1. Go to Supabase Dashboard
2. Open **SQL Editor**
3. Run this query (replace with your actual values):

```sql
INSERT INTO users (
  "clerkId",
  email,
  "firstName",
  "lastName",
  "createdAt",
  "updatedAt"
) VALUES (
  'user_YOUR_CLERK_ID',  -- Get from Clerk dashboard
  'your-email@example.com',
  'Your',
  'Name',
  NOW(),
  NOW()
);
```

To get your Clerk ID:
1. Clerk Dashboard → **Users**
2. Click on your user
3. Copy the **User ID** (starts with `user_`)

### Step 6: Verify User in Supabase

1. Go to Supabase Dashboard
2. Click **Table Editor**
3. Select **users** table
4. You should see your user with the matching `clerkId`

## 🧪 Testing After Fix

### Test 1: Sign Up New User
1. Sign out of gptees.app
2. Create a NEW test account
3. Check Heroku logs - should see: `✓ User created: user_xxx`
4. Check Supabase - user should appear immediately

### Test 2: Add to Cart
1. Sign in to gptees.app
2. Go to /shop
3. Click on a product
4. Select size, color, tier
5. Click **Add to Cart**
6. Cart badge should show (1)
7. Go to /cart - product should be visible

### Test 3: View Account Page
1. While signed in, go to /account
2. Should load without errors
3. Should show "No orders yet" (if you haven't ordered)

### Test 4: Checkout Flow
1. Add product to cart
2. Go to /cart
3. Click **Proceed to Checkout**
4. Fill in shipping details
5. Should redirect to Stripe (don't complete payment yet)

## 🔍 Debugging

### Issue: Webhook Test Returns 400 Error

**Check 1: Webhook Secret**
```bash
heroku config:get CLERK_WEBHOOK_SECRET -a gptees-2026
```
Should return `whsec_...`

If empty or wrong:
```bash
heroku config:set CLERK_WEBHOOK_SECRET=whsec_CORRECT_SECRET -a gptees-2026
```

**Check 2: Heroku Logs**
```bash
heroku logs --tail -a gptees-2026 | grep webhook
```

Look for errors like:
- `CLERK_WEBHOOK_SECRET is not set` → Set the env var
- `Missing required headers` → Webhook not configured correctly in Clerk
- `Webhook verification failed` → Wrong secret

### Issue: User Still Not in Supabase After Webhook

**Check 1: Database Connection**
```bash
heroku logs --tail -a gptees-2026 | grep Database
```
Should see: `✓ Database connected successfully`

**Check 2: Prisma Schema**
Make sure `users` table exists in Supabase:
```sql
SELECT * FROM users LIMIT 1;
```

**Check 3: Manually Trigger Sync**
Use Option A or B from Step 5 above.

### Issue: Cart Still Not Working

**This means user is still not in Supabase.**

1. Verify user exists:
   ```sql
   SELECT * FROM users WHERE "clerkId" = 'user_YOUR_ID';
   ```

2. If empty, manually add user (see Step 5, Option B)

3. Sign out and sign back in

4. Try adding to cart again

## 📊 Verification Checklist

After completing all steps:

- [ ] Webhook endpoint created in Clerk
- [ ] `CLERK_WEBHOOK_SECRET` set in Heroku
- [ ] Webhook test returns 200 OK
- [ ] Heroku logs show `✓ User created`
- [ ] User appears in Supabase `users` table
- [ ] Can add products to cart
- [ ] Cart badge shows correct count
- [ ] Can view cart page
- [ ] Can proceed to checkout
- [ ] /account page loads without errors

## 🚨 Common Mistakes

1. **Wrong Webhook URL** - Must be exactly:
   ```
   https://gptees-2026-a039a07e6329.herokuapp.com/api/webhooks/clerk
   ```
   (Not `/webhooks/clerk` without `/api`)

2. **Wrong Secret** - Must start with `whsec_`

3. **Forgot to Restart Heroku** - After setting env var:
   ```bash
   heroku restart -a gptees-2026
   ```

4. **Existing User Not Synced** - Must manually sync (Step 5)

## 📞 Quick Commands Reference

```bash
# Set webhook secret
heroku config:set CLERK_WEBHOOK_SECRET=whsec_xxx -a gptees-2026

# Check if secret is set
heroku config:get CLERK_WEBHOOK_SECRET -a gptees-2026

# Watch logs for webhook events
heroku logs --tail -a gptees-2026 | grep -i "user\|webhook"

# Restart Heroku
heroku restart -a gptees-2026

# Test webhook endpoint
curl -X POST https://gptees-2026-a039a07e6329.herokuapp.com/api/webhooks/clerk \
  -H "Content-Type: application/json" \
  -d '{"test": true}'
# Should return: {"success":false,"message":"Webhook verification failed"}
# (This is good - means endpoint exists but rejects unsigned requests)
```

## ⏱️ Timeline

- Configure webhook in Clerk: **3 minutes**
- Add secret to Heroku: **1 minute**
- Test webhook: **1 minute**
- Manually sync existing user: **2 minutes**
- Test cart/checkout: **2 minutes**
- **Total: ~10 minutes**

## 🎯 Success Criteria

After completing all steps:
- ✅ New sign-ups automatically appear in Supabase
- ✅ Can add products to cart
- ✅ Cart persists and displays correctly
- ✅ Can proceed to checkout
- ✅ /account page loads
- ✅ Can view orders (after creating one)

---

**Next Steps After This Works:**
1. Complete a test checkout with Stripe test card
2. Test design generation flow
3. Verify order appears in /account
4. Update product images (currently placeholders)

**Priority:** 🚨 CRITICAL - Nothing works without users in Supabase!
