# FairShare - Expense Splitting Application

## Overview

FairShare is a full-stack expense splitting application that helps users track shared expenses with friends, coworkers, or roommates. Users can create groups, add expenses, and settle debts through an intuitive interface. The application features receipt scanning via AI vision, Stripe-based subscription management for premium features, and Replit Auth for user authentication.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **Framework**: React 18 with TypeScript
- **Routing**: Wouter (lightweight alternative to React Router)
- **State Management**: TanStack Query (React Query) for server state and caching
- **Styling**: Tailwind CSS with shadcn/ui component library (New York style variant)
- **Build Tool**: Vite with path aliases (@/, @shared/, @assets/)
- **Design Approach**: Mobile-first with responsive sidebar/bottom nav pattern

The frontend lives in `client/src/` with:
- `pages/` - Route components (Dashboard, GroupDetails, Subscription, Landing)
- `components/` - Reusable UI components and dialogs
- `hooks/` - Custom React hooks for data fetching (use-groups, use-expenses, use-auth, etc.)
- `lib/` - Utility functions and query client configuration

### Backend Architecture
- **Framework**: Express.js with TypeScript
- **Database ORM**: Drizzle ORM with PostgreSQL
- **Session Management**: express-session with connect-pg-simple for PostgreSQL session storage
- **API Pattern**: RESTful endpoints defined in `shared/routes.ts` with Zod validation

The backend lives in `server/` with:
- `index.ts` - Application entry point and middleware setup
- `routes.ts` - API route registration
- `storage.ts` - Database access layer (IStorage interface pattern)
- `db.ts` - Drizzle database connection

### Shared Code
The `shared/` directory contains code used by both frontend and backend:
- `schema.ts` - Drizzle table definitions (groups, expenses, settlements, etc.)
- `routes.ts` - API contract definitions with Zod schemas
- `models/auth.ts` - User and session schemas for Replit Auth

### Database Schema
Core tables:
- `users` - User profiles (Replit Auth managed)
- `sessions` - Session storage (Replit Auth managed)
- `groups` - Expense groups with currency
- `group_members` - Group membership junction table
- `expenses` - Individual expenses with amount, description, category
- `expense_splits` - How expenses are divided among members
- `settlements` - Payment records between users
- `subscriptions` - Premium subscription status

### Replit Integrations
Located in `server/replit_integrations/`:
- `auth/` - Replit OpenID Connect authentication with Passport.js
- `invoice/` - AI-powered receipt/invoice scanning using GPT-4o vision
- `chat/` - Conversation storage for AI chat features
- `audio/` - Voice recording and playback utilities
- `image/` - Image generation capabilities
- `batch/` - Rate-limited batch processing utilities

## Recent Changes

### January 27, 2026
- Added receipt scanning feature using GPT-4o vision AI
- Implemented smart payment split with 3 modes:
  - Equal split (with member inclusion/exclusion checkboxes)
  - Percentage split (with per-member percentage inputs)
  - Custom split (with per-member exact amount inputs)
- Integrated Stripe payment processing for Pro subscription (€2.99/month)
- Fixed login links on landing page to use anchor tags for server routes

## External Dependencies

### Authentication
- **Replit Auth**: OpenID Connect authentication via Replit's identity provider
- Sessions stored in PostgreSQL using connect-pg-simple

### Database
- **PostgreSQL**: Primary database (provisioned via Replit)
- **Drizzle ORM**: Type-safe database operations
- Schema migrations via `drizzle-kit push`

### Payments
- **Stripe**: Subscription management and payment processing
- `stripe-replit-sync` package for managed webhooks
- Customer portal for subscription management
- Products: FairShare Pro (€2.99/month)

### AI Services
- **OpenAI API** (via Replit AI Integrations): 
  - GPT-4o for invoice/receipt scanning
  - Image generation capabilities
  - Voice transcription

### Environment Variables Required
- `DATABASE_URL` - PostgreSQL connection string
- `SESSION_SECRET` - Session encryption key
- `REPL_ID` / `REPL_IDENTITY` - Replit identity tokens
- `ISSUER_URL` - Replit OIDC issuer
- `AI_INTEGRATIONS_OPENAI_API_KEY` - OpenAI API key for AI features
- `AI_INTEGRATIONS_OPENAI_BASE_URL` - OpenAI API base URL
- Stripe credentials managed via Replit Connectors