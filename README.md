# The Meta Future AI

A comprehensive social media management and CRM platform built with Next.js, TypeScript, and PostgreSQL. This application provides tools for managing social media posts, customer relationships, and multi-platform integrations.

## Features

- **User Authentication & Authorization**
  - Secure user registration and login
  - Role-based access control (RBAC)
  - User management system

- **Social Media Management**
  - Schedule and publish posts across multiple platforms
  - Support for Facebook, Twitter, Instagram, LinkedIn, and YouTube
  - Post scheduling and automated publishing
  - Analytics and engagement tracking

- **CRM Capabilities**
  - Contact management
  - Message tracking (Email, SMS, Chat)
  - Customer interaction history
  - Tags and metadata for contact organization

- **Platform Integrations**
  - Multi-platform OAuth integration
  - Secure token management
  - Automated token refresh

## Tech Stack

- **Frontend**: Next.js 15, React 19, TypeScript
- **Styling**: Tailwind CSS, Radix UI components
- **Database**: PostgreSQL with Drizzle ORM
- **Authentication**: bcryptjs for password hashing
- **Forms**: React Hook Form with Zod validation
- **UI Components**: shadcn/ui components

## Prerequisites

- Node.js 18+ and npm
- PostgreSQL database (local or cloud)
- Environment variables configured

## Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd tmfai
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Configure environment variables**
   
   Create a `.env.local` file with your database credentials:
   ```env
   DATABASE_URL="postgresql://username:password@localhost:5432/your_database_name"
   ```

   Supported database providers:
   - Local PostgreSQL
   - Vercel Postgres
   - Supabase
   - Neon
   - Railway

4. **Set up the database**
   
   Generate database schema:
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

5. **Start the development server**
   ```bash
   npm run dev
   ```

   Open [http://localhost:3000](http://localhost:3000) to view the application.

## Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint
- `npm run db:generate` - Generate Drizzle migrations
- `npm run db:migrate` - Run database migrations
- `npm run db:push` - Push schema to database (development)
- `npm run db:studio` - Open Drizzle Studio for database management

## Database Schema

The application uses the following main tables:

- **users** - User accounts with authentication
- **roles** - Role definitions for RBAC
- **user_roles** - User-role assignments
- **posts** - Social media posts with scheduling
- **messages** - CRM messages (email, SMS, chat)
- **contacts** - CRM contact information
- **integrations** - Third-party platform connections

## Project Structure

```
tmfai/
├── app/                  # Next.js app directory
│   ├── dashboard/       # Dashboard pages
│   ├── contact/         # Contact page
│   └── ...             # Other pages
├── components/          # React components
│   ├── ui/             # UI components
│   └── auth-modals.tsx # Authentication modals
├── lib/                # Utility functions
│   └── db/            # Database schema and utilities
├── drizzle/           # Database migrations
├── hooks/             # Custom React hooks
├── public/            # Static assets
└── styles/            # Global styles
```

## Development Workflow

1. **Database Changes**: Modify schema in `lib/db/schema.ts`, then run `npm run db:generate` and `npm run db:push`
2. **Component Development**: UI components are in `components/ui/`
3. **Page Development**: Add new pages in the `app/` directory
4. **API Routes**: Create API routes in `app/api/`

## Deployment

The application can be deployed to various platforms:

- **Vercel**: Optimized for Next.js applications
- **Railway**: Full-stack deployment with PostgreSQL
- **Heroku**: Traditional PaaS deployment
- **Docker**: Containerized deployment

Ensure all environment variables are properly configured in your deployment platform.

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is proprietary software. All rights reserved.

## Support

For issues, questions, or suggestions, please open an issue in the repository.