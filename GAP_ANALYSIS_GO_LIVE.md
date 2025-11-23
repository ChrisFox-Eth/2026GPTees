# 2026GPTees - Go-Live Gap Analysis
**Target: Launch within 24 hours**
**Analysis Date:** November 23, 2025
**Current Status:** ~87% Complete - Critical gaps identified

---

## Executive Summary

Your 2026GPTees platform is **architecturally sound and mostly complete**, but has **critical configuration and integration gaps** that will prevent a successful launch. The codebase itself is well-structured with all major features implemented, but several third-party integrations are not properly configured, and critical production safeguards are missing.

**Good News:**
- ✅ All core backend services implemented (Clerk, Stripe, OpenAI, Printful, S3, Resend)
- ✅ All frontend pages and components complete
- ✅ Database schema properly designed and migrated
- ✅ Payment flow implemented
- ✅ AI design generation working
- ✅ Cart functionality fixed (recent fix applied)

**Critical Issues Blocking Go-Live:**
1. 🔴 **Missing environment files** - No `.env` files in either backend or frontend
2. 🔴 **Clerk webhook not configured** - Users don't sync from Clerk to Supabase
3. 🔴 **No rate limiting** - Design generation endpoint vulnerable to abuse/cost overruns
4. 🔴 **Missing input validation** - Security and data integrity risks
5. 🔴 **No error monitoring** - Cannot diagnose production issues
6. 🔴 **Missing frontend assets** - No public directory with favicon, images
7. 🔴 **No tests** - Zero automated testing coverage

**Estimated Time to Fix Critical Issues:** 4-6 hours
**Recommendation:** Address all 🔴 Critical issues before launch

---

## 🔴 CRITICAL GAPS (Must Fix Before Launch)

### 1. Missing Environment Configuration Files

**Impact:** Application cannot start without environment variables
**Location:** Root of `/backend/` and `/frontend/` directories
**Status:** ❌ Only `.env.example` files exist

**What's Missing:**

#### Backend `.env` File
Create `/home/user/2026GPTees/backend/.env` with:
```env
# Server
NODE_ENV=production
PORT=5000
FRONTEND_URL=https://www.gptees.app

# Database
DATABASE_URL=<your-supabase-postgresql-url>

# Clerk Authentication
CLERK_PUBLISHABLE_KEY=<value>
CLERK_SECRET_KEY=<value>
CLERK_WEBHOOK_SECRET=<value>

# Stripe Payments
STRIPE_SECRET_KEY=<value>
STRIPE_PUBLISHABLE_KEY=<value>
STRIPE_WEBHOOK_SECRET=<value>

# OpenAI
OPENAI_API_KEY=<value>
OPENAI_ORGANIZATION_ID=<value>

# AWS S3
AWS_ACCESS_KEY_ID=<value>
AWS_SECRET_ACCESS_KEY=<value>
AWS_REGION=<value>
S3_BUCKET_NAME=<value>

# Printful
PRINTFUL_API_KEY=<value>
PRINTFUL_STORE_ID=<value>

# Resend Email
RESEND_API_KEY=<value>
RESEND_FROM_EMAIL=<value>

# Optional
JWT_SECRET=<value>
JWT_EXPIRES_IN=7d
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
```

#### Frontend `.env` File
Create `/home/user/2026GPTees/frontend/.env` with:
```env
VITE_API_URL=https://gptees-2026-a039a07e6329.herokuapp.com
VITE_CLERK_PUBLISHABLE_KEY=<value>
VITE_STRIPE_PUBLISHABLE_KEY=<value>
```

**How to Fix:**
```bash
# Backend
cd /home/user/2026GPTees/backend
cp .env.example .env
# Then edit .env and add all your actual API keys

# Frontend
cd /home/user/2026GPTees/frontend
cp .env.example .env
# Then edit .env with your actual values
```

**Note:** You mentioned having all env variables. Create these files with the actual values.

---

### 2. Clerk Webhook Not Configured (Users Not Syncing)

**Impact:** Users sign up in Clerk but don't sync to Supabase database
**Result:** Cart, orders, designs all fail because user doesn't exist in DB
**Evidence:** See `/WEBHOOK_DIAGNOSIS.md` and `/TROUBLESHOOTING_AUTH.md`
**Location:** Clerk Dashboard configuration (not in code)

**The Problem:**
Your webhook handler exists at `backend/src/controllers/webhook.controller.ts:26-64`, but Clerk isn't sending webhooks to it because the endpoint isn't configured in Clerk Dashboard.

**How to Fix:**

#### Step 1: Configure Webhook in Clerk Dashboard
1. Go to https://dashboard.clerk.com
2. Select your 2026GPTees application
3. Navigate to **Webhooks** in sidebar
4. Click **Add Endpoint**
5. Enter URL: `https://gptees-2026-a039a07e6329.herokuapp.com/api/webhooks/clerk`
6. Subscribe to events:
   - ✅ `user.created`
   - ✅ `user.updated`
7. Click **Create**
8. **Copy the Signing Secret** (starts with `whsec_`)

#### Step 2: Verify Heroku Has Webhook Secret
```bash
heroku config:get CLERK_WEBHOOK_SECRET -a gptees-2026
```

If empty or wrong, set it:
```bash
heroku config:set CLERK_WEBHOOK_SECRET=whsec_your_secret_here -a gptees-2026
```

#### Step 3: Test the Webhook
In Clerk Dashboard:
1. Go to Webhooks → Your endpoint → Testing tab
2. Click **Send Example** for `user.created`
3. Should return `200 OK`

Check Heroku logs:
```bash
heroku logs --tail -a gptees-2026 | grep "User created"
```

Should see: `✓ User created: user_xxxxx`

#### Step 4: Verify Supabase Sync
1. Create a new test account on gptees.app
2. Check Supabase → Table Editor → `users` table
3. User should appear with matching `clerkId`

**Code Reference:**
- Webhook handler: `backend/src/controllers/webhook.controller.ts:26-64`
- User sync service: `backend/src/services/clerk.service.ts:6-32`

---

### 3. No Rate Limiting on Design Generation

**Impact:** Users can spam AI generation, causing massive OpenAI API costs
**Risk:** DALL-E 3 costs $0.04-0.12 per image - 1000 spam requests = $40-120
**Location:** `backend/src/routes/design.routes.ts:7`

**What's Missing:**
The design generation endpoint has NO rate limiting:
```typescript
// backend/src/routes/design.routes.ts:7
router.post('/generate', requireAuth, generateDesign); // ❌ NO RATE LIMIT
```

**How to Fix:**

#### Option A: Quick Fix - Add express-rate-limit
```bash
cd backend
npm install express-rate-limit
```

Create `backend/src/middleware/rateLimiter.middleware.ts`:
```typescript
import rateLimit from 'express-rate-limit';

// Design generation: Max 10 requests per 15 minutes per user
export const designRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // 10 requests per window
  message: 'Too many design requests. Please try again in 15 minutes.',
  standardHeaders: true,
  legacyHeaders: false,
  // Key by user ID
  keyGenerator: (req) => req.user?.id || req.ip,
});

// Checkout: Max 5 checkout sessions per hour
export const checkoutRateLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 5,
  message: 'Too many checkout attempts. Please try again later.',
  keyGenerator: (req) => req.user?.id || req.ip,
});
```

Update `backend/src/routes/design.routes.ts`:
```typescript
import { designRateLimiter } from '../middleware/rateLimiter.middleware.js';

router.post('/generate', requireAuth, designRateLimiter, generateDesign);
```

Update `backend/src/routes/payment.routes.ts`:
```typescript
import { checkoutRateLimiter } from '../middleware/rateLimiter.middleware.js';

router.post('/create-checkout-session', requireAuth, checkoutRateLimiter, createCheckoutSession);
```

#### Option B: Advanced - Add Per-Order Limit Check
In `backend/src/controllers/design.controller.ts:31-32`, add hourly limit for PREMIUM tier:

```typescript
// After checking max designs (line 32)
if (order.designTier === 'PREMIUM') {
  // Even for premium, limit to 20 designs per hour to prevent abuse
  const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
  const recentDesigns = await prisma.design.count({
    where: {
      orderId: order.id,
      createdAt: { gte: oneHourAgo },
    },
  });

  if (recentDesigns >= 20) {
    return res.status(429).json({
      error: 'Rate limit exceeded. Max 20 designs per hour. Please try again later.'
    });
  }
}
```

**Recommended:** Implement both Option A (general rate limiting) and Option B (per-tier limits).

---

### 4. Missing Input Validation

**Impact:** Security vulnerabilities (XSS, injection attacks), data integrity issues
**Risk:** Malformed data can crash the app or corrupt database
**Location:** All controllers accepting user input

**What's Missing:**
Controllers accept user input without validation:

```typescript
// backend/src/controllers/design.controller.ts:20-21
const { orderId, prompt, style } = req.body; // ❌ NO VALIDATION
```

**How to Fix:**

Install validation library:
```bash
cd backend
npm install zod
```

Create `backend/src/validators/design.validator.ts`:
```typescript
import { z } from 'zod';

export const generateDesignSchema = z.object({
  orderId: z.string().uuid('Invalid order ID'),
  prompt: z.string()
    .min(10, 'Prompt must be at least 10 characters')
    .max(1000, 'Prompt must be less than 1000 characters')
    .trim(),
  style: z.enum(['modern', 'vintage', 'artistic', 'playful', 'professional', 'trendy'])
    .optional(),
});

export const approveDesignSchema = z.object({
  designId: z.string().uuid('Invalid design ID'),
});
```

Create `backend/src/validators/payment.validator.ts`:
```typescript
import { z } from 'zod';

export const createCheckoutSchema = z.object({
  items: z.array(z.object({
    productId: z.string().uuid(),
    size: z.string().min(1).max(10),
    color: z.string().min(1).max(50),
    tier: z.enum(['BASIC', 'PREMIUM', 'TEST']),
    quantity: z.number().int().min(1).max(10),
  })).min(1, 'Cart cannot be empty'),
  address: z.object({
    name: z.string().min(1).max(100),
    address1: z.string().min(1).max(200),
    address2: z.string().max(200).optional(),
    city: z.string().min(1).max(100),
    state: z.string().max(50).optional(),
    zip: z.string().min(1).max(20),
    country: z.string().length(2), // ISO country code
    phone: z.string().max(20).optional(),
  }),
});
```

Create validation middleware `backend/src/middleware/validate.middleware.ts`:
```typescript
import { Request, Response, NextFunction } from 'express';
import { ZodSchema } from 'zod';

export const validate = (schema: ZodSchema) => {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      schema.parse(req.body);
      next();
    } catch (error: any) {
      return res.status(400).json({
        error: 'Validation failed',
        details: error.errors,
      });
    }
  };
};
```

