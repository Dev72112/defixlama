# Supabase Setup Guide for DeFi Lama

This guide will help you set up the authentication system with Supabase.

## Step 1: Create a Supabase Project

1. Go to [https://supabase.com](https://supabase.com)
2. Click "Start Your Project"
3. Sign up or log in
4. Create a new project in your organization
5. Note your **Project URL** and **Anon Public Key** (from Settings > API)

## Step 2: Update Environment Variables

Update your `.env.local` file with your Supabase credentials:

```
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=your-anon-key
```

## Step 3: Create the user_profiles Table

The DeFi Lama app needs a `user_profiles` table to store subscription and billing information.

### Option A: Using the Migration File (Recommended)

1. Go to your Supabase dashboard
2. Navigate to **SQL Editor**
3. Click **New Query**
4. Copy the entire contents of `/supabase_migrations/001_create_user_profiles.sql`
5. Paste it into the SQL editor
6. Click **Run**
7. Verify the table was created by checking **Table Editor** > `user_profiles`

### Option B: Manual Setup

If you prefer to create the table manually:

1. Go to **Table Editor** in Supabase
2. Click **Create a new table**
3. Name it `user_profiles`
4. Add the following columns:

| Column Name | Type | Default | Other |
|------------|------|---------|-------|
| id | uuid | - | Primary Key, Foreign Key to auth.users |
| email | text | - | Unique |
| display_name | text | - | Nullable |
| avatar_url | text | - | Nullable |
| subscription_tier | text | 'free' | - |
| subscription_status | text | 'active' | - |
| subscription_expires_at | timestamp | - | Nullable |
| api_key_quota | int8 | 100 | - |
| alerts_count | int8 | 1 | - |
| payment_method | text | - | Nullable |
| stripe_customer_id | text | - | Nullable |
| last_payment_date | timestamp | - | Nullable |
| created_at | timestamp | now() | - |
| updated_at | timestamp | now() | - |

## Step 4: Set Up Row Level Security (RLS)

RLS ensures users can only access their own data:

1. Go to **Authentication** > **Policies**
2. Select the `user_profiles` table
3. Enable RLS
4. Add these policies:
   - **SELECT**: `auth.uid() = id` (users see own profile)
   - **UPDATE**: `auth.uid() = id` (users update own profile)
   - **INSERT**: `auth.uid() = id` (users create own profile)

If you ran the SQL migration, these policies are already created!

## Step 5: Configure OAuth (Optional)

To enable sign-up with Google/GitHub:

1. Go to **Authentication** > **Providers**
2. Enable **Google** or **GitHub**
3. Add your OAuth credentials from Google/GitHub developer console

## Step 6: Test the Setup

1. Start the dev server: `npm run dev`
2. Go to `/auth` page
3. Try signing up with email or OAuth
4. Verify the user appears in Supabase under **Authentication** > **Users**
5. Check **Table Editor** > `user_profiles` for new profile entries

## API vs Service Role Keys

- **Anon Public Key** (in `.env.local`): Used by frontend, respects RLS policies
- **Service Role Key** (keep secret!): For backend operations, bypasses RLS
  - Store in `.env` file (never commit!)
  - Use only in server-side code

## Troubleshooting

**Error: "user_profiles" relation does not exist**
- The table hasn't been created yet
- Run the SQL migration from Step 3

**Error: RLS policy violation**
- Make sure the user is authenticated
- Check that the RLS policies match the user's ID
- Verify `auth.uid()` matches the user ID in `user_profiles.id`

**OAuth not working**
- Verify your OAuth credentials are correct
- Check the OAuth provider's redirect URI matches Supabase

## Next Steps

1. Users can now sign up in Auth.tsx
2. Subscription tiers are managed in `user_profiles.subscription_tier`
3. BillingPage can query/update subscription info
4. Premium features gate against tier level

For more info: [Supabase Docs](https://supabase.com/docs)
