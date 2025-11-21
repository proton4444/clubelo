# Deploying to Vercel

This project is configured for easy deployment on Vercel with Vercel Postgres.

## Prerequisites

1. A [Vercel account](https://vercel.com/signup)
2. [Vercel CLI](https://vercel.com/docs/cli) installed (optional, can use dashboard)

## Quick Start

1. **Push to GitHub**: Make sure your code is committed and pushed to a GitHub repository.

2. **Import Project in Vercel**:
   - Go to your Vercel Dashboard
   - Click "Add New..." -> "Project"
   - Select your GitHub repository
   - Framework Preset: **Other** (or leave as default)
   - Root Directory: `./`

3. **Add Database (Vercel Postgres)**:
   - Once the project is created (or during creation), go to the **Storage** tab.
   - Click **Connect Store** -> **Create New** -> **Postgres**.
   - Accept the terms and create the database.
   - Vercel will automatically add environment variables (`POSTGRES_URL`, etc.) to your project.

4. **Configure Environment Variables**:
   - Go to **Settings** -> **Environment Variables**.
   - Add `CRON_SECRET`: Generate a random string (e.g., using `openssl rand -hex 32`). This protects your daily import jobs.

5. **Deploy**:
   - Vercel will automatically deploy your project.

## Database Setup

After deployment, you need to create the database tables.

1. **Get Connection String**:
   - In Vercel Dashboard -> Storage -> Postgres -> .env.local
   - Copy the `POSTGRES_URL`.

2. **Run Schema**:
   - You can run the schema SQL from your local machine connecting to the remote DB:
     ```bash
     psql "YOUR_POSTGRES_URL" -f schema.sql
     ```
   - Or use the Vercel Dashboard "Query" tab to paste and run the content of `schema.sql`.

## Automated Imports (Cron Jobs)

This project uses Vercel Cron Jobs to automatically import data daily.
- **Daily Ratings**: Runs at 06:00 UTC
- **Fixtures**: Runs at 07:00 UTC

These jobs call the API endpoints `/api/cron/import-daily` and `/api/cron/import-fixtures`.

## Troubleshooting

- **Database Connection**: If you see connection errors, ensure `POSTGRES_URL` is set in your environment variables.
- **Cron Jobs**: Check the "Logs" tab in Vercel to see if the cron jobs are running successfully.
