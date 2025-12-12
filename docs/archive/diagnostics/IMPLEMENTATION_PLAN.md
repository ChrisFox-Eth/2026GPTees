# 2026GPTees - Complete Implementation Plan

**Project**: AI-Powered Custom Apparel Platform
**Timeline**: 7 days (1 week sprint)
**Based on**: Original GPTees project (85% complete) rebuilt on clean React template
**Status**: Ready for AI dev team implementation

---

## Executive Summary

2026GPTees is an AI-powered custom t-shirt design and e-commerce platform that enables users to generate AI designs using DALL-E 3, purchase custom apparel with tiered pricing, and fulfill orders through Printful. This rebuild uses a clean React template foundation with all integrations (Clerk, Stripe, OpenAI, Printful, Resend, S3) already configured with valid API keys.

**Key Differentiators:**
- Pay-first model (payment before AI generation)
- Tiered pricing: BASIC ($24.99 + product, 1 design), PREMIUM ($34.99 + product, unlimited designs)
- Real-time AI design generation with DALL-E 3
- Printful fulfillment integration
- Full Clerk authentication
- Supabase (PostgreSQL) database (NO MongoDB)

---

## Technology Stack

### Frontend
- **Framework**: React 18 + TypeScript
- **Build Tool**: Vite 5+
- **Styling**: Tailwind CSS 4+
- **Routing**: React Router DOM
- **State Management**: React Context + hooks
- **Authentication UI**: Clerk React SDK
- **Payments UI**: Stripe Checkout (hosted)

### Backend
- **Runtime**: Node.js 18+
- **Framework**: Express.js 4+
- **Language**: TypeScript with ESM modules
- **Database**: Supabase (PostgreSQL) via Prisma ORM
- **Authentication**: Clerk Backend SDK
- **File Upload**: Multer + AWS S3

### Third-Party Integrations
- **Authentication**: Clerk (already configured)
- **Payments**: Stripe (live keys configured)
- **AI Generation**: OpenAI DALL-E 3 (key configured)
- **Fulfillment**: Printful SDK v2 (key configured)
- **Email**: Resend (key configured)
- **File Storage**: AWS S3 (credentials configured)
- **Database**: Supabase PostgreSQL (needs setup)

### Deployment
- **Backend**: Heroku (gptees-2026 already created with buildpacks)
- **Frontend**: Vercel (to be deployed)
- **Database**: Supabase (cloud PostgreSQL)
- **Domain**: gptees.app

---

## Project Structure

```
2026GPTees/
├── backend/
│   ├── src/
│   │   ├── server.ts              # Entry point
│   │   ├── app.ts                 # Express app config
│   │   ├── controllers/           # Request handlers
│   │   │   ├── auth.controller.ts
│   │   │   ├── product.controller.ts
│   │   │   ├── payment.controller.ts
│   │   │   ├── design.controller.ts
│   │   │   ├── order.controller.ts
│   │   │   ├── fulfillment.controller.ts
│   │   │   └── webhook.controller.ts
│   │   ├── services/              # Business logic
│   │   │   ├── clerk.service.ts
│   │   │   ├── stripe.service.ts
│   │   │   ├── openai.service.ts
│   │   │   ├── printful.service.ts
│   │   │   ├── resend.service.ts
│   │   │   └── s3.service.ts
│   │   ├── middleware/            # Express middleware
│   │   │   ├── auth.middleware.ts
│   │   │   └── error.middleware.ts
│   │   ├── routes/                # Route definitions
│   │   │   ├── auth.routes.ts
│   │   │   ├── product.routes.ts
│   │   │   ├── payment.routes.ts
│   │   │   ├── design.routes.ts
│   │   │   ├── order.routes.ts
│   │   │   └── webhook.routes.ts
│   │   ├── config/                # Configuration
│   │   │   ├── database.ts
│   │   │   ├── pricing.ts
│   │   │   └── products.ts
│   │   └── types/                 # TypeScript types
│   ├── prisma/
│   │   └── schema.prisma          # Database schema
│   ├── Procfile                   # Heroku config
│   ├── package.json
│   └── tsconfig.json
├── frontend/
│   ├── src/
│   │   ├── components/            # React components
│   │   │   ├── Header/
│   │   │   ├── ProductCard/
│   │   │   ├── CartSummary/
│   │   │   ├── DesignGenerator/
│   │   │   └── OrderHistory/
│   │   ├── pages/                 # Page components
│   │   │   ├── HomePage.tsx
│   │   │   ├── ShopPage.tsx
│   │   │   ├── CartPage.tsx
│   │   │   ├── CheckoutSuccessPage.tsx
│   │   │   ├── DesignPage.tsx
│   │   │   ├── AccountPage.tsx
│   │   │   └── OrderConfirmationPage.tsx
│   │   ├── hooks/                 # Custom hooks
│   │   ├── utils/                 # Utilities
│   │   ├── types/                 # TypeScript types
│   │   ├── App.tsx
│   │   └── main.tsx
│   ├── package.json
│   └── vite.config.ts
└── IMPLEMENTATION_PLAN.md         # This file
```

---

## Database Schema (Supabase PostgreSQL via Prisma)

**IMPORTANT: Use Supabase (PostgreSQL), NOT MongoDB**

