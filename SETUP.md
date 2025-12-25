# Backend Sync Setup Guide

## What Was Added

This app now has backend sync capabilities using Vercel Postgres. When Lahari updates something, Yashwanth can see it in real-time (with 30-second auto-refresh).

## Setup Steps

### 1. Install Dependencies

```bash
npm install
```

### 2. Create Vercel Postgres Database

1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Select your project (or create a new one)
3. Go to **Storage** tab
4. Click **Create Database** → Select **Postgres**
5. Choose a name and region
6. Copy the connection strings

### 3. Set Environment Variables

In Vercel Dashboard:
1. Go to your project → **Settings** → **Environment Variables**
2. Add these variables:
   - `POSTGRES_URL` - The connection string from step 2
   - `POSTGRES_PRISMA_URL` - The Prisma connection string (if available)
   - `POSTGRES_URL_NON_POOLING` - The non-pooling connection string (if available)

For local development, create `.env.local` file:
```
POSTGRES_URL=your_connection_string_here
POSTGRES_PRISMA_URL=your_prisma_connection_string_here
POSTGRES_URL_NON_POOLING=your_non_pooling_connection_string_here
```

### 4. Run Database Migration

After creating the database, run the migration SQL:

1. Go to Vercel Dashboard → Your Database → **Data** tab
2. Click **SQL Editor**
3. Copy and paste the contents of `api/migrations/001_init.sql`
4. Run the SQL

Or use the Vercel CLI:
```bash
vercel env pull .env.local
vercel db execute api/migrations/001_init.sql
```

### 5. Deploy to Vercel

```bash
# If not already connected
vercel

# Deploy
vercel --prod
```

Or push to GitHub and Vercel will auto-deploy.

## How It Works

- **Local Cache**: Data is stored in IndexedDB for fast access and offline support
- **Immediate Sync**: All CRUD operations (Create, Update, Delete) immediately sync to server
- **Periodic Fetch**: Fetches other user's updates every 60 seconds
- **Real-time Updates**: When one user makes a change, it's saved to server immediately. The other user sees it within 60 seconds (or on next action)
- **Offline Support**: App works offline using cached data, syncs when back online

## API Endpoints

- `GET /api/sessions` - Get all sessions (optional: `?userId=Yashwanth&date=2024-01-01`)
- `POST /api/sessions` - Create a new session
- `GET /api/sessions/[id]` - Get a specific session
- `PUT /api/sessions/[id]` - Update a session
- `DELETE /api/sessions/[id]` - Delete a session
- `GET /api/settings?userId=Yashwanth` - Get user settings
- `POST /api/settings` - Update a setting

## Sync Status Indicator

- **Green dot**: Synced successfully
- **Pulsing blue dot**: Currently syncing
- **Gray dot**: Not synced yet or offline

## Troubleshooting

1. **Database connection errors**: Check that `POSTGRES_URL` is set correctly
2. **API routes not working**: Ensure `vercel.json` is in the root and API files are in `api/` folder
3. **Sync not working**: Check browser console for errors, verify API endpoints are accessible

## Notes

- First time setup: Existing local data will be migrated to the server on first sync
- The app works offline - changes are queued and synced when online
- Both users share the same database but have separate user IDs (Yashwanth/Lahari)

