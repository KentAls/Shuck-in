# Shuck-in

The ultimate team sports management app. A modern alternative to TeamSnap and BenchApp.

## Features

- **Team Management** - Create teams, invite players, manage rosters
- **Game Scheduling** - Schedule games and practices with calendar sync
- **Game Check-in (RSVP)** - Know who's showing up with instant RSVP status
- **Real-time Chat** - Team communication in one place
- **SMS Reminders** - Auto-remind players who haven't checked in
- **PWA Support** - Install on mobile for native app experience
- **Modern UI** - Sleek dark theme with Material UI

## Tech Stack

- **Framework**: Next.js 14 with App Router
- **Language**: TypeScript
- **UI**: Material UI with custom dark theme
- **Database**: PostgreSQL with Prisma ORM
- **Auth**: NextAuth.js (Google + Email magic links)
- **SMS**: Twilio
- **Real-time**: Pusher (optional)
- **Deployment**: Vercel

## Getting Started

### Prerequisites

- Node.js 18+
- PostgreSQL database
- Twilio account (for SMS)
- Google OAuth credentials (for auth)

### Installation

1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```

3. Copy environment variables:
   ```bash
   cp .env.example .env
   ```

4. Configure your `.env` file with:
   - Database URL
   - NextAuth secret and URL
   - Google OAuth credentials
   - Twilio credentials

5. Push database schema:
   ```bash
   npm run db:push
   ```

6. Start the development server:
   ```bash
   npm run dev
   ```

## Deployment

### Vercel (Recommended)

1. Push your code to GitHub
2. Import to Vercel
3. Configure environment variables
4. Deploy!

### Database

For production, we recommend:
- **Vercel Postgres** - Integrated with Vercel
- **Supabase** - Great free tier
- **Neon** - Serverless Postgres

## Project Structure

```
src/
├── app/                    # Next.js App Router
│   ├── (app)/             # Authenticated routes
│   │   ├── dashboard/     # Main dashboard
│   │   ├── team/          # Team management
│   │   ├── schedule/      # Game scheduling
│   │   ├── chat/          # Team chat
│   │   └── settings/      # User settings
│   ├── api/               # API routes
│   ├── auth/              # Auth pages
│   └── onboarding/        # New user onboarding
├── components/            # React components
│   ├── landing/          # Landing page
│   ├── layout/           # App shell & navigation
│   └── providers/        # Context providers
├── lib/                  # Utilities
│   ├── auth.ts          # NextAuth config
│   ├── prisma.ts        # Prisma client
│   └── twilio.ts        # SMS service
├── theme/               # MUI theme config
└── types/               # TypeScript types
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

## License

MIT