### Models Required:
1. **User** - User accounts (synced from Clerk)
2. **Address** - Shipping addresses
3. **Product** - T-shirt catalog
4. **Order** - Customer orders
5. **OrderItem** - Line items in orders
6. **Design** - AI-generated designs
7. **Payment** - Stripe payments
8. **Refund** - Refund records
9. **Settings** - System configuration

See TICKET-01 for complete Prisma schema.

---

## Implementation Tickets

### Phase 1: Foundation & Database (Day 1)

#### TICKET-01: Database Setup with Supabase
**Priority**: CRITICAL
**Effort**: 2 hours
**Dependencies**: None

**Tasks:**
1. Create Supabase project at https://supabase.com
2. Get PostgreSQL connection string
3. Install Prisma: `npm install @prisma/client prisma --prefix backend`
4. Create `backend/prisma/schema.prisma` with complete schema:
   - User model (id, email, clerkId, firstName, lastName, createdAt, updatedAt)
   - Address model (multi-address support)
   - Product model (name, basePrice, printfulId, sizes, colors, category)
   - Order model (orderNumber, status, totalAmount, designTier, designsGenerated, maxDesigns, paymentId, printfulOrderId)
   - OrderItem model (product, design, quantity, size, color, unitPrice, printfulVariantId)
   - Design model (userId, prompt, aiModel, imageUrl, thumbnailUrl, status, style, approvalStatus)
   - Payment model (Stripe integration fields)
   - Refund model
   - Settings model
5. Update DATABASE_URL in Heroku: `heroku config:set DATABASE_URL="postgresql://..." -a gptees-2026`
6. Run migration: `npx prisma migrate dev --name init`
7. Generate Prisma client: `npx prisma generate`
8. Test connection with health endpoint

**Acceptance Criteria:**
- ✅ Prisma schema matches old GPTees schema (adapted for PostgreSQL)
- ✅ Database connection successful
- ✅ All models created in Supabase
- ✅ Prisma client generated

---

#### TICKET-02: Backend Express Setup
**Priority**: CRITICAL
**Effort**: 3 hours
**Dependencies**: TICKET-01

**Tasks:**
1. Install backend dependencies:
   ```bash
   cd backend && npm install express cors dotenv helmet morgan
   npm install --save-dev @types/express @types/cors @types/node tsx nodemon typescript
   ```
2. Create `backend/src/server.ts`:
   - Initialize Express app
   - Configure CORS for frontend origin
   - Add Helmet security middleware
   - Add Morgan logging
   - Configure health check endpoint: GET /api/health
   - Set up error handling middleware
   - Start server on PORT from env
3. Create `backend/src/app.ts`:
   - Export configured Express app
   - Mount all route modules
   - Configure JSON body parser
4. Update `backend/package.json` scripts:
   ```json
   {
     "dev": "tsx watch src/server.ts",
     "build": "tsc",
     "start": "node dist/server.js"
   }
   ```
5. Test locally: `npm run dev --prefix backend`
6. Verify health endpoint responds

**Acceptance Criteria:**
- ✅ Server starts without errors
- ✅ Health endpoint returns 200 OK
- ✅ CORS configured correctly
- ✅ TypeScript compiles successfully
- ✅ Ready for route integration

---

### Phase 2: Authentication (Day 1-2)

#### TICKET-03: Clerk Backend Integration
**Priority**: CRITICAL
**Effort**: 2 hours
**Dependencies**: TICKET-02

**Tasks:**
1. Install Clerk SDK: `npm install @clerk/backend svix --prefix backend`
2. Create `backend/src/middleware/auth.middleware.ts`:
   - Import Clerk SDK
   - Create `requireAuth` middleware that verifies Clerk session token
   - Extract userId from token
   - Attach to req.user
3. Create `backend/src/services/clerk.service.ts`:
   - Function to sync Clerk user to database
   - Function to validate Clerk webhook signature
4. Create `backend/src/routes/webhook.routes.ts`:
   - POST `/api/webhooks/clerk` endpoint
   - Handle `user.created` and `user.updated` events
   - Sync user data to database using Prisma
5. Create `backend/src/routes/auth.routes.ts`:
   - GET `/api/auth/me` - Get current user (protected)
6. Test with Postman/curl using Clerk session token

**Environment Variables Required:**
- CLERK_SECRET_KEY (already set)
- CLERK_PUBLISHABLE_KEY (already set)
- CLERK_WEBHOOK_SECRET (already set)

**Acceptance Criteria:**
- ✅ Protected routes require valid Clerk token
- ✅ Webhook syncs users to database
- ✅ User data accessible via /api/auth/me
- ✅ Clerk user ID stored in database

---

#### TICKET-04: Frontend Clerk Integration
**Priority**: CRITICAL
**Effort**: 2 hours
**Dependencies**: TICKET-03

**Tasks:**
1. Install Clerk React: `npm install @clerk/clerk-react --prefix frontend`
2. Update `frontend/src/main.tsx`:
   - Wrap app with `<ClerkProvider publishableKey={import.meta.env.VITE_CLERK_PUBLISHABLE_KEY}>`
3. Create `frontend/.env.local`:
   ```
   VITE_CLERK_PUBLISHABLE_KEY=pk_live_...
   VITE_API_URL=http://localhost:5000
   ```
4. Create `frontend/src/components/Header/Header.tsx`:
   - Use `useUser()` and `useClerk()` hooks
   - Show Sign In / Sign Up buttons when logged out
   - Show user avatar and Sign Out when logged in
5. Create sign-in and sign-up pages:
   - `frontend/src/pages/SignInPage.tsx` with `<SignIn />`
   - `frontend/src/pages/SignUpPage.tsx` with `<SignUp />`
6. Create protected route wrapper:
   - `frontend/src/components/ProtectedRoute.tsx` using `<SignedIn>` and `<SignedOut>`
7. Test authentication flow end-to-end

**Acceptance Criteria:**
- ✅ Sign up creates user in Clerk and database
- ✅ Sign in works and shows user info
- ✅ Protected routes redirect to sign-in
- ✅ User data synced between Clerk and database

---

### Phase 3: Product Catalog (Day 2)

#### TICKET-05: Product Catalog Backend
**Priority**: HIGH
**Effort**: 3 hours
**Dependencies**: TICKET-02

**Tasks:**
1. Create `backend/src/config/products.ts`:
   - Define product catalog as TypeScript constants:
     ```typescript
     export const PRODUCTS = [
       {
         name: "Basic Tee",
         slug: "basic-tee",
         basePrice: 24.99,
         printfulId: "71",
         category: "T_SHIRT",
         sizes: ["S", "M", "L", "XL", "2XL"],
         colors: [
           { name: "Black", hex: "#000000" },
           { name: "White", hex: "#FFFFFF" },
           { name: "Navy", hex: "#000080" },
           { name: "Gray", hex: "#808080" }
         ]
       }
       // Add more products
     ];
     ```
2. Create `backend/src/config/pricing.ts`:
   - Define tier pricing:
     ```typescript
     export const TIERS = {
       BASIC: { price: 24.99, maxDesigns: 1, name: "Basic" },
       PREMIUM: { price: 34.99, maxDesigns: 9999, name: "Premium" },
       TEST: { price: 0.01, maxDesigns: 1, name: "Test" }
     };
     ```
3. Create `backend/src/controllers/product.controller.ts`:
   - `getProducts()` - List all products
   - `getProduct(slug)` - Get single product
4. Create `backend/src/routes/product.routes.ts`:
   - GET `/api/products` - List products
   - GET `/api/products/:slug` - Get product
5. Create database seeder script:
   - `backend/prisma/seed.ts` - Seed products into database
   - Run: `npx prisma db seed`

**Acceptance Criteria:**
- ✅ GET /api/products returns product list
- ✅ Products include Printful IDs for fulfillment
- ✅ Tier pricing configuration ready
- ✅ Database seeded with products

---

#### TICKET-06: Shop Frontend
**Priority**: HIGH
**Effort**: 4 hours
**Dependencies**: TICKET-05

**Tasks:**
1. Create `frontend/src/pages/ShopPage.tsx`:
   - Fetch products from API
   - Display product grid with Tailwind
   - Show product images, names, prices
   - Click to view product details
2. Create `frontend/src/components/ProductCard/ProductCard.tsx`:
   - Reusable product card component
   - Props: product, onClick
   - Display product image, name, base price
3. Create product details modal or page:
   - Show product details
   - Size selector dropdown
   - Color selector (color swatches)
   - Tier selector (BASIC vs PREMIUM radio buttons)
   - Add to Cart button
4. Implement local cart state:
   - Create `frontend/src/hooks/useCart.ts`
   - Store cart in localStorage
   - Cart structure: { productId, size, color, tier, quantity, unitPrice }
5. Add cart icon to header with item count badge

**Acceptance Criteria:**
- ✅ Products display correctly
- ✅ User can select size, color, tier
- ✅ Add to cart works
- ✅ Cart persists in localStorage
- ✅ Cart count updates in header

---

### Phase 4: Shopping Cart & Checkout (Day 2-3)

#### TICKET-07: Cart Page Frontend
**Priority**: HIGH
**Effort**: 3 hours
**Dependencies**: TICKET-06

**Tasks:**
1. Create `frontend/src/pages/CartPage.tsx`:
   - Display cart items from useCart hook
   - Show product name, size, color, tier, quantity
   - Calculate subtotal: base price + tier price
   - Show tier explanation (BASIC: 1 design, PREMIUM: unlimited)
   - Remove item button
   - Update quantity (if applicable)
   - Calculate grand total
   - Checkout button (requires sign-in)
2. Create `frontend/src/components/CartSummary/CartSummary.tsx`:
   - Reusable cart summary component
   - Props: cartItems, showCheckout
   - Display line items and totals
3. Add sign-in gate:
   - If not signed in, show "Sign in to checkout" button
   - Redirect to sign-in page with return URL
4. Implement checkout button:
   - On click, call POST /api/payments/create-checkout-session
   - Redirect to Stripe Checkout URL

**Acceptance Criteria:**
- ✅ Cart displays all items correctly
- ✅ Totals calculated properly
- ✅ Sign-in required for checkout
- ✅ Remove/update cart items works

---

#### TICKET-08: Stripe Checkout Backend
**Priority**: CRITICAL
**Effort**: 4 hours
**Dependencies**: TICKET-07

**Tasks:**
1. Install Stripe SDK: `npm install stripe --prefix backend`
2. Create `backend/src/services/stripe.service.ts`:
   - Initialize Stripe with secret key
   - Function to create checkout session:
     ```typescript
     async function createCheckoutSession(orderData: {
       userId: string,
       items: CartItem[],
       successUrl: string,
       cancelUrl: string
     }): Promise<{ sessionId: string, url: string }>
     ```
   - Calculate line items with tier pricing
   - Store order in database with status "PENDING_PAYMENT"
   - Create Stripe checkout session
   - Return session URL
