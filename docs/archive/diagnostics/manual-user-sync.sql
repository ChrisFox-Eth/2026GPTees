-- Manual User Sync to Supabase
-- Use this if the Clerk webhook hasn't synced your user yet

-- INSTRUCTIONS:
-- 1. Get your Clerk User ID from: https://dashboard.clerk.com → Users → Click your user → Copy "User ID"
-- 2. Replace 'user_YOUR_CLERK_ID_HERE' with your actual Clerk ID (starts with user_)
-- 3. Replace 'your-email@example.com' with your actual email
-- 4. Replace 'Your' and 'Name' with your actual first/last name (or leave as NULL)
-- 5. Run this in Supabase SQL Editor: https://supabase.com/dashboard → SQL Editor

INSERT INTO users (
  id,
  "clerkId",
  email,
  "firstName",
  "lastName",
  "createdAt",
  "updatedAt"
) VALUES (
  gen_random_uuid(),  -- Auto-generate UUID
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

-- After running this, verify the user was created:
SELECT * FROM users WHERE "clerkId" = 'user_YOUR_CLERK_ID_HERE';

-- You should see your user with:
-- - id (UUID)
-- - clerkId (starts with user_)
-- - email
-- - firstName, lastName
-- - createdAt, updatedAt timestamps
