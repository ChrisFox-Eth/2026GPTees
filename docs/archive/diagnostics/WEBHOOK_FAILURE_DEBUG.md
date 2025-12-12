# Debugging Webhook Failures

## What We Know

From Clerk Dashboard:
- ✅ Webhook endpoint IS configured: `https://gptees-2026-a039a07e6329.herokuapp.com/api/webhooks/clerk`
- ✅ Events ARE subscribed: `user.created`
- ✅ Clerk IS sending webhooks (3 attempts visible)
- ❌ All 3 webhook attempts FAILED

## Why Webhooks Are Failing

There are typically 3 reasons:

### Reason 1: Wrong Webhook Secret
**Symptoms:** 400 error with "Webhook verification failed"

**Check:**
```bash
heroku config:get CLERK_WEBHOOK_SECRET -a gptees-2026
```

Should return something like: `whsec_xxxxxxxxxxxxx`

**Fix:** Get the correct secret from Clerk Dashboard:
1. Clerk Dashboard → Webhooks → Your endpoint
2. Look for "Signing Secret" 
3. Copy it (starts with `whsec_`)
4. Update Heroku:
```bash
heroku config:set CLERK_WEBHOOK_SECRET=whsec_CORRECT_SECRET -a gptees-2026
heroku restart -a gptees-2026
```

### Reason 2: Raw Body Parser Issue
**Symptoms:** "Missing required headers" or signature verification fails

The webhook route uses `express.raw()` to preserve the raw body for signature verification.

**Check:** In `backend/src/routes/webhook.routes.ts`:
```typescript
router.post('/clerk', express.raw({ type: 'application/json' }), handleClerkWebhook);
```

This should be BEFORE the main JSON body parser in `index.ts`.

### Reason 3: Database/Prisma Error
**Symptoms:** 500 error, webhook verified but user creation fails

Could be:
- Database connection issue
- Prisma schema mismatch
- Missing UUID generation

## Immediate Actions

### Step 1: Check Heroku Logs for Webhook Errors

```bash
heroku logs --tail -a gptees-2026 | grep -i "webhook\|clerk"
```

Look for errors around the time you signed up.

### Step 2: Retry Failed Webhooks

In Clerk Dashboard:
1. Webhooks → Your endpoint
2. Click on a failed event
3. Look at the **Response** section - what error do you see?
4. Click **Retry** button
5. Watch Heroku logs in real-time

### Step 3: Check What Error Clerk Sees

In Clerk Dashboard, for each failed webhook:
- **Status Code:** What is it? (400, 401, 500?)
- **Response Body:** What error message?
- **Response Time:** Did it timeout?

Common errors:
- **400**: Signature verification failed (wrong secret)
- **401**: Authentication issue
- **500**: Server error (database, Prisma, etc.)
- **Timeout**: Endpoint too slow or not responding

### Step 4: Test Webhook Manually

Send a test event from Clerk:
1. Clerk Dashboard → Webhooks → Your endpoint
2. Testing tab
3. Send `user.created` example
4. Watch Heroku logs:

```bash
heroku logs --tail -a gptees-2026
```

**Expected (success):**
```
✓ User created: user_xxxxx
```

**If you see error, note what it says!**

## Most Likely Issue: Wrong Webhook Secret

Based on your earlier logs showing "Missing required headers", the most likely issue is:

1. The webhook secret in Heroku doesn't match the one in Clerk
2. OR the secret was set AFTER the webhook was created

**Solution:**

1. Get the CURRENT secret from Clerk Dashboard
2. Update Heroku:
```bash
heroku config:set CLERK_WEBHOOK_SECRET=whsec_YOUR_ACTUAL_SECRET -a gptees-2026
```
3. Restart:
```bash
heroku restart -a gptees-2026
```
4. In Clerk, click **Retry** on one of the failed events
5. Should succeed now!

## Verify Webhook Secret Matches

**In Clerk Dashboard:**
1. Webhooks → Your endpoint
2. Look for "Signing Secret" section
3. Copy the secret (it's hidden, click to reveal)

**In Heroku:**
```bash
heroku config:get CLERK_WEBHOOK_SECRET -a gptees-2026
```

**These MUST match exactly!**

If they don't match:
```bash
heroku config:set CLERK_WEBHOOK_SECRET=whsec_FROM_CLERK -a gptees-2026
heroku restart -a gptees-2026
```

## After Fixing Webhook

### Retry Failed Events

In Clerk Dashboard:
1. Go to each of the 3 failed events
2. Click **Retry**
3. They should succeed now
4. Check Supabase - your user should appear!

### Verify User in Supabase

```sql
SELECT * FROM users WHERE "clerkId" = 'user_35qmnozWXNYfKxGHWBnPH9ArYVt';
```

Should return your user record.

### Test New Sign-Up

1. Sign out of gptees.app
2. Create a NEW test account
3. Check Heroku logs - should see: `✓ User created: user_xxx`
4. Check Supabase - new user should appear immediately
5. Check Clerk webhooks - should show successful delivery (200 OK)

## Manual User Sync (If Webhook Still Failing)

If you can't get the webhook working right now, manually add yourself:

Run this in Supabase SQL Editor:
```sql
INSERT INTO users (
  id,
  "clerkId",
  email,
  "firstName",
  "lastName",
  "createdAt",
  "updatedAt"
) VALUES (
  gen_random_uuid(),
  'user_35qmnozWXNYfKxGHWBnPH9ArYVt',
  'hoozhootrivia@gmail.com',
  'Hooz',
  'Hoo',
  NOW(),
  NOW()
)
ON CONFLICT ("clerkId") DO UPDATE SET
  email = EXCLUDED.email,
  "firstName" = EXCLUDED."firstName",
  "lastName" = EXCLUDED."lastName",
  "updatedAt" = NOW();
```

This will let YOU use the app while we debug the webhook.

## Next Steps

1. **Check Clerk webhook response** - What error does it show?
2. **Verify webhook secret matches** - Heroku vs Clerk
3. **Retry failed webhooks** - After fixing secret
4. **Manually add yourself** - So you can test the app
5. **Test new sign-up** - Verify webhook works for future users

---

**Please check the Clerk webhook failure details and let me know what error you see!**