3. Create `backend/src/controllers/payment.controller.ts`:
   - POST `/api/payments/create-checkout-session`
   - Requires authentication
   - Validates cart items
   - Creates order record with tier info
   - Returns Stripe checkout URL
4. Create `backend/src/routes/payment.routes.ts`:
   - Mount payment routes
5. Test with Stripe test mode

**Environment Variables:**
- STRIPE_SECRET_KEY (already set)
- STRIPE_PUBLISHABLE_KEY (already set)
- STRIPE_WEBHOOK_SECRET (already set)

**Acceptance Criteria:**
- ✅ Checkout session created successfully
- ✅ Order created in database with PENDING_PAYMENT
- ✅ Tier information stored in order
- ✅ Stripe redirects to checkout page
- ✅ Checkout session includes correct amounts

---

#### TICKET-09: Stripe Webhook Handler
**Priority**: CRITICAL
**Effort**: 3 hours
**Dependencies**: TICKET-08

**Tasks:**
1. Add to `backend/src/routes/webhook.routes.ts`:
   - POST `/api/webhooks/stripe`
   - Use raw body parser for webhook signature verification
2. Add to `backend/src/controllers/webhook.controller.ts`:
   - Verify Stripe webhook signature using svix or crypto
   - Handle `checkout.session.completed` event:
     - Find order by checkout session ID (store in metadata)
     - Update order status to "PAID"
     - Store payment ID
     - Set paidAt timestamp
     - Send order confirmation email via Resend
3. Configure webhook in Stripe dashboard:
   - URL: https://gptees-2026-a039a07e6329.herokuapp.com/api/webhooks/stripe
   - Events: checkout.session.completed
4. Test with Stripe CLI: `stripe trigger checkout.session.completed`

**Acceptance Criteria:**
- ✅ Webhook signature verified correctly
- ✅ Order status updates to PAID
- ✅ Payment recorded in database
- ✅ Confirmation email sent
- ✅ User redirected to success page

---

### Phase 5: AI Design Generation (Day 3-4)

#### TICKET-10: OpenAI Service Integration
**Priority**: CRITICAL
**Effort**: 4 hours
**Dependencies**: TICKET-09

**Tasks:**
1. Install OpenAI SDK: `npm install openai --prefix backend`
2. Create `backend/src/services/openai.service.ts`:
   - Initialize OpenAI client with API key and org ID
   - Function to generate image:
     ```typescript
     async function generateDesign(params: {
       prompt: string,
       style?: string,
       size?: "1024x1024"
     }): Promise<{ imageUrl: string, revisedPrompt: string }>
     ```
   - Call DALL-E 3 API
   - Handle errors gracefully
   - Return image URL and revised prompt
3. Create prompt engineering helper:
   - Function to enhance prompts based on style selection
   - Styles: "modern", "vintage", "artistic", "playful", "professional", "trendy"
   - Ensure prompts suitable for t-shirt designs
4. Add content moderation check (OpenAI moderation API)
5. Test image generation locally

**Environment Variables:**
- OPENAI_API_KEY (already set)
- OPENAI_ORGANIZATION_ID (already set)

**Acceptance Criteria:**
- ✅ DALL-E 3 generates images successfully
- ✅ Prompt enhancement works for all styles
- ✅ Content moderation blocks inappropriate prompts
- ✅ Error handling for API failures
- ✅ Image URLs returned correctly

---

#### TICKET-11: S3 Upload Service
**Priority**: HIGH
**Effort**: 2 hours
**Dependencies**: TICKET-10

**Tasks:**
1. Install AWS SDK: `npm install aws-sdk multer multer-s3 --prefix backend`
2. Create `backend/src/services/s3.service.ts`:
   - Initialize S3 client with credentials
   - Function to upload image from URL:
     ```typescript
     async function uploadImageFromUrl(imageUrl: string, key: string): Promise<string>
     ```
   - Download image from OpenAI URL
   - Upload to S3 bucket
   - Return S3 URL (or CloudFront URL if configured)
3. Create thumbnail generation using Sharp:
   - `npm install sharp --prefix backend`
   - Generate 400x400 thumbnail
   - Upload thumbnail to S3
4. Add local fallback for development
5. Test upload with sample images

**Environment Variables:**
- AWS_ACCESS_KEY_ID (already set)
- AWS_SECRET_ACCESS_KEY (already set)
- AWS_REGION (already set)
- S3_BUCKET_NAME (already set)

**Acceptance Criteria:**
- ✅ Images upload to S3 successfully
- ✅ Thumbnails generated and uploaded
- ✅ S3 URLs returned correctly
- ✅ Local fallback works in development
- ✅ Error handling for upload failures

---

#### TICKET-12: Design Generation Backend
**Priority**: CRITICAL
**Effort**: 4 hours
**Dependencies**: TICKET-10, TICKET-11

**Tasks:**
1. Create `backend/src/controllers/design.controller.ts`:
   - POST `/api/designs/generate`
   - Requires authentication
   - Accept: { orderId, prompt, style }
   - Validate order belongs to user
   - Check order is PAID
   - Check tier limits (designsGenerated < maxDesigns)
   - Call OpenAI service to generate image
   - Upload image and thumbnail to S3
   - Create Design record in database
   - Increment order.designsGenerated counter
   - Return design data
