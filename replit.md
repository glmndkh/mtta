# MTTA Table Tennis Management System

## Overview

This is a full-stack web application for the Mongolian Table Tennis Association (MTTA) that manages tournaments, clubs, players, and leagues. The system provides a comprehensive platform for table tennis tournament management, player registration, club administration, and news management.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

The application follows a modern full-stack architecture with clear separation between frontend and backend:

- **Frontend**: React with TypeScript, using Vite as the build tool
- **Backend**: Express.js with TypeScript
- **Database**: PostgreSQL with Drizzle ORM
- **Authentication**: Replit-based OAuth integration
- **Styling**: Tailwind CSS with Radix UI components (shadcn/ui)

## Key Components

### Frontend Architecture
- **Framework**: React 18 with TypeScript
- **Routing**: Wouter for client-side routing
- **State Management**: TanStack Query (React Query) for server state
- **UI Library**: Radix UI primitives with shadcn/ui components
- **Styling**: Tailwind CSS with custom MTTA branding
- **Form Handling**: React Hook Form with Zod validation

### Backend Architecture
- **Framework**: Express.js with TypeScript
- **Database ORM**: Drizzle with PostgreSQL
- **Authentication**: Custom session-based authentication (replaced OAuth)
- **Session Management**: Express sessions with PostgreSQL store
- **API Design**: RESTful API with JSON responses

### Database Schema
The application uses a comprehensive schema for table tennis management:

- **Users**: Core user authentication and profile data
- **Players**: Player profiles with dual ranking system (all ages & own age), admin-assigned ranks, achievements
- **Clubs**: Club management with ownership and membership systems
- **Tournaments**: Tournament creation and management
- **Matches**: Match records with set-by-set scoring
- **Teams**: Team management for league play
- **Leagues**: League systems with standings
- **News**: News and announcements system
- **Memberships**: Player-club relationships with payment tracking
- **Achievements**: Player achievement system with categories

## Recent Changes (January 2025)

### Tournament Management System Enhancement
- **Rich Text Editor Integration**: Added TipTap rich text editor with image, video, and file embedding capabilities
- **Comprehensive Tournament Creation**: Built advanced admin interface for creating tournaments with rich descriptions
- **Customizable Participation Types**: System supports default types (Singles, Doubles, Mixed Doubles, Team) plus custom types
- **Enhanced Database Schema**: Added rich_description, participation_types, entry_fee, registration_deadline, and other tournament fields
- **Admin Interface Streamlining**: Simplified admin home page to focus on core tournament management functions
- **Preview Mode**: Tournament creation includes preview functionality to see how tournaments will appear
- **Post-submission Editing**: Tournaments can be edited after creation with full CRUD operations

## Recent Changes (January 2025)

### Player Dashboard Updates
- **Dual Ranking System**: Split ranking into "All Ages" and "Own Age" categories
- **Admin-Assigned Ranks**: Added rank field that can be set by administrators
- **Achievements Section**: New achievement display with categorized accomplishments
- **Match History**: Changed from "Last Match" to comprehensive "Match History" view
- **Membership Payment Tracking**: Added display of payment dates in membership information
- **Removed Active Tournaments**: Streamlined dashboard by removing active tournaments section

### Admin Tournament Management
- **Tournament Results Entry**: New admin interface for entering match results
- **Tournament Match Management**: Admins can view and manage tournament matches
- **Score Recording**: Admin and score recorder roles can update match results
- **Achievement Creation**: Admins can create achievements for players

### Authentication System Overhaul
- **Replaced OAuth**: Completely removed Replit OAuth in favor of simple email/phone registration
- **Session-Based Auth**: Implemented custom session-based authentication system
- **Role-Based Access**: Enhanced role management (player, club_owner, admin, score_recorder)

## Data Flow

1. **Authentication Flow**: Users authenticate via Replit OAuth, with session data stored in PostgreSQL
2. **API Communication**: Frontend communicates with backend through RESTful APIs using TanStack Query
3. **Database Operations**: Backend uses Drizzle ORM for type-safe database operations
4. **Real-time Updates**: Query invalidation ensures UI stays synchronized with server state

## External Dependencies

### Core Dependencies
- **@neondatabase/serverless**: Serverless PostgreSQL connection for Neon database
- **drizzle-orm**: Type-safe ORM for database operations
- **@tanstack/react-query**: Server state management
- **@radix-ui/react-***: Headless UI primitives
- **tailwindcss**: Utility-first CSS framework
- **passport**: Authentication middleware
- **express-session**: Session management

### Authentication Integration
- Custom Replit OAuth implementation using OpenID Connect
- Session persistence in PostgreSQL
- Role-based access control (player, club_owner, admin, score_recorder)

### UI Component System
- shadcn/ui component library built on Radix UI
- Consistent design system with MTTA branding
- Responsive design with mobile-first approach

## Deployment Strategy

The application is designed for deployment on Replit with the following configuration:

- **Development**: `npm run dev` - Runs both frontend and backend in development mode
- **Build**: `npm run build` - Builds frontend with Vite and backend with esbuild
- **Production**: `npm start` - Serves the built application
- **Database**: Uses environment variable `DATABASE_URL` for PostgreSQL connection
- **Sessions**: Requires `SESSION_SECRET` for session encryption

### Environment Requirements
- `DATABASE_URL`: PostgreSQL connection string
- `SESSION_SECRET`: Secret for session encryption
- `REPL_ID`: Replit environment identifier
- `ISSUER_URL`: OAuth issuer URL (defaults to Replit OIDC)
- `REPLIT_DOMAINS`: Allowed domains for Replit integration

The application includes Replit-specific integrations like the development banner and Cartographer plugin for enhanced development experience within the Replit environment.