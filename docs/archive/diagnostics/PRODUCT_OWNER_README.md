# 2026GPTees Product Owner Guide

**Last Updated:** November 22, 2025  
**Version:** 1.0.0

---

## Table of Contents

1. [System Overview](#system-overview)
2. [Architecture & Data Flow](#architecture--data-flow)
3. [Authentication & User Management](#authentication--user-management)
4. [Product Catalog Management](#product-catalog-management)
5. [Design Generation (AI)](#design-generation-ai)
6. [Payment Processing](#payment-processing)
7. [Order Fulfillment](#order-fulfillment)
8. [Email Notifications](#email-notifications)
9. [Environment Configuration](#environment-configuration)
10. [Common Tasks & Workflows](#common-tasks--workflows)
11. [Troubleshooting Guide](#troubleshooting-guide)

---

## System Overview

### What is 2026GPTees?

2026GPTees is an AI-powered custom apparel platform that allows customers to:
1. Browse products (t-shirts, hoodies, etc.)
2. Purchase a design tier (Basic or Premium)
3. Generate custom AI designs using DALL-E 3
4. Approve their favorite design
5. Receive their custom-printed apparel via Printful

### Tech Stack

**Frontend:**
- React 18 + TypeScript
- Vite (build tool)
- TailwindCSS (styling)
- React Router (navigation)
- Deployed on: **Vercel**

**Backend:**
- Node.js + Express + TypeScript
- Prisma ORM
- PostgreSQL (via Supabase)
- Deployed on: **Heroku**

**Third-Party Services:**
- **Clerk** - User authentication
- **Supabase** - PostgreSQL database
- **Stripe** - Payment processing
- **OpenAI** - DALL-E 3 image generation
- **Printful** - Print-on-demand fulfillment
- **Resend** - Transactional emails
- **Supabase Storage** - Active image storage
- **AWS S3** - (Not used in current deployment)

---

## Architecture & Data Flow

### High-Level Flow

```
User Journey:
┌─────────────┐
│   Browse    │ → User views products on shop page
│  Products   │
└──────┬──────┘
       │
       ▼
┌─────────────┐
│  Add to     │ → User selects product, size, color, tier
│   Cart      │
└──────┬──────┘
       │
       ▼
┌─────────────┐
│  Checkout   │ → User enters shipping info
│  (Clerk)    │ → Redirects to Stripe for payment
└──────┬──────┘
       │
       ▼
┌─────────────┐
│   Payment   │ → Stripe processes payment
│  (Stripe)   │ → Webhook updates order status to PAID
└──────┬──────┘
       │
       ▼
┌─────────────┐
│  Generate   │ → User creates designs with DALL-E 3
│   Design    │ → Can regenerate (based on tier limits)
│  (OpenAI)   │
└──────┬──────┘
       │
       ▼
┌─────────────┐
│   Approve   │ → User approves final design
│   Design    │ → Triggers Printful order submission
└──────┬──────┘
       │
       ▼
┌─────────────┐
│ Fulfillment │ → Printful prints & ships
│ (Printful)  │ → Webhook updates order status
└──────┬──────┘
       │
       ▼
┌─────────────┐
│  Delivered  │ → Customer receives product
└─────────────┘
```

### Database Schema Overview

**Core Tables:**
- `users` - User accounts (synced from Clerk)
- `addresses` - Shipping addresses
- `products` - Product catalog (t-shirts, hoodies, etc.)
- `orders` - Customer orders with status tracking
- `order_items` - Individual items in an order
- `designs` - AI-generated designs
- `payments` - Payment records from Stripe
- `refunds` - Refund records
- `settings` - System configuration

**Key Relationships:**
- User → Orders (one-to-many)
- User → Addresses (one-to-many)
- Order → OrderItems (one-to-many)
- Order → Designs (one-to-many)
- Order → Payment (one-to-one)
- Product → OrderItems (one-to-many)

---

## Authentication & User Management

### How It Works

**Clerk handles:**
- User sign-up/sign-in UI
- Session management
- OAuth providers (Google, GitHub, etc.)
- Email verification
- Password reset

**Supabase handles:**
- Storing user data in PostgreSQL
- Associating orders/designs with users
- User profile information

### Integration Flow

```
1. User signs up/in via Clerk
   ↓
2. Clerk webhook fires → POST /api/webhooks/clerk
   ↓
3. Backend syncs user to Supabase database
   ↓
4. User data stored in `users` table
```

### Configuration Locations

#### Clerk Settings
**Dashboard:** https://dashboard.clerk.com

**Key Settings:**
- **Application → General:** Configure app name, logo
- **User & Authentication → Email, Phone, Username:** Choose sign-in methods
- **User & Authentication → Social Connections:** Enable OAuth providers
- **Webhooks:** Configure webhook endpoint
  - URL: `https://your-backend.herokuapp.com/api/webhooks/clerk`
  - Events: `user.created`, `user.updated`

**Environment Variables:**
```bash
# Backend
CLERK_PUBLISHABLE_KEY=pk_test_...
CLERK_WEBHOOK_SECRET=whsec_...

# Frontend
VITE_CLERK_PUBLISHABLE_KEY=pk_test_...
```

#### Code Locations

**Backend:**
- Service: `backend/src/services/clerk.service.ts`
  - `syncUserToDatabase()` - Syncs Clerk user to database
  - `verifyClerkWebhook()` - Verifies webhook signatures
  - `getUserByClerkId()` - Fetches user from database
- Middleware: `backend/src/middleware/auth.middleware.ts`
  - `requireAuth` - Protects routes, validates sessions
- Webhook: `backend/src/controllers/webhook.controller.ts`
  - `handleClerkWebhook()` - Processes user lifecycle events

**Frontend:**
- Provider: `frontend/src/main.tsx` - ClerkProvider wraps app
- Protected Routes: `frontend/src/components/ProtectedRoute.tsx`
- API Integration: `frontend/src/utils/api.ts`
  - Sends `Authorization: Bearer <token>` header
  - Sends `X-Session-Id` header for session verification

### Troubleshooting Auth Issues

**Problem:** Users can't sign in
- Check Clerk dashboard for service status
- Verify `CLERK_PUBLISHABLE_KEY` matches in both frontend and backend
- Check browser console for Clerk errors

**Problem:** "User not found" after sign-in
- Check if Clerk webhook is configured correctly
- Manually trigger webhook from Clerk dashboard
- Check backend logs for webhook processing errors

**Problem:** "Authentication failed" on API calls
- Verify frontend is sending both token and session ID
- Check if session has expired (Clerk sessions expire after inactivity)
- Verify backend `requireAuth` middleware is working

---

## Product Catalog Management

### Product Structure

Each product has:
- **Name** - Display name (e.g., "Basic Tee")
- **Slug** - URL-friendly identifier (e.g., "basic-tee")
- **Description** - Product description
- **Base Price** - Product cost before design tier pricing
- **Printful ID** - Printful product template ID
- **Category** - Product type (T_SHIRT, HOODIE, etc.)
- **Sizes** - Available sizes array
- **Colors** - Available colors with hex codes
- **Image URL** - Product preview image
- **Is Active** - Whether product is visible in shop

### Pricing Model

**Total Price = Base Price + Tier Price**

Example:
- Basic Tee: $24.99 (base)
- Basic Tier: +$24.99 (1 design)
- **Total: $49.98**

Or:
- Basic Tee: $24.99 (base)
- Premium Tier: +$34.99 (unlimited designs)
- **Total: $59.98**

### Configuration Locations

#### Tier Pricing
**File:** `backend/src/config/pricing.ts`

```typescript
export const TIERS: Record<TierType, TierConfig> = {
  [TierType.BASIC]: {
    name: 'Basic',
    price: 24.99,           // ← Change price here
    maxDesigns: 1,          // ← Change design limit here
    description: 'Generate 1 AI design',
  },
  [TierType.PREMIUM]: {
    name: 'Premium',
    price: 34.99,           // ← Change price here
    maxDesigns: 9999,       // ← Effectively unlimited
    description: 'Unlimited AI design regeneration',
  },
};
```

**After changing prices:**
1. Rebuild backend: `cd backend && npm run build`
2. Redeploy to Heroku: `git push heroku main`
3. Frontend automatically fetches new prices from API

#### Product Catalog
**File:** `backend/prisma/seed.ts`

**To add a new product:**

1. Add product to `PRODUCTS` array:
```typescript
{
  name: 'Long Sleeve Tee',
  slug: 'long-sleeve-tee',
  description: 'Comfortable long sleeve t-shirt',
  basePrice: 29.99,
  printfulId: '23',  // ← Get from Printful dashboard
  category: 'T_SHIRT',
  sizes: ['S', 'M', 'L', 'XL', '2XL'],
  colors: [
    { name: 'Black', hex: '#000000' },
    { name: 'White', hex: '#FFFFFF' },
  ],
  imageUrl: 'https://your-cdn.com/long-sleeve.jpg',
  isActive: true,
}
```

2. Run seed script:
```bash
cd backend
npm run db:seed
```

3. **Important:** Update Printful variant mapping in `backend/src/services/printful.service.ts`

---

## Design Generation (AI)

### How DALL-E 3 Integration Works

```
User submits prompt
       ↓
Content moderation check (OpenAI Moderation API)
       ↓
Prompt enhancement (style + t-shirt optimization)
       ↓
DALL-E 3 generation (1024x1024 image)
       ↓
Image download from OpenAI
       ↓
Upload to S3 (or use OpenAI URL as fallback)
       ↓
Save design record to database
       ↓
Return image URL to frontend
```

### Configuration Locations

#### OpenAI Settings
**File:** `backend/src/services/openai.service.ts`

**Model Configuration:**
```typescript
const response = await openai.images.generate({
  model: 'dall-e-3',              // ← Model version
  prompt: enhancedPrompt,
  n: 1,                           // ← Number of images
  size: params.size || '1024x1024', // ← Image dimensions
  quality: 'standard',            // ← 'standard' or 'hd'
  style: 'vivid',                 // ← 'vivid' or 'natural'
});
```

**To change image quality:**
- `quality: 'standard'` - Faster, cheaper ($0.040 per image)
- `quality: 'hd'` - Higher quality ($0.080 per image)

**To change image style:**
- `style: 'vivid'` - More dramatic, hyper-real
- `style: 'natural'` - More natural, less hyper-real

#### Style Presets

**File:** `backend/src/services/openai.service.ts`

```typescript
const STYLE_PROMPTS = {
  modern: 'in a modern, clean, minimalist style with bold colors',
  vintage: 'in a vintage, retro style with muted colors and aged textures',
  artistic: 'in an artistic, creative style with expressive brushstrokes',
  playful: 'in a playful, fun style with bright colors and whimsical elements',
  professional: 'in a professional, sophisticated style with elegant design',
  trendy: 'in a trendy, contemporary style with current design trends',
};
```

**To add a new style:**
1. Add to `STYLE_PROMPTS` object
2. Update TypeScript type
3. Update frontend style selector (if applicable)

#### Prompt Engineering

**Base prompt enhancement:**
```typescript
function enhancePrompt(basePrompt: string, style?: string): string {
  let enhanced = basePrompt;

  // Add style enhancement
  if (style && STYLE_PROMPTS[style]) {
    enhanced += ` ${STYLE_PROMPTS[style]}`;
  }

  // Add t-shirt specific guidance
  enhanced += '. Designed for a t-shirt print, high contrast, centered composition, no background.';

  return enhanced;
}
```

**To customize t-shirt optimization:**
- Edit the final line in `enhancePrompt()` function
- Add specific instructions like "vector art style" or "screen print friendly"
- Test prompts in OpenAI Playground first

### Printful Integration

#### Design Positioning

**File:** `backend/src/services/printful.service.ts`

```typescript
files: [
  {
    url: design.imageUrl,
    type: 'default',  // ← 'default' = front print
    position: {
      area_width: 1800,   // ← Printful print area width
      area_height: 2400,  // ← Printful print area height
      width: 1800,        // ← Design width (full width)
      height: 1800,       // ← Design height (square)
      top: 300,           // ← Offset from top
      left: 0,            // ← Offset from left
    },
  },
]
```

**To adjust design placement:**
- `top` - Move design up/down
- `left` - Move design left/right
- `width`/`height` - Scale design size
- `type` - Change print location: `'default'`, `'back'`, `'label_outside'`, `'label_inside'`

---

## Payment Processing

### Stripe Integration Flow

```
1. User clicks "Checkout"
   ↓
2. Frontend calls POST /api/payments/create-checkout-session
   ↓
3. Backend validates products & calculates total (server-side)
   ↓
4. Backend creates Order record (status: PENDING_PAYMENT)
   ↓
5. Backend creates Stripe Checkout Session
   ↓
6. User redirected to Stripe Checkout page
   ↓
7. User completes payment
   ↓
8. Stripe sends webhook → POST /api/webhooks/stripe
   ↓
9. Backend updates Order status to PAID
   ↓
10. Backend creates Payment record
   ↓
11. Backend sends order confirmation email
```

### Configuration Locations

#### Stripe Dashboard
**URL:** https://dashboard.stripe.com

**Key Settings:**
- **Developers → API Keys:** Get publishable and secret keys
- **Developers → Webhooks:** Configure webhook endpoint
  - URL: `https://your-backend.herokuapp.com/api/webhooks/stripe`
  - Events: `checkout.session.completed`
- **Settings → Checkout:** Customize checkout page branding

#### Security Features

**Price Validation:**
- Frontend sends product IDs, but NOT prices
- Backend recalculates total from database
- Prevents price tampering

**Idempotency:**
- Webhook checks if order is already paid
- Prevents duplicate payment processing

**Webhook Verification:**
- Stripe signature verification
- Rejects webhooks with invalid signatures

---

## Order Fulfillment

### Printful Integration

**How it works:**
1. User approves design
2. Backend calls `createPrintfulOrder()`
3. Order submitted to Printful with design file
4. Printful prints and ships
5. Printful sends webhook with tracking info
6. Backend updates order status
7. Email sent to customer with tracking

### Order Statuses

```typescript
enum OrderStatus {
  PENDING_PAYMENT,    // Order created, awaiting payment
  PAID,               // Payment received
  DESIGN_PENDING,     // Waiting for user to generate design
  DESIGN_APPROVED,    // Design approved, ready for fulfillment
  SUBMITTED,          // Submitted to Printful
  SHIPPED,            // Shipped by Printful
  DELIVERED,          // Delivered to customer
  CANCELLED,          // Order cancelled
  REFUNDED,           // Order refunded
}
```

---

## Email Notifications

### Resend Integration

**Emails sent:**
1. **Order Confirmation** - After payment succeeds
2. **Design Approved** - After user approves design
3. **Order Shipped** - After Printful ships order

### Configuration Locations

#### Resend Dashboard
**URL:** https://resend.com/dashboard

**Key Settings:**
- **API Keys:** Get API key
- **Domains:** Add and verify your sending domain
- **Settings:** Configure default from address

#### Code Locations

**File:** `backend/src/services/email.service.ts`

**Email Templates:**
- `sendOrderConfirmation()` - Order confirmation email
- `sendDesignApproved()` - Design approval email
- `sendOrderShipped()` - Shipping notification email

### Customizing Email Templates

**To edit email design:**
1. Open `backend/src/services/email.service.ts`
2. Find the function for the email you want to edit
3. Edit the HTML template
4. Test by triggering the email flow

**Best Practices:**
- Use inline CSS
- Keep design simple and mobile-friendly
- Test in multiple email clients

---

## Environment Configuration

### Backend Environment Variables

**File:** `backend/.env`

```bash
# Server
NODE_ENV=production
PORT=5000
FRONTEND_URL=https://your-frontend.vercel.app

# Database (Supabase)
DATABASE_URL=postgresql://postgres:[PASSWORD]@db.[PROJECT].supabase.co:5432/postgres

# Clerk Authentication
CLERK_PUBLISHABLE_KEY=pk_live_...
CLERK_WEBHOOK_SECRET=whsec_...

# Stripe Payments
STRIPE_SECRET_KEY=sk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...

# OpenAI
OPENAI_API_KEY=sk-...
OPENAI_ORGANIZATION_ID=org-...

# Printful
PRINTFUL_API_KEY=...

# Resend Email
RESEND_API_KEY=re_...
RESEND_FROM_EMAIL=noreply@yourdomain.com

# AWS S3 (optional - not used)
AWS_ACCESS_KEY_ID=AKIA...
AWS_SECRET_ACCESS_KEY=...
AWS_REGION=us-east-2
S3_BUCKET_NAME=your-bucket
```

### Frontend Environment Variables

**File:** `frontend/.env`

```bash
# API
VITE_API_URL=https://your-backend.herokuapp.com

# Clerk
VITE_CLERK_PUBLISHABLE_KEY=pk_live_...

# Stripe
VITE_STRIPE_PUBLISHABLE_KEY=pk_live_...
```

---

## Common Tasks & Workflows

### Adding a New Product

1. Get Printful product ID from dashboard
2. Add product to `backend/prisma/seed.ts`
3. Run `npm run db:seed`
4. Update variant mapping in `printful.service.ts`
5. Test checkout flow

### Changing Tier Prices

1. Edit `backend/src/config/pricing.ts`
2. Rebuild: `npm run build`
3. Deploy: `git push heroku main`
4. Verify on frontend

### Updating Email Templates

1. Edit `backend/src/services/email.service.ts`
2. Find email function
3. Modify HTML template
4. Deploy and test

### Viewing Database

```bash
cd backend
npm run db:studio
# Opens at http://localhost:5555
```

---

## Troubleshooting Guide

### Deployment Issues

**Backend won't start on Heroku:**
- Check Heroku logs: `heroku logs --tail`
- Verify all environment variables are set
- Check for ES module import errors (need `.js` extensions)
- Run `npm run build` locally to test

**Frontend build fails on Vercel:**
- Check build logs in Vercel dashboard
- Verify environment variables are set
- Check for TypeScript errors
- Test build locally: `npm run build`

### Payment Issues

**Stripe checkout not working:**
- Verify Stripe keys match (test vs live)
- Check webhook is configured correctly
- Test with Stripe test cards
- Check backend logs for errors

**Order status not updating after payment:**
- Verify Stripe webhook secret is correct
- Check webhook endpoint is accessible
- Look for webhook errors in Stripe dashboard
- Check backend logs for processing errors

### Design Generation Issues

**DALL-E not generating images:**
- Verify OpenAI API key is valid
- Check API quota/billing
- Test prompt in OpenAI Playground
- Check backend logs for errors

**Images not displaying:**
- Check S3 configuration if using
- Verify image URLs are accessible
- Check CORS settings
- Use fallback mode (OpenAI URLs)

### Email Issues

**Emails not sending:**
- Verify Resend API key
- Check domain verification
- Look for errors in Resend dashboard
- Check backend logs

**Emails going to spam:**
- Verify domain SPF/DKIM/DMARC records
- Use verified sending domain
- Check email content for spam triggers

---

**For additional support, refer to:**
- `AUDIT.md` - Technical implementation details
- `DEPLOYMENT.md` - Deployment instructions
- `README.md` - General project information