2. Add GET `/api/designs/:id` - Get design details
3. Add GET `/api/designs?orderId=X` - List designs for order
4. Create `backend/src/routes/design.routes.ts`
5. Add error handling for generation failures

**Tier Enforcement Logic:**
```typescript
if (order.designsGenerated >= order.maxDesigns) {
  throw new Error("Design limit reached for this tier. Upgrade to Premium for unlimited designs.");
}
```

**Acceptance Criteria:**
- ✅ Design generation requires paid order
- ✅ BASIC tier limited to 1 design
- ✅ PREMIUM tier allows unlimited designs
- ✅ Counter increments after successful generation
- ✅ Design data saved to database
- ✅ Images stored in S3
- ✅ Error messages clear and actionable

---

#### TICKET-13: Design Generator Frontend
**Priority**: CRITICAL
**Effort**: 5 hours
**Dependencies**: TICKET-12

**Tasks:**
1. Create `frontend/src/pages/DesignPage.tsx`:
   - Accept orderId as query param
   - Fetch order details from API
   - Show order summary (product, size, color, tier)
   - Display remaining design credits (maxDesigns - designsGenerated)
   - Prompt input textarea
   - Style selector dropdown (modern, vintage, etc.)
   - "Surprise Me" button (generates random prompt)
   - Generate Design button
   - Loading state during generation (show spinner)
   - Display generated design image
   - Approve Design button
2. Create `frontend/src/components/DesignGenerator/DesignGenerator.tsx`:
   - Reusable design generation UI component
   - Props: orderId, tier, onDesignGenerated
   - Handle API calls to POST /api/designs/generate
   - Display errors gracefully
3. Show tier limitation messaging:
   - If BASIC and limit reached: "You've used your 1 design. Purchase a Premium tier order for unlimited designs."
4. Add regenerate button (PREMIUM only)
5. Design approval flow:
   - Approve button calls backend
   - Moves to fulfillment step

**Acceptance Criteria:**
- ✅ Design prompt input works
- ✅ Style selector affects generation
- ✅ Surprise Me generates random prompts
- ✅ Loading state displays during generation
- ✅ Generated image displays correctly
- ✅ Tier limits enforced in UI
- ✅ Error messages user-friendly
- ✅ PREMIUM users can regenerate

---

### Phase 6: Order Management & Fulfillment (Day 4-5)

#### TICKET-14: Printful Service Integration
**Priority**: HIGH
**Effort**: 4 hours
**Dependencies**: TICKET-13

**Tasks:**
1. Install Printful SDK: `npm install printful-sdk-js-v2 --prefix backend`
2. Create `backend/src/services/printful.service.ts`:
   - Initialize Printful client with API key
   - Function to create order:
     ```typescript
     async function createPrintfulOrder(params: {
       orderId: string,
       items: OrderItem[],
       shippingAddress: Address,
       designUrl: string
     }): Promise<{ printfulOrderId: string }>
     ```
   - Map product IDs to Printful variant IDs
   - Submit order to Printful API
   - Return Printful order ID
3. Function to sync order status:
   - Poll Printful API for order status
   - Update local order fulfillmentStatus
4. Function to get tracking info:
   - Fetch tracking number from Printful
   - Store in order.trackingNumber
5. Test with Printful API sandbox

**Environment Variables:**
- PRINTFUL_API_KEY (already set)
- PRINTFUL_STORE_ID (already set)

**Important Fix:**
The original GPTees had issues with Printful design submission. Ensure:
- Design image URL is publicly accessible (S3 signed URL if needed)
- Image dimensions meet Printful requirements (300 DPI recommended)
- Correct variant IDs used for products

**Acceptance Criteria:**
- ✅ Order submitted to Printful successfully
- ✅ Printful order ID stored in database
- ✅ Order status syncs correctly
- ✅ Tracking numbers retrieved
- ✅ Design files formatted correctly for Printful

---

#### TICKET-15: Order Controller & Routes
**Priority**: HIGH
**Effort**: 3 hours
**Dependencies**: TICKET-14

**Tasks:**
1. Create `backend/src/controllers/order.controller.ts`:
   - GET `/api/orders` - List user's orders (requires auth)
   - GET `/api/orders/:id` - Get order details
   - POST `/api/orders/:id/approve-design` - Approve design and trigger fulfillment
   - POST `/api/orders/:id/submit-fulfillment` - Submit to Printful
   - GET `/api/orders/:id/tracking` - Get tracking info
2. Create `backend/src/routes/order.routes.ts`
3. Implement fulfillment workflow:
   - User approves design
   - Backend submits order to Printful
   - Updates order.fulfillmentStatus to "SUBMITTED"
   - Stores printfulOrderId
4. Add order status transitions:
   - PENDING_PAYMENT → PAID → DESIGN_PENDING → DESIGN_APPROVED → SUBMITTED → SHIPPED → DELIVERED

**Acceptance Criteria:**
- ✅ Users can list their orders
- ✅ Order details include design and status
- ✅ Design approval triggers fulfillment
- ✅ Printful order submitted automatically
- ✅ Status updates reflected in UI

---

#### TICKET-16: Account Page & Order History
**Priority**: MEDIUM
**Effort**: 3 hours
**Dependencies**: TICKET-15

