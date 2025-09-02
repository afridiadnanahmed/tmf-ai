# Database Setup Guide

## Prerequisites
- PostgreSQL installed locally or access to a cloud PostgreSQL service

## Configuration Steps

### 1. Update Database Connection
Edit `.env.local` and replace the DATABASE_URL with your actual database connection string:

```bash
DATABASE_URL="postgresql://username:password@localhost:5432/your_database_name"
```

### Popular Database Options:
- **Local PostgreSQL**: `postgresql://username:password@localhost:5432/dbname`
- **Vercel Postgres**: Available in Vercel dashboard
- **Supabase**: Get connection string from Supabase dashboard
- **Neon**: Get connection string from Neon dashboard
- **Railway**: Get connection string from Railway dashboard

### 2. Generate and Run Migrations

Generate migration files:
```bash
npm run db:generate
```

Push schema to database (development):
```bash
npm run db:push
```

Or run migrations (production):
```bash
npm run db:migrate
```

### 3. View Database (Optional)
Launch Drizzle Studio to view and manage your database:
```bash
npm run db:studio
```

## Database Schema

The database includes the following tables:
- **users**: User accounts
- **posts**: Social media posts with scheduling
- **messages**: CRM messages (email, SMS, chat)
- **contacts**: CRM contacts
- **integrations**: Third-party platform integrations

## Next Steps
1. Update `.env.local` with your database credentials
2. Run `npm run db:push` to create tables
3. Start developing with `npm run dev`