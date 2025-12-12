# Webhook Diagnosis - Why Users Aren't Syncing

## What I Saw in Your Logs

From your Heroku logs earlier:
```
2025-11-22T21:07:08.212864+00:00 app[web.1]: ❌ Clerk webhook error: Error: Missing required headers
```

This tells me:
1. ✅ The webhook endpoint EXISTS and is accessible
2. ✅ The `CLERK_WEBHOOK_SECRET` is set in Heroku (you added it)
3. ❌ But Clerk is NOT actually sending webhooks to your endpoint

## The Two-Part Setup

Having the webhook work requires BOTH:

### Part 1: Backend Ready (✅ YOU HAVE THIS)
- `CLERK_WEBHOOK_SECRET` in Heroku config ✅
- Webhook route at `/api/webhooks/clerk` ✅
- Handler code to process events ✅

### Part 2: Clerk Dashboard Configuration (❓ NEED TO VERIFY)
- Webhook endpoint URL added in Clerk Dashboard
- Events subscribed (`user.created`, `user.updated`)
- Endpoint is ACTIVE (not paused/disabled)

## How to Check If Clerk Webhook is Actually Configured

### Method 1: Check Clerk Dashboard
1. Go to https://dashboard.clerk.com
2. Select your 2026GPTees app
3. Click **Webhooks** in sidebar
4. **Do you see an endpoint listed?**
   - ✅ YES → Check if it's the correct URL and ACTIVE
   - ❌ NO → This is the problem! Need to add it

### Method 2: Check Recent Webhook Deliveries
If webhook IS configured in Clerk:
1. Clerk Dashboard → Webhooks → Your endpoint
2. Click **Message Attempts** or **Recent Deliveries** tab
3. You should see attempts when you signed up
4. Check the status:
   - **200 OK** = Working perfectly
   - **400/401/500** = Endpoint exists but failing
   - **No attempts at all** = Webhook not firing

### Method 3: Test from Clerk Dashboard
1. Clerk Dashboard → Webhooks → Your endpoint
2. Click **Testing** tab
3. Send example `user.created` event
4. Check response:
   - **200 OK** = Everything working!
   - **400** = Secret mismatch or other error
   - **Timeout/Connection error** = URL wrong or endpoint down

## What Your Logs Tell Me

The error `Missing required headers` means:
- Your endpoint received a request
- But it didn't have the Svix signature headers
- This happens when:
  1. Someone manually tests the endpoint (like with curl)
  2. OR Clerk webhook isn't properly configured with the signing secret

## The Real Test: Check for Webhook Attempts

Run this and watch for webhook activity:
```bash
heroku logs --tail -a gptees-2026 | grep -i "webhook\|user"
```

Then in another terminal, trigger a test:
1. Clerk Dashboard → Webhooks → Your endpoint → Testing
2. Send `user.created` example
3. Watch the logs

**What you should see:**
```
✓ User created: user_xxxxx
```

**What you might see instead:**
```
❌ Clerk webhook error: Error: Missing required headers
```
OR
```
❌ Clerk webhook error: Error: Webhook verification failed
```

## Most Likely Scenarios

### Scenario A: Webhook Not Added to Clerk Dashboard
**Symptoms:**
- No webhook attempts in Clerk dashboard
- No webhook logs in Heroku (except manual curl tests)
- Users sign up but never appear in Supabase

**Fix:** Add webhook endpoint in Clerk Dashboard (see USER_SYNC_FIX.md Step 1)

### Scenario B: Webhook Added But Wrong URL
**Symptoms:**
- Webhook attempts show in Clerk with errors
- Heroku logs show nothing

**Fix:** Update webhook URL in Clerk to exact URL:
```
https://gptees-2026-a039a07e6329.herokuapp.com/api/webhooks/clerk
```

### Scenario C: Webhook Added But Wrong Secret
**Symptoms:**
- Webhook attempts in Clerk
- Heroku logs show: `Webhook verification failed`

**Fix:** 
```bash
# Get the correct secret from Clerk Dashboard
heroku config:set CLERK_WEBHOOK_SECRET=whsec_CORRECT_SECRET -a gptees-2026
```

### Scenario D: Webhook Paused/Disabled
**Symptoms:**
- Webhook exists in Clerk
- But shows as "Paused" or "Disabled"

**Fix:** In Clerk Dashboard → Webhooks → Enable/Resume the endpoint

## Definitive Test Right Now

Let's figure out exactly what's happening:

### Step 1: Check Clerk Dashboard
Go to https://dashboard.clerk.com → Webhooks

**Question 1:** Do you see ANY webhook endpoints listed?
- If NO → That's the problem! Add it now.
- If YES → Continue to Question 2

**Question 2:** What's the URL of the webhook?
- Should be: `https://gptees-2026-a039a07e6329.herokuapp.com/api/webhooks/clerk`
- If different → Update it

**Question 3:** What's the status?
- Should be: **Active** (green)
- If Paused/Disabled → Enable it

**Question 4:** What events are subscribed?
- Should include: `user.created`, `user.updated`
- If missing → Add them

### Step 2: Test It Right Now

In Clerk Dashboard:
1. Webhooks → Your endpoint → Testing tab
2. Click **Send Example** for `user.created`
3. Watch for response

**In another terminal:**
```bash
heroku logs --tail -a gptees-2026
```

**Expected result:**
```
✓ User created: user_xxxxx
```

**If you see this instead:**
```
❌ Clerk webhook error: [some error]
```
Then we know the webhook IS configured but something else is wrong.

**If you see NOTHING in logs:**
Then the webhook is NOT configured in Clerk Dashboard.

## Why Manual Sync Works But Doesn't Fix Future Users

When you manually add yourself to Supabase:
- ✅ YOU can now use the app (cart, checkout, etc.)
- ❌ Future sign-ups still won't sync automatically
- ❌ You'll have to manually add every new user (not sustainable)

The webhook is what makes it AUTOMATIC for all future users.

## Summary: What to Check

1. **Clerk Dashboard → Webhooks**
   - Is there an endpoint? (If no, add it)
   - Is it the correct URL?
   - Is it Active?
   - Are events subscribed?

2. **Test the webhook**
   - Send example event from Clerk
   - Check Heroku logs for success/error

3. **Verify the secret matches**
   ```bash
   heroku config:get CLERK_WEBHOOK_SECRET -a gptees-2026
   ```
   Should match the secret shown in Clerk Dashboard for that webhook

---

**Please check Clerk Dashboard → Webhooks and let me know what you see!**

That will tell us exactly what's missing.