**Tasks:**
1. Create `frontend/src/pages/AccountPage.tsx`:
   - Require authentication
   - Display user info from Clerk
   - Fetch orders from GET /api/orders
   - Display order history table:
     - Order number
     - Date
     - Product
     - Tier
     - Status
     - Total
     - Actions (View Details, Generate Design, Track)
2. Create order details modal:
   - Show full order details
   - Display design if generated
   - Show tracking info if available
   - Link to Generate Design page if not yet generated
3. Add order status badges with colors:
   - PENDING_PAYMENT: gray
   - PAID: blue
   - DESIGN_PENDING: yellow
   - DESIGN_APPROVED: green
   - SUBMITTED: purple
   - SHIPPED: teal
4. Add filter/sort options (optional)

**Acceptance Criteria:**
- ✅ Order history displays correctly
- ✅ User can view order details
- ✅ Design generation link works
- ✅ Tracking info displayed when available
- ✅ Status badges color-coded correctly

---

### Phase 7: Email Notifications (Day 5)

#### TICKET-17: Resend Email Service
**Priority**: MEDIUM
**Effort**: 3 hours
**Dependencies**: TICKET-09

**Tasks:**
1. Install Resend SDK: `npm install resend --prefix backend`
2. Create `backend/src/services/resend.service.ts`:
   - Initialize Resend client with API key
   - Function to send order confirmation:
     ```typescript
     async function sendOrderConfirmation(params: {
       email: string,
       orderNumber: string,
       total: number,
       items: OrderItem[]
     }): Promise<void>
     ```
   - Function to send design completed notification
   - Function to send shipping notification
3. Create email templates as HTML strings:
   - Order confirmation email
   - Design ready email (with image)
   - Shipping confirmation email (with tracking)
4. Add to webhook controller:
   - Send confirmation email after payment success
5. Add to design controller:
   - Send design ready email after generation
6. Test with real email addresses

**Environment Variables:**
- RESEND_API_KEY (already set)

**Email Templates:**
- Use simple, responsive HTML
- Include order number, product details, total
- Link to view order online
- Include brand colors and logo (add logo to S3)

**Acceptance Criteria:**
- ✅ Order confirmation sent after payment
- ✅ Design ready notification sent after generation
- ✅ Shipping notification sent when order ships
- ✅ Emails formatted well and mobile-responsive
- ✅ All links work correctly

---

### Phase 8: Polish & Edge Cases (Day 6)

#### TICKET-18: Error Handling & User Feedback
**Priority**: MEDIUM
**Effort**: 3 hours
**Dependencies**: All previous tickets

**Tasks:**
1. Create global error handler middleware:
   - `backend/src/middleware/error.middleware.ts`
   - Catch all errors
   - Log to console (or logging service)
   - Return user-friendly error messages
   - Include error codes for frontend handling
2. Add frontend error boundary:
   - `frontend/src/components/ErrorBoundary.tsx`
   - Catch React errors
   - Display friendly error page
3. Add toast notifications:
   - Install: `npm install react-hot-toast --prefix frontend`
   - Show success/error toasts for all user actions
4. Add loading states:
   - Spinner component for async operations
   - Skeleton loaders for data fetching
5. Add validation:
   - Frontend form validation
   - Backend request validation
   - Proper error messages for validation failures

**Acceptance Criteria:**
- ✅ All errors caught and logged
- ✅ User-friendly error messages displayed
- ✅ Toast notifications work for all actions
- ✅ Loading states show during async operations
- ✅ Validation prevents invalid submissions

---

#### TICKET-19: Homepage & Marketing Pages
**Priority**: LOW
**Effort**: 4 hours
**Dependencies**: None (can be done in parallel)

**Tasks:**
1. Create `frontend/src/pages/HomePage.tsx`:
   - Hero section with CTA ("Start Designing")
   - How It Works section (3-step process)
   - Featured products grid
   - Tier comparison table (BASIC vs PREMIUM)
   - Testimonials section (optional)
   - Call to action footer
2. Create How It Works page:
   - Step 1: Choose your product
   - Step 2: Select tier and checkout
   - Step 3: Generate AI design
   - Step 4: We print and ship
3. Add About page (optional)
4. Add FAQ page (optional)
5. Style with Tailwind CSS
6. Ensure mobile responsive

**Acceptance Criteria:**
- ✅ Homepage visually appealing
- ✅ How It Works clearly explains process
- ✅ Tier benefits communicated clearly
- ✅ All pages mobile responsive
- ✅ CTAs link to correct pages

---

#### TICKET-20: Legal Pages & Footer
**Priority**: LOW
**Effort**: 2 hours
**Dependencies**: None

**Tasks:**
1. Create legal pages (simple text pages):
   - Privacy Policy
   - Terms of Service
   - Refund Policy
   - Shipping Policy
   - AI Content Disclaimer
2. Create Footer component:
   - Links to legal pages
   - Social media links (if applicable)
   - Copyright notice
   - Contact information
3. Add to all pages via layout

**Acceptance Criteria:**
- ✅ All legal pages accessible
- ✅ Footer on all pages
- ✅ Links work correctly

---

### Phase 9: Testing & QA (Day 6-7)

#### TICKET-21: End-to-End Testing
**Priority**: CRITICAL
**Effort**: 4 hours
**Dependencies**: All implementation tickets

