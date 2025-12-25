# Vercel Environment Variables Setup Guide

## How to Add Environment Variables to Vercel

1. Go to your Vercel project dashboard
2. Navigate to **Settings** → **Environment Variables**
3. Add each variable one by one using the format below

## Required Environment Variables

### For Production, Preview, and Development:

Copy and paste these into Vercel's environment variables interface:

```
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBlaG9vY2ZhYmFmbnZyYmRrcGJhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjY2NTgyNTksImV4cCI6MjA4MjIzNDI1OX0.lXYKym8jsOL4IaDhNiyhJlaSxclQ-T_BJ79C1b9rolw

NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=sb_publishable_WyzjMrcVXPo5ah8uHS3zJg_fEOnrO3n

NEXT_PUBLIC_SUPABASE_URL=https://pehoocfabafnvrbdkpba.supabase.co

POSTGRES_PRISMA_URL=postgres://postgres.pehoocfabafnvrbdkpba:sOgckRGYXm80BGIx@aws-1-us-east-1.pooler.supabase.com:6543/postgres?sslmode=require&pgbouncer=true

POSTGRES_URL=postgres://postgres.pehoocfabafnvrbdkpba:sOgckRGYXm80BGIx@aws-1-us-east-1.pooler.supabase.com:6543/postgres?sslmode=require&supa=base-pooler.x

POSTGRES_URL_NON_POOLING=postgres://postgres.pehoocfabafnvrbdkpba:sOgckRGYXm80BGIx@aws-1-us-east-1.pooler.supabase.com:5432/postgres?sslmode=require
```

### Optional (if needed for your app):

```
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBlaG9vY2ZhYmFmbnZyYmRrcGJhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjY2NTgyNTksImV4cCI6MjA4MjIzNDI1OX0.lXYKym8jsOL4IaDhNiyhJlaSxclQ-T_BJ79C1b9rolw

SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBlaG9vY2ZhYmFmbnZyYmRrcGJhIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NjY1ODI1OSwiZXhwIjoyMDgyMjM0MjU5fQ.ZqmXaE6FW5cnv7YF_sBk4qDlzOyLiYJGxmAtmdlMBcs
```

## Quick Steps:

1. **Open Vercel Dashboard** → Your Project → **Settings** → **Environment Variables**
2. **Click "Add New"** for each variable
3. **Enter the Key** (left side) and **Value** (right side)
4. **Select environment** (Production, Preview, Development - or all)
5. **Click "Save"**
6. **Redeploy** your project for changes to take effect

## Important Notes:

- The `POSTGRES_URL` is the most critical one for your backend API routes
- `NEXT_PUBLIC_*` variables are exposed to the browser (client-side)
- Non-`NEXT_PUBLIC_*` variables are server-side only
- After adding variables, you need to **redeploy** for them to take effect

## For Local Development:

Create a `.env.local` file in your project root with the same variables (without the `NEXT_PUBLIC_` prefix for server-side vars if using Vite).