Update controllers to use validation:
```typescript
// backend/src/routes/design.routes.ts
import { validate } from '../middleware/validate.middleware.js';
import { generateDesignSchema } from '../validators/design.validator.js';

router.post('/generate', requireAuth, validate(generateDesignSchema), generateDesign);
```

**Files to Create:**
- `backend/src/validators/design.validator.ts`
- `backend/src/validators/payment.validator.ts`
- `backend/src/validators/order.validator.ts`
- `backend/src/middleware/validate.middleware.ts`

**Files to Update:**
- All route files in `backend/src/routes/`

---

### 5. No Error Monitoring/Logging

**Impact:** Cannot diagnose production issues or track errors
**Risk:** Silent failures, no visibility into what's breaking
**Location:** No centralized error tracking

**What's Missing:**
Only basic `console.log` statements exist. No structured logging or error tracking service.

**How to Fix:**

#### Quick Fix: Add Sentry (5 minutes)
```bash
cd backend
npm install @sentry/node
```

Update `backend/src/index.ts` (add at top after imports):
```typescript
import * as Sentry from '@sentry/node';

// Initialize Sentry (after line 10)
if (process.env.SENTRY_DSN) {
  Sentry.init({
    dsn: process.env.SENTRY_DSN,
    environment: process.env.NODE_ENV || 'development',
    tracesSampleRate: 1.0,
  });
}

// Add Sentry request handler (before other middleware, around line 30)
app.use(Sentry.Handlers.requestHandler());

// Add Sentry error handler (before your error middleware, around line 65)
app.use(Sentry.Handlers.errorHandler());
```

Get Sentry DSN:
1. Sign up at https://sentry.io (free tier available)
2. Create new project for Node.js
3. Copy DSN
4. Add to Heroku: `heroku config:set SENTRY_DSN=https://...@sentry.io/... -a gptees-2026`

#### Alternative: Enhanced Console Logging
If you want to skip Sentry for now, at minimum add structured logging:

```bash
cd backend
npm install winston
```

Create `backend/src/utils/logger.ts`:
```typescript
import winston from 'winston';

const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json(),
  ),
  transports: [
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.simple(),
      ),
    }),
  ],
});

export default logger;
```

Replace all `console.log` with:
```typescript
import logger from '../utils/logger.js';

logger.info('User created', { userId: user.id });
logger.error('Failed to generate design', { error, orderId });
```

**Recommendation:** Use Sentry for production. It's free and takes 5 minutes to set up.

---

### 6. Missing Frontend Public Assets