**Test Scenarios:**
1. **Complete Purchase Flow - BASIC Tier:**
   - Sign up new account
   - Browse products
   - Add Basic Tee (Black, L) with BASIC tier to cart
   - Checkout with Stripe test card (4242 4242 4242 4242)
   - Verify payment success
   - Verify order appears in account
   - Generate 1 design
   - Verify design displays
   - Try to generate 2nd design (should be blocked)
   - Approve design
   - Verify fulfillment submitted to Printful

2. **Complete Purchase Flow - PREMIUM Tier:**
   - Same as above but with PREMIUM tier
   - Generate multiple designs (3+)
   - Verify all work without limit

3. **Webhook Testing:**
   - Test Clerk webhook (create user)
   - Test Stripe webhook (payment success)
   - Verify database updates correctly

4. **Error Scenarios:**
   - Invalid Clerk token
   - Expired checkout session
   - Failed AI generation
   - Failed Printful submission
   - Network errors

5. **Edge Cases:**
   - Guest checkout (if supported)
   - Multiple orders same user
   - Cancel checkout
   - Refund request

**Tools:**
- Manual testing via browser
- Postman for API testing
- Stripe CLI for webhook testing
- Network throttling for error testing

**Acceptance Criteria:**
- ✅ All test scenarios pass
- ✅ No console errors
- ✅ All integrations working
- ✅ Error handling graceful
- ✅ Performance acceptable

---

#### TICKET-22: Bug Fixes & Polish
**Priority**: HIGH
**Effort**: Flexible (allocate 4-6 hours)
**Dependencies**: TICKET-21

**Tasks:**
1. Fix all bugs found during testing
2. Polish UI/UX issues:
   - Consistent spacing and alignment
   - Proper loading states everywhere
   - Clear error messages
   - Intuitive navigation
3. Performance optimization:
   - Image optimization
   - Code splitting (if needed)
   - API response caching (if applicable)
4. Accessibility improvements:
   - Proper ARIA labels
   - Keyboard navigation
   - Screen reader support
5. Mobile responsiveness:
   - Test on multiple screen sizes
   - Fix any layout issues

**Acceptance Criteria:**
- ✅ All known bugs fixed
- ✅ UI polished and consistent
- ✅ Performance meets standards
- ✅ Accessible to users with disabilities
- ✅ Works on mobile devices

---

### Phase 10: Deployment (Day 7)

#### TICKET-23: Backend Deployment to Heroku
**Priority**: CRITICAL
**Effort**: 2 hours
**Dependencies**: All backend tickets

**Tasks:**
1. Verify all environment variables set on Heroku:
   ```bash
   heroku config -a gptees-2026
   ```
2. Ensure DATABASE_URL points to Supabase
3. Commit and push backend changes:
   ```bash
   git add backend/
   git commit -m "Backend implementation complete"
   git push origin main
   ```
4. Deploy to Heroku:
   ```bash
   git push heroku main
   ```
5. Run database migrations on Heroku:
   ```bash
   heroku run "cd backend && npx prisma migrate deploy" -a gptees-2026
   ```
6. Check logs for errors:
   ```bash
   heroku logs --tail -a gptees-2026
   ```
7. Test health endpoint: https://gptees-2026-a039a07e6329.herokuapp.com/api/health
8. Configure Clerk webhook URL in Clerk dashboard:
   - https://gptees-2026-a039a07e6329.herokuapp.com/api/webhooks/clerk
9. Configure Stripe webhook URL in Stripe dashboard:
   - https://gptees-2026-a039a07e6329.herokuapp.com/api/webhooks/stripe

**Acceptance Criteria:**
- ✅ Backend deployed successfully
- ✅ Health endpoint responds 200 OK
- ✅ Database migrations applied
- ✅ All environment variables set
- ✅ Webhooks configured correctly
- ✅ No errors in logs

---

#### TICKET-24: Frontend Deployment to Vercel
**Priority**: CRITICAL
**Effort**: 2 hours
**Dependencies**: TICKET-23

**Tasks:**
1. Create Vercel project:
   - Go to vercel.com
   - Import GitHub repository
   - Select root directory as `frontend`
2. Configure build settings:
   - Build Command: `npm run build`
   - Output Directory: `dist`
   - Install Command: `npm install`
3. Set environment variables in Vercel:
   - VITE_CLERK_PUBLISHABLE_KEY=pk_live_...
   - VITE_API_URL=https://gptees-2026-a039a07e6329.herokuapp.com
4. Deploy
5. Configure custom domain (gptees.app):
   - Add domain in Vercel dashboard
   - Update DNS records as instructed
6. Update FRONTEND_URL on Heroku:
   ```bash
   heroku config:set FRONTEND_URL="https://gptees.app" -a gptees-2026
   ```
7. Test complete flow on production

**Acceptance Criteria:**
- ✅ Frontend deployed to Vercel
- ✅ Custom domain working (gptees.app)
- ✅ Environment variables set correctly
- ✅ API calls work to Heroku backend
- ✅ Clerk authentication works
- ✅ Stripe checkout works
- ✅ Complete purchase flow works end-to-end

---

#### TICKET-25: Production Monitoring & Launch
**Priority**: HIGH
**Effort**: 1 hour
**Dependencies**: TICKET-24

**Tasks:**
1. Set up monitoring:
   - Configure Heroku logs
   - Set up error tracking (Sentry optional)
   - Monitor webhook delivery in Clerk and Stripe dashboards
