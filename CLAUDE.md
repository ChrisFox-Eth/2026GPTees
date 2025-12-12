# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

2026GPTees is an AI-powered custom apparel e-commerce platform. Users browse products, select a design tier (BASIC or PREMIUM), complete payment via Stripe, then generate AI designs using DALL-E 3. Approved designs are submitted to Printful for fulfillment.

**Key Business Logic:**
- Pay-first model: payment before AI generation
- Tiered pricing: BASIC ($24.99 + product, 1 design), PREMIUM ($34.99 + product, unlimited designs)
- Design generation is only available for PAID orders

## Development Commands

### Root (monorepo)
```bash
npm install                 # Install all dependencies (backend + frontend)
npm run dev:backend         # Start backend dev server
npm run dev:frontend        # Start frontend dev server
npm run build              # Build both projects
npm run lint               # Lint both projects
npm run type-check         # TypeScript check both projects
```

### Backend (Express + TypeScript)
```bash
cd backend
npm run dev                # Start with tsx watch (hot reload)
npm run build              # Compile TypeScript + generate Prisma
npm run start              # Run production build
npm run lint               # ESLint
npm run type-check         # TypeScript check

# Database (Prisma)
npm run db:generate        # Generate Prisma client
npm run db:push            # Push schema to database
npm run db:migrate         # Run migrations
npm run db:seed            # Seed products
npm run db:studio          # Open Prisma Studio GUI
```

### Frontend (React + Vite)
```bash
cd frontend
npm run dev                # Start Vite dev server (port 5173)
npm run build              # TypeScript check + Vite build
npm run preview            # Preview production build
npm run lint               # ESLint
npm run type-check         # TypeScript check
```

## Architecture

### Tech Stack
- **Frontend**: React 18, TypeScript, Vite, Tailwind CSS 4, Clerk React, React Router
- **Backend**: Node.js, Express, TypeScript (ESM), Prisma ORM
- **Database**: PostgreSQL via Supabase
- **Auth**: Clerk (frontend + backend SDK)
- **Payments**: Stripe Checkout + webhooks
- **AI**: OpenAI DALL-E 3
- **Storage**: AWS S3 (images), Sharp (thumbnails)
- **Fulfillment**: Printful API
- **Email**: Resend

### Backend Structure
```
backend/src/
├── index.ts                 # Express app entry point
├── config/
│   ├── database.ts          # Prisma client singleton
│   ├── pricing.ts           # Tier pricing constants (BASIC/PREMIUM/TEST)
│   ├── products.ts          # Product catalog definitions
│   └── shipping.ts          # Shipping rate config
├── controllers/             # Request handlers
├── middleware/
│   ├── auth.middleware.ts   # Clerk JWT verification (requireAuth)
│   ├── admin.middleware.ts  # Admin role check
│   └── error.middleware.ts  # Global error handler
├── routes/                  # Express route definitions
└── services/                # Business logic & external APIs
    ├── clerk.service.ts     # User sync from webhooks
    ├── stripe.service.ts    # Checkout sessions, webhooks
    ├── openai.service.ts    # DALL-E 3 generation
    ├── s3.service.ts        # Image upload
    ├── printful.service.ts  # Order fulfillment
    └── email.service.ts     # Resend notifications
```

### Frontend Structure
```
frontend/src/
├── main.tsx                 # ClerkProvider + Router setup
├── App.tsx                  # Route definitions
├── components/              # Reusable UI components
│   ├── Header/              # Nav with auth state + cart badge
│   ├── ProductCard/         # Shop grid item
│   ├── ProductModal/        # Size/color/tier selection
│   └── ...
├── pages/                   # Route page components
│   ├── HomePage.tsx         # Marketing landing
│   ├── ShopPage.tsx         # Product catalog grid
│   ├── CartPage.tsx         # Cart + checkout flow
│   ├── CheckoutSuccessPage.tsx
│   ├── DesignPage.tsx       # AI design generator UI
│   ├── AccountPage.tsx      # Order history
│   ├── AdminPage.tsx        # Admin dashboard
│   └── ...
└── hooks/
    └── useCart.ts           # localStorage cart state
```

### Database Models (Prisma)
- **User**: Clerk-synced user accounts
- **Order**: Purchase records with tier info (designsGenerated, maxDesigns)
- **OrderItem**: Line items linking orders, products, designs
- **Design**: AI-generated images with approval status
- **Product**: T-shirt catalog with Printful IDs
- **Payment**: Stripe payment records
- **PromoCode**: Discount/free product codes

### API Routes
```
GET  /api/health                    # Health check
GET  /api/auth/me                   # Current user (protected)
GET  /api/products                  # List products
GET  /api/products/:id              # Get product
POST /api/payments/create-checkout  # Create Stripe session (protected)
POST /api/designs/generate          # Generate AI design (protected)
GET  /api/designs/:id               # Get design
POST /api/designs/:id/approve       # Approve design (protected)
GET  /api/orders                    # List user orders (protected)
GET  /api/orders/:id                # Order details (protected)
POST /api/webhooks/clerk            # Clerk user events (raw body)
POST /api/webhooks/stripe           # Stripe payment events (raw body)
POST /api/webhooks/printful         # Printful fulfillment events
```

### Key Flows

**Checkout Flow:**
1. Cart stored in localStorage (useCart hook)
2. POST `/api/payments/create-checkout` creates Order (PENDING_PAYMENT) + Stripe session
3. User completes Stripe Checkout
4. Webhook updates Order to PAID, creates Payment record

**Design Generation Flow:**
1. Order must be PAID status
2. Check tier limit: `designsGenerated < maxDesigns`
3. OpenAI generates image, returns temp URL
4. S3 service uploads image + thumbnail (background)
5. Design record created, order counter incremented
6. User approves design -> status becomes DESIGN_APPROVED
7. Printful submission triggered

### Webhook Configuration
Webhooks require raw body for signature verification. In `index.ts`, webhook routes are mounted BEFORE body parser:
```typescript
app.use('/api/webhooks', webhookRoutes);  // Raw body
app.use(express.json());                   // JSON parser
```

## Environment Variables

### Backend (.env)
```
DATABASE_URL=postgresql://...
CLERK_SECRET_KEY=sk_...
CLERK_WEBHOOK_SECRET=whsec_...
STRIPE_SECRET_KEY=sk_...
STRIPE_WEBHOOK_SECRET=whsec_...
OPENAI_API_KEY=sk-...
AWS_ACCESS_KEY_ID=...
AWS_SECRET_ACCESS_KEY=...
AWS_REGION=us-east-2
S3_BUCKET_NAME=...
PRINTFUL_API_KEY=...
RESEND_API_KEY=...
FRONTEND_URL=http://localhost:5173
```

### Frontend (.env.local)
```
VITE_API_URL=http://localhost:5000
VITE_CLERK_PUBLISHABLE_KEY=pk_...
VITE_STRIPE_PUBLISHABLE_KEY=pk_...
```

## Deployment
- **Backend**: Heroku (gptees-2026)
- **Frontend**: Vercel
- **Database**: Supabase PostgreSQL
- **Domain**: gptees.app

## Important Notes
- Never use mock data - display actual data or indicate absence
- Backend uses ESM modules (`"type": "module"` in package.json)
- Prisma schema uses PostgreSQL-specific types (Decimal, Json)
- Order status flow: PENDING_PAYMENT -> PAID -> DESIGN_PENDING -> DESIGN_APPROVED -> SUBMITTED -> SHIPPED -> DELIVERED