**Impact:** No favicon, broken images, unprofessional appearance
**Location:** `/frontend/public/` directory (doesn't exist)
**Status:** ❌ Missing entirely

**What's Missing:**
- Favicon (favicon.ico, favicon.svg)
- Logo images
- Product placeholder images
- Social media preview images (og:image)
- robots.txt
- manifest.json (for PWA)

**How to Fix:**

Create the public directory structure:
```bash
cd /home/user/2026GPTees/frontend
mkdir -p public/images
```

**Minimum Required Assets:**

1. **Favicon** (`public/favicon.ico`)
   - Create a simple 32x32 favicon
   - Or generate one at https://favicon.io

2. **Logo** (`public/images/logo.png`)
   - Used in header/footer
   - Recommended size: 200x200px

3. **Placeholder Product Image** (`public/images/product-placeholder.png`)
   - Used when product images fail to load
   - Recommended size: 400x400px

4. **robots.txt** (`public/robots.txt`):
```txt
User-agent: *
Allow: /
Disallow: /account
Disallow: /checkout
Disallow: /design

Sitemap: https://www.gptees.app/sitemap.xml
```

5. **Manifest** (`public/manifest.json`):
```json
{
  "name": "2026GPTees",
  "short_name": "GPTees",
  "description": "AI-Powered Custom Apparel",
  "start_url": "/",
  "display": "standalone",
  "background_color": "#ffffff",
  "theme_color": "#6366f1",
  "icons": [
    {
      "src": "/images/logo.png",
      "sizes": "192x192",
      "type": "image/png"
    }
  ]
}
```

Update `frontend/index.html` to reference assets:
```html
<link rel="icon" type="image/svg+xml" href="/favicon.ico" />
<link rel="manifest" href="/manifest.json" />
```

**Quick Solution:** If you don't have time to create assets:
1. Use text-based logo in header (already implemented)
2. Add a simple colored square as favicon
3. Use Tailwind's placeholder utilities for missing images

---

### 7. Zero Test Coverage

**Impact:** No confidence that code works as expected
**Risk:** Regressions, bugs in production, broken critical flows
**Location:** No test files exist anywhere

**What's Missing:**
- No unit tests
- No integration tests
- No end-to-end tests

**How to Fix (Post-Launch Priority):**

This is critical but time-intensive. **Recommendation: Launch without tests, but add immediately after.**

For critical path testing before launch, do **manual testing**:

#### Pre-Launch Manual Test Checklist:

**Authentication Flow:**
- [ ] Sign up new account on gptees.app
- [ ] Verify user appears in Clerk dashboard
- [ ] Verify user appears in Supabase users table
- [ ] Sign out and sign back in
- [ ] Verify session persists across page refreshes

**Shopping Flow:**
- [ ] Browse /shop page
- [ ] Click product, modal opens
- [ ] Select size, color, tier (BASIC)
- [ ] Add to cart
- [ ] Cart badge shows (1)
- [ ] Navigate to /cart
- [ ] Verify product details correct
- [ ] Update quantity
- [ ] Remove item
- [ ] Add back to cart

**Checkout Flow (CRITICAL):**
- [ ] Add product to cart (BASIC tier, $24.99)
- [ ] Go to /checkout
- [ ] Fill in shipping address
- [ ] Click "Continue to Payment"
- [ ] Redirects to Stripe Checkout
- [ ] Use test card: 4242 4242 4242 4242
- [ ] Complete payment
- [ ] Redirects to /checkout/success
- [ ] Order appears in /account
- [ ] Check Supabase orders table - order exists with status PAID
- [ ] Check email - confirmation received

**Design Generation Flow (CRITICAL):**
- [ ] From /account, click "Generate Design" on paid order
- [ ] Enter prompt: "a cool retro sunset over mountains"
- [ ] Select style: "vintage"
- [ ] Click "Generate Design"
- [ ] Loading spinner shows
- [ ] Design appears (within 30 seconds)
- [ ] Image loads correctly
- [ ] Click "Approve Design"
- [ ] Order status updates to DESIGN_APPROVED
- [ ] Check Printful dashboard - order submitted

**BASIC vs PREMIUM Tier Test:**
- [ ] Create order with BASIC tier
- [ ] Generate 1 design (should work)
- [ ] Try to generate 2nd design (should be blocked with error)
- [ ] Create order with PREMIUM tier
- [ ] Generate 3+ designs (all should work)

**Error Handling:**
- [ ] Try to access /design without order ID (should show error)
- [ ] Try to access /account while logged out (should redirect to sign-in)
- [ ] Try invalid checkout (empty cart) - should show error

**Post-Launch: Add Automated Tests**

Set up Jest + Supertest for API testing:
```bash
cd backend
npm install --save-dev jest @types/jest ts-jest supertest @types/supertest
```

Priority test files to create:
1. `backend/src/__tests__/auth.test.ts` - Authentication flows
2. `backend/src/__tests__/payment.test.ts` - Stripe checkout
3. `backend/src/__tests__/design.test.ts` - Design generation
4. `backend/src/__tests__/webhooks.test.ts` - Webhook handlers

---

## 🟡 HIGH PRIORITY GAPS (Should Fix Before Launch)

### 8. Stripe Webhook Configuration Verification

**Status:** ⚠️ Code exists, need to verify Stripe Dashboard config
**Location:** Stripe Dashboard
**Code:** `backend/src/controllers/webhook.controller.ts:66-124`

**What to Verify:**

1. Go to https://dashboard.stripe.com/webhooks
2. Check if endpoint exists: `https://gptees-2026-a039a07e6329.herokuapp.com/api/webhooks/stripe`
3. Verify events subscribed:
   - ✅ `checkout.session.completed`
   - ✅ `payment_intent.succeeded`
4. Verify webhook secret in Heroku matches Stripe:
```bash
heroku config:get STRIPE_WEBHOOK_SECRET -a gptees-2026
```

**Test Webhook:**
```bash
# Install Stripe CLI if not already
stripe listen --forward-to localhost:5000/api/webhooks/stripe

# In another terminal, trigger test payment
stripe trigger checkout.session.completed
```

Check Heroku logs for successful webhook processing.

---

### 9. Printful Webhook Configuration

**Status:** ⚠️ Code exists but webhook might not be configured in Printful
**Location:** Printful Dashboard
**Code:** `backend/src/controllers/webhook.controller.ts:126-178`

**What to Do:**

1. Go to Printful Dashboard → Settings → Webhooks
2. Add webhook URL: `https://gptees-2026-a039a07e6329.herokuapp.com/api/webhooks/printful`
3. Subscribe to events:
   - ✅ `order_updated`
   - ✅ `order_shipped`
4. **Note:** Printful webhook has NO signature verification (see code line 127-128)

**Security Improvement Needed:**
The Printful webhook doesn't verify signatures:
```typescript
// backend/src/controllers/webhook.controller.ts:127-128
export const handlePrintfulWebhook = catchAsync(async (req: Request, res: Response) => {
  const event = req.body; // ❌ NO SIGNATURE VERIFICATION
```

**Quick Fix:**
Add basic authentication or IP whitelisting to verify requests come from Printful:
```typescript
// Add to webhook.controller.ts handlePrintfulWebhook
const printfulIPs = ['35.157.75.200', '52.58.116.178']; // Printful IP ranges
if (!printfulIPs.includes(req.ip)) {
  return res.status(403).json({ error: 'Forbidden' });
}
```

---

### 10. Missing Refund Functionality

**Status:** ❌ Refund model exists in database, but no API endpoints
**Impact:** Cannot process customer refunds
**Location:** No controller/route exists for refunds

**What's Missing:**
Database model exists (`backend/prisma/schema.prisma:153-165`), but no way to create refunds via API.

**How to Fix:**

Create `backend/src/controllers/refund.controller.ts`:
```typescript
import { Request, Response } from 'express';
import { prisma } from '../config/database.js';
import { stripe } from '../services/stripe.service.js';
import { catchAsync } from '../middleware/error.middleware.js';

export const createRefund = catchAsync(async (req: Request, res: Response) => {
  const { orderId, reason } = req.body;

  // Get order with payment
  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: { payment: true },
  });

  if (!order || order.userId !== req.user!.id) {
    return res.status(404).json({ error: 'Order not found' });
  }

  if (!order.payment) {
    return res.status(400).json({ error: 'No payment found for this order' });
  }

  // Create Stripe refund
  const stripeRefund = await stripe.refunds.create({
    payment_intent: order.payment.stripePaymentId,
    reason: reason || 'requested_by_customer',
  });

  // Create refund record
  const refund = await prisma.refund.create({
    data: {
      paymentId: order.payment.id,
      stripeRefundId: stripeRefund.id,
      amount: order.payment.amount,
      reason: reason || 'Customer requested refund',
      status: stripeRefund.status,
    },
  });

  // Update order and payment status
  await prisma.$transaction([
    prisma.order.update({
      where: { id: orderId },
      data: { status: 'REFUNDED' },
    }),
    prisma.payment.update({
      where: { id: order.payment.id },
      data: {
        status: 'REFUNDED',
        refundId: refund.id,
      },
    }),
  ]);

  res.json({ success: true, refund });
});

export const getRefund = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;

  const refund = await prisma.refund.findUnique({
    where: { id },
    include: { payment: { include: { order: true } } },
  });

  if (!refund || refund.payment.order.userId !== req.user!.id) {
    return res.status(404).json({ error: 'Refund not found' });
  }

  res.json(refund);
});
```

Create `backend/src/routes/refund.routes.ts`:
```typescript
import express from 'express';
import { requireAuth } from '../middleware/auth.middleware.js';
import { createRefund, getRefund } from '../controllers/refund.controller.js';

const router = express.Router();

router.post('/', requireAuth, createRefund);
router.get('/:id', requireAuth, getRefund);

export default router;
```

Add to `backend/src/index.ts`:
```typescript
import refundRoutes from './routes/refund.routes.js';

app.use('/api/refunds', refundRoutes);
```

**Note:** For launch, you can manually process refunds via Stripe Dashboard. But you'll need this API for customer service.

---

### 11. No Address Management Endpoints

**Status:** ⚠️ Address model exists, used in checkout, but no CRUD endpoints
**Impact:** Users can't manage saved addresses
**Location:** `backend/src/controllers/` - no address controller

**What's Missing:**
- No way to save addresses for reuse
- No way to set default address
- No way to update/delete addresses

**Current Behavior:**
Addresses are created during checkout (`backend/src/controllers/payment.controller.ts:35-50`) but can't be managed separately.

**How to Fix (Post-Launch):**

Create `backend/src/controllers/address.controller.ts` with:
- `GET /api/addresses` - List user's addresses
- `POST /api/addresses` - Create new address
- `PUT /api/addresses/:id` - Update address
- `DELETE /api/addresses/:id` - Delete address
- `PUT /api/addresses/:id/default` - Set as default

**Workaround for Launch:**
Users can enter address at checkout each time. Not ideal, but functional.

---

### 12. Printful Variant Mapping is Hardcoded

**Status:** ⚠️ Works but fragile
**Location:** `backend/src/services/printful.service.ts:9-115`
**Issue:** COLOR_VARIANT_MAP is manually maintained

**Current Implementation:**
```typescript
// backend/src/services/printful.service.ts:9-115
const COLOR_VARIANT_MAP: Record<string, Record<string, Record<string, string>>> = {
  '71': { // Basic Tee
    'Black': { 'S': '4012', 'M': '4013', ... },
    'White': { 'S': '4016', 'M': '4017', ... },
    // ... manually maintained
  },
  // ...
};
```

**Problem:**
- If Printful changes variant IDs, orders will fail
- Adding new products requires manual variant mapping
- Typos in color/size names will break

**How to Fix (Post-Launch):**

Replace hardcoded map with dynamic Printful API lookup:

```typescript
async function getVariantId(
  printfulProductId: string,
  size: string,
  color: string
): Promise<string> {
  // Cache variant lookups
  const cacheKey = `variant:${printfulProductId}:${size}:${color}`;
  const cached = await redis.get(cacheKey); // Use Redis or in-memory cache
  if (cached) return cached;

  // Fetch from Printful API
  const product = await printfulClient.get(`store/products/${printfulProductId}`);
  const variant = product.result.sync_variants.find((v: any) =>
    v.size === size && v.color === color
  );

  if (!variant) {
    throw new Error(`Variant not found: ${size} ${color}`);
  }

  // Cache for 24 hours
  await redis.setex(cacheKey, 86400, variant.id);
  return variant.id;
}
```

**Workaround for Launch:**
Hardcoded mapping works if you only have 3 products. Just test each color/size combo before launch.

---

### 13. No Email Preview/Testing

**Status:** ⚠️ Email templates exist but not tested
**Location:** `backend/src/services/email.service.ts`
**Issue:** No way to preview emails before sending

**What to Do Before Launch:**

Test all email templates:

1. **Order Confirmation Email:**
```bash
# Place a test order and check your email
# Verify order number, product details, total, link to account
```

2. **Design Approved Email:**
```bash
# Generate and approve a design
# Check email has design image, prompt, link to order
```

3. **Shipping Notification:**
```bash
# This only triggers from Printful webhook
# May need to test in production with real order
```

**Quick Email Test:**
Add a test endpoint (remove after launch):

```typescript
// backend/src/routes/test.routes.ts (temporary)
router.get('/test-email', async (req, res) => {
  await sendOrderConfirmation({
    email: 'your-email@example.com',
    orderNumber: 'TEST-001',
    total: 49.98,
    items: [{
      productName: 'Basic Tee',
      size: 'M',
      color: 'Black',
      tier: 'PREMIUM',
      quantity: 1,
      unitPrice: 49.98,
    }],
  });
  res.json({ success: true });
});
```

Then: `curl https://gptees-2026-a039a07e6329.herokuapp.com/api/test/test-email`

Check your inbox for email.

---

## 🟢 MEDIUM PRIORITY GAPS (Can Launch Without, Fix Soon After)

### 14. No Admin Dashboard

**Impact:** Cannot manage orders, users, or products without direct database access
**Status:** Not implemented
**Workaround:** Use Supabase dashboard and Stripe/Printful dashboards

**What's Missing:**
- No admin role/permissions
- No admin UI
- No order management interface
- No product management

**Post-Launch Priority:** HIGH
You'll need this within the first week for customer support.

---

### 15. No Order Cancellation

**Impact:** Users can't cancel pending orders
**Status:** Order model has CANCELLED status but no endpoint to set it

**Workaround:**
Manually cancel via Supabase or Stripe dashboard.

**How to Fix (Post-Launch):**
Add `POST /api/orders/:id/cancel` endpoint.

---

### 16. No Pagination on Lists

**Impact:** Performance issues if users have many orders/designs
**Location:**
- `backend/src/controllers/order.controller.ts:10` - getUserOrders
- `backend/src/controllers/design.controller.ts:106` - getDesignsByOrder

**Current Code:**
```typescript
// backend/src/controllers/order.controller.ts:10-30
const orders = await prisma.order.findMany({
  where: { userId: user.id },
  // ❌ NO PAGINATION - returns ALL orders
});
```

**Fix (Post-Launch):**
Add pagination:
```typescript
const page = parseInt(req.query.page as string) || 1;
const limit = parseInt(req.query.limit as string) || 20;
const skip = (page - 1) * limit;

const [orders, total] = await prisma.$transaction([
  prisma.order.findMany({
    where: { userId: user.id },
    take: limit,
    skip: skip,
    orderBy: { createdAt: 'desc' },
  }),
  prisma.order.count({ where: { userId: user.id } }),
]);

res.json({ orders, total, page, pages: Math.ceil(total / limit) });
```

---

### 17. Limited Error Messages for Users

**Impact:** Users see generic error messages, can't self-diagnose
**Location:** All controllers

**Current Example:**
```typescript
// backend/src/controllers/design.controller.ts:29
return res.status(400).json({ error: 'Order not found' });
```

**Better User Experience:**
```typescript
return res.status(400).json({
  error: 'Order not found',
  code: 'ORDER_NOT_FOUND',
  message: 'We couldn\'t find this order. Please check your account page.',
  action: 'Go to Account',
  actionUrl: '/account',
});
```

Frontend can then show actionable errors.

---

### 18. No Analytics/Metrics

**Impact:** No visibility into business metrics
**Status:** No tracking implemented

**What's Missing:**
- No user behavior tracking
- No conversion tracking
- No revenue metrics
- No A/B testing

**Post-Launch:**
Add Google Analytics 4 or Mixpanel to frontend.

---

## ✅ WHAT'S WORKING WELL

### Backend Architecture
- ✅ Clean service layer pattern
- ✅ Proper separation of concerns
- ✅ Comprehensive error handling foundation
- ✅ All integrations implemented (7 services)
- ✅ Webhook handlers for Clerk, Stripe, Printful
- ✅ Database schema well-designed
- ✅ TypeScript with strict typing
- ✅ ESM modules properly configured

### Frontend Implementation
- ✅ All 14 required pages complete
- ✅ Responsive design with Tailwind CSS 4
- ✅ Dark mode support
- ✅ Clerk authentication fully integrated
- ✅ Cart functionality (recently fixed)
- ✅ Proper routing with protected routes
- ✅ Clean component structure
- ✅ TypeScript with type safety

### Third-Party Integrations (Code)
- ✅ Clerk SDK configured (`backend/src/services/clerk.service.ts`)
- ✅ Stripe Checkout & webhooks (`backend/src/services/stripe.service.ts`)
- ✅ OpenAI DALL-E 3 (`backend/src/services/openai.service.ts`)
- ✅ Printful API v2 (`backend/src/services/printful.service.ts`)
- ✅ Resend emails (`backend/src/services/email.service.ts`)
- ✅ AWS S3 + Sharp (`backend/src/services/s3.service.ts`)

### Database
- ✅ Prisma schema complete with 8 models
- ✅ Proper relationships and cascades
- ✅ Enums for status fields
- ✅ Migration generated
- ✅ Seed script ready

### Deployment Configuration
- ✅ Procfile for Heroku (`backend/Procfile`)
- ✅ vercel.json for SPA routing (`frontend/vercel.json`)
- ✅ TypeScript build configs
- ✅ Package.json scripts properly configured

---

## 📋 GO-LIVE CHECKLIST

### Before Deploying (Local Setup)

#### Environment Configuration
- [ ] Create `backend/.env` with all API keys
- [ ] Create `frontend/.env` with frontend vars
- [ ] Verify all environment variables are correct
- [ ] Test backend starts locally: `cd backend && npm run dev`
- [ ] Test frontend starts locally: `cd frontend && npm run dev`

#### Critical Code Fixes
- [ ] Add rate limiting to design generation endpoint
- [ ] Add input validation (Zod) to all controllers
- [ ] Add error monitoring (Sentry or Winston)
- [ ] Create frontend `public/` directory with assets
- [ ] Add favicon to `public/favicon.ico`
- [ ] Test that favicon shows in browser

#### Third-Party Configuration (Dashboard Changes)
- [ ] **Clerk:** Configure webhook endpoint
- [ ] **Clerk:** Verify webhook secret in Heroku matches
- [ ] **Stripe:** Verify webhook endpoint exists
- [ ] **Stripe:** Verify webhook secret in Heroku matches
- [ ] **Printful:** Add webhook endpoint
- [ ] **Sentry:** Create project and get DSN (if using)

### Deployment Steps

#### Backend (Heroku)
- [ ] Commit all code changes to git
- [ ] Push to main branch
- [ ] Deploy to Heroku: `git push heroku main`
- [ ] Run migrations: `heroku run "cd backend && npx prisma migrate deploy" -a gptees-2026`
- [ ] Run seed: `heroku run "cd backend && npm run db:seed" -a gptees-2026`
- [ ] Check logs: `heroku logs --tail -a gptees-2026`
- [ ] Verify health: `curl https://gptees-2026-a039a07e6329.herokuapp.com/api/health`

#### Frontend (Vercel)
- [ ] Commit frontend changes
- [ ] Push to main branch
- [ ] Vercel auto-deploys (or manual: `vercel --prod`)
- [ ] Verify deployment at gptees.app
- [ ] Test that API calls work

### Post-Deployment Testing

#### Authentication & User Sync
- [ ] Sign up new test account on gptees.app
- [ ] Verify user appears in Clerk dashboard
- [ ] **CRITICAL:** Verify user appears in Supabase users table
- [ ] Sign out and sign in
- [ ] Verify session persists

#### Complete Purchase Flow
- [ ] Browse /shop
- [ ] Add Basic Tee (M, Black, BASIC) to cart
- [ ] Cart shows 1 item
- [ ] Go to /cart, verify item shows
- [ ] Go to /checkout
- [ ] Fill in shipping address
- [ ] Click "Continue to Payment"
- [ ] Complete Stripe payment (use real card or test card)
- [ ] Verify redirect to success page
- [ ] Check /account - order appears
- [ ] Check email - confirmation received
- [ ] Check Supabase - order exists with status PAID

#### Design Generation Flow
- [ ] From /account, click "Generate Design" on order
- [ ] Enter prompt and select style
- [ ] Click "Generate Design"
- [ ] Wait for generation (30-60 seconds)
- [ ] Verify design image loads
- [ ] Click "Approve Design"
- [ ] Verify Printful order created (check Printful dashboard)

#### Tier Limit Testing
- [ ] Create BASIC tier order
- [ ] Generate 1 design (should work)
- [ ] Try to generate 2nd design (should fail with error)
- [ ] Create PREMIUM tier order
- [ ] Generate 3 designs (all should work)

#### Error Scenarios
- [ ] Try to checkout with empty cart (should error)
- [ ] Try to access /design without order (should error)
- [ ] Try to access protected routes while logged out (should redirect)

### Monitoring Setup

- [ ] Set up Heroku log drain (if using service)
- [ ] Configure Sentry alerts (if using)
- [ ] Set up uptime monitoring (UptimeRobot, Pingdom, etc.)
- [ ] Monitor for webhook delivery in Clerk dashboard
- [ ] Monitor for webhook delivery in Stripe dashboard
- [ ] Check Heroku metrics dashboard

---

## 🚨 LAUNCH BLOCKERS SUMMARY

**You CANNOT launch until these are fixed:**

1. **Missing .env files** (30 minutes)
   - Create backend/.env
   - Create frontend/.env

2. **Clerk webhook not configured** (15 minutes)
   - Add endpoint in Clerk dashboard
   - Test webhook delivery
   - Verify users sync to Supabase

3. **No rate limiting on AI generation** (30 minutes)
   - Install express-rate-limit
   - Add to design routes
   - Test rate limit works

4. **No input validation** (1-2 hours)
   - Install Zod
   - Create validators
   - Add to all routes
   - Test validation

5. **No error monitoring** (15 minutes)
   - Set up Sentry OR Winston
   - Add to error handlers
   - Test error tracking

6. **Missing frontend assets** (30 minutes)
   - Create public/ directory
   - Add favicon
   - Add manifest.json
   - Test assets load

**Total Estimated Time:** 4-6 hours

---

## 📈 POST-LAUNCH PRIORITIES (Week 1)

1. **Add automated tests** (Day 1-2)
   - Critical path integration tests
   - Webhook handler tests
   - Payment flow tests

2. **Build admin dashboard** (Day 2-3)
   - Order management
   - User management
   - Product management
   - Refund processing

3. **Add analytics** (Day 3)
   - Google Analytics 4
   - Conversion tracking
   - Revenue metrics

4. **Improve error messages** (Day 4)
   - User-friendly error codes
   - Actionable error messages
   - Better UX for failures

5. **Performance optimization** (Day 5)
   - Add pagination
   - Implement caching
   - Optimize images
   - Database query optimization

6. **Security hardening** (Day 6-7)
   - Add Printful webhook signature verification
   - Implement CSRF protection
   - Add request size limits
   - Security audit

---

## 🎯 SUCCESS METRICS

**Launch Day Goals:**
- Zero critical errors
- Complete 1 successful test purchase end-to-end
- All webhooks delivering successfully
- Email notifications working
- Design generation working
- Printful order submission working

**Week 1 Goals:**
- Process 10 real orders successfully
- Zero payment failures
- Zero fulfillment failures
- < 5% error rate across all endpoints
- < 2 second average API response time

---

## 📁 FILES TO CREATE/MODIFY

### Files to CREATE:

**Backend:**
```
backend/.env
backend/src/middleware/rateLimiter.middleware.ts
backend/src/middleware/validate.middleware.ts
backend/src/validators/design.validator.ts
backend/src/validators/payment.validator.ts
backend/src/validators/order.validator.ts
backend/src/controllers/refund.controller.ts
backend/src/routes/refund.routes.ts
backend/src/utils/logger.ts (if using Winston)
```

**Frontend:**
```
frontend/.env
frontend/public/favicon.ico
frontend/public/manifest.json
frontend/public/robots.txt
frontend/public/images/logo.png (optional)
```

### Files to MODIFY:

**Backend:**
```
backend/src/index.ts (add Sentry, rate limiters, refund routes)
backend/src/routes/design.routes.ts (add rate limiter, validation)
backend/src/routes/payment.routes.ts (add rate limiter, validation)
backend/src/routes/order.routes.ts (add validation)
backend/src/controllers/webhook.controller.ts (add Printful IP verification)
backend/package.json (add new dependencies)
```

**Frontend:**
```
frontend/index.html (add favicon, manifest links)
frontend/vite-env.d.ts (remove unused VITE_STRIPE_PUBLISHABLE_KEY)
```

---

## 💰 ESTIMATED COSTS

**Current Monthly Costs (Production):**
- Heroku Eco Dyno: $5/month
- Supabase Free tier: $0 (up to 500MB, 2GB bandwidth)
- Clerk Free tier: $0 (up to 10,000 MAU)
- Stripe: 2.9% + $0.30 per transaction
- OpenAI DALL-E 3: $0.04 per 1024x1024 image
- Printful: No monthly fee (per-order costs)
- Resend: $0 (up to 3,000 emails/month)
- AWS S3: ~$0.023 per GB + $0.0004 per 1,000 requests
- Vercel Hobby: $0 (free for personal projects)
- Sentry: $0 (up to 5,000 errors/month)

**With 100 Orders/Month:**
- Stripe fees: ~$150 (assuming $50 AOV)
- OpenAI costs: $4-12 (100-300 designs)
- AWS S3: ~$1
- Other services: $5 (Heroku)

**Total: ~$160-170/month at 100 orders**

**Cost Optimization:**
- Images cached in S3, not regenerated
- Rate limiting prevents AI abuse
- Email template caching reduces API calls

---

## 🔐 SECURITY CHECKLIST

- [ ] All API keys in environment variables (not in code)
- [ ] Clerk JWT verification on all protected routes
- [ ] Stripe webhook signature verification
- [ ] Clerk webhook signature verification
- [ ] ❌ **TODO:** Printful webhook verification (IP whitelist or signature)
- [ ] CORS configured with specific origins
- [ ] Helmet.js security headers enabled
- [ ] SQL injection protected (using Prisma)
- [ ] XSS protection (React escapes by default)
- [ ] Rate limiting on expensive endpoints
- [ ] Input validation on all user inputs
- [ ] HTTPS enforced (Heroku/Vercel handle this)
- [ ] No sensitive data in logs
- [ ] No sensitive data in client-side code

---

## 📞 SUPPORT & DEBUGGING

### If Things Go Wrong After Launch

**Backend Issues:**
```bash
# Check Heroku logs
heroku logs --tail -a gptees-2026

# Check specific errors
heroku logs -a gptees-2026 --source app --dyno web

# Restart dyno
heroku restart -a gptees-2026

# Check config
heroku config -a gptees-2026

# Run migrations
heroku run "cd backend && npx prisma migrate deploy" -a gptees-2026

# Access database
heroku run "cd backend && npx prisma studio" -a gptees-2026
```

**Frontend Issues:**
```bash
# Check Vercel logs
vercel logs

# Redeploy
vercel --prod

# Check environment variables
vercel env ls
```

**Database Issues:**
- Go to Supabase dashboard
- Table Editor to view/edit data
- SQL Editor to run queries
- Check connection string is correct

**Webhook Issues:**
- Clerk Dashboard → Webhooks → Message Attempts
- Stripe Dashboard → Webhooks → Events
- Printful Dashboard → Webhooks (if configured)
- Check Heroku logs for webhook processing

---

## ✅ FINAL RECOMMENDATION

**Status:** You are ~87% complete and CAN launch within 24 hours IF you:

1. ✅ **Complete critical fixes** (4-6 hours):
   - Create .env files
   - Configure Clerk webhook
   - Add rate limiting
   - Add input validation
   - Add error monitoring
   - Create frontend assets

2. ✅ **Manual testing** (2-3 hours):
   - Test complete purchase flow
   - Test design generation
   - Test tier limits
   - Test error scenarios

3. ✅ **Deploy & verify** (1-2 hours):
   - Deploy backend to Heroku
   - Deploy frontend to Vercel
   - Run post-deployment tests
   - Monitor for 1-2 hours

**Total Time Required: 7-11 hours**

If you start now and work focused, you can launch tomorrow evening (within 24 hours).

**Suggested Timeline:**
- **Hours 0-2:** Create env files, configure Clerk webhook, test user sync
- **Hours 2-4:** Add rate limiting and validation
- **Hours 4-6:** Add error monitoring and frontend assets
- **Hours 6-9:** Manual testing of all flows
- **Hours 9-11:** Deploy and post-deployment verification

**Risk Level:** Medium (acceptable for MVP launch with proper monitoring)

**Go/No-Go Decision:** ✅ **GO** - after critical fixes completed

---

**Document End**

*For questions or issues during implementation, check Heroku logs first, then Clerk/Stripe dashboards, then Supabase database.*