2. Create operations checklist:
   - Daily: Check error logs
   - Weekly: Review order fulfillment
   - Monthly: Review analytics
3. Document deployment process:
   - README with deployment instructions
   - Environment variable documentation
   - Troubleshooting guide
4. Final smoke test:
   - Test on multiple devices
   - Test with real credit card (small amount)
   - Verify order goes to Printful
5. Announce launch!

**Acceptance Criteria:**
- ✅ Monitoring configured
- ✅ Operations checklist created
- ✅ Documentation complete
- ✅ Final smoke test passed
- ✅ Ready for real customers 🚀

---

## Summary of Deliverables

### Backend (Express + TypeScript)
- ✅ Prisma database with Supabase PostgreSQL
- ✅ Clerk authentication with webhook sync
- ✅ Stripe checkout and webhook handler
- ✅ OpenAI DALL-E 3 integration
- ✅ S3 image upload and storage
- ✅ Printful order fulfillment
- ✅ Resend email notifications
- ✅ RESTful API with 7 route modules
- ✅ Error handling and validation
- ✅ Deployed to Heroku

### Frontend (React + TypeScript + Vite)
- ✅ Clerk authentication UI
- ✅ Product catalog and shopping
- ✅ Shopping cart with localStorage
- ✅ Stripe Checkout integration
- ✅ AI design generator interface
- ✅ Account page with order history
- ✅ Responsive Tailwind CSS styling
- ✅ Toast notifications and loading states
- ✅ Deployed to Vercel with custom domain

### Integrations (All with Valid Keys)
- ✅ Clerk - User authentication
- ✅ Stripe - Payment processing
- ✅ OpenAI - DALL-E 3 design generation
- ✅ Printful - Order fulfillment
- ✅ Resend - Email notifications
- ✅ AWS S3 - Image storage
- ✅ Supabase - PostgreSQL database

---

## Development Workflow

### Daily Standups
- Review previous day's tickets
- Identify blockers
- Assign today's tickets
- Target: 3-4 tickets per day per developer

### Code Review
- All code reviewed before merge
- Focus on functionality over perfection
- Priority: working features over clean code

### Testing
- Test each ticket before marking complete
- End-to-end test daily
- Fix bugs immediately

### Communication
- Use Slack/Discord for real-time updates
- Document decisions in ticket comments
- Share screenshots/videos of progress

---

## Known Issues from Original Project

### 1. Printful Integration (80% complete)
**Problem**: Designs not submitting correctly to Printful
**Likely Cause**:
- Image URL not publicly accessible
- Image format/size incorrect
- Variant ID mismatch
**Solution**:
- Ensure S3 images have public-read ACL or signed URLs
- Verify image dimensions (300 DPI recommended)
- Double-check Printful variant IDs match products

### 2. Database Migration from SQLite to PostgreSQL
**Original**: Used SQLite for development
**New**: Using Supabase PostgreSQL from start
**Changes Needed**:
- Update Prisma schema datasource to postgresql
- Replace Float with Decimal for monetary values
- Update JSON field handling (native JSON type in PostgreSQL)

### 3. Mobile Responsiveness
**Original**: Some pages not fully mobile-optimized
**Solution**: Test all pages on mobile during development, use Tailwind mobile-first approach

---

## Success Metrics

### Week 1 Goals
- ✅ All 25 tickets completed
- ✅ Backend and frontend deployed
- ✅ End-to-end purchase flow working
- ✅ All integrations functional
- ✅ Ready for customer use

### Launch Readiness Checklist
- [ ] All tickets completed
- [ ] End-to-end testing passed
- [ ] Production deployment successful
- [ ] Custom domain configured
- [ ] Webhooks configured and tested
- [ ] Email notifications working
- [ ] Printful orders submitting correctly
- [ ] Legal pages published
- [ ] Operations documentation complete
- [ ] Error monitoring configured

---

## Additional Resources

### API Documentation (to be created)
- Backend API endpoints reference
- Request/response examples
- Authentication requirements
- Error codes

### User Guide (to be created)
- How to use the platform
- Tier selection guide
- Design tips
- Order tracking

### Admin Documentation (future)
- How to manage orders
- Refund process
- Customer support procedures

---

## Notes for AI Dev Team

1. **Start with database schema** - Everything depends on it
2. **Test integrations early** - Don't wait until the end to test Stripe/Clerk/OpenAI
3. **Use TypeScript strictly** - Catch errors at compile time
4. **Mobile-first CSS** - Use Tailwind's responsive utilities from the start
5. **Error handling first** - Add error handling as you write code, not after
6. **Log everything** - Console.log liberally during development
7. **Don't over-engineer** - Focus on MVP functionality, not perfect code
8. **Test webhooks locally** - Use Stripe CLI and Clerk CLI for local webhook testing
9. **Commit frequently** - Small commits with clear messages
10. **Ask questions early** - Don't spend hours stuck on something

---

## Contact & Support

**Project Owner**: ChrisFox.eth
**GitHub**: https://github.com/ChrisFox-Eth/2026GPTees
**Backend**: https://gptees-2026-a039a07e6329.herokuapp.com
**Frontend**: https://gptees.app (to be deployed)

---

**This plan is designed to be executed by an AI development team within 7 days. All infrastructure, API keys, and services are already configured. Focus on implementation, testing, and deployment.**

🚀 **Good luck building 2026GPTees!**
