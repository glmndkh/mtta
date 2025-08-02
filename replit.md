# Mongolian Table Tennis Association Web Application

## Project Overview
A comprehensive web application for the Mongolian Table Tennis Association that streamlines tournament management and player engagement through digital solutions.

## Key Technologies
- React TypeScript frontend with dynamic tournament management
- Node.js/Express backend with flexible tournament creation
- PostgreSQL database with Drizzle ORM
- Tailwind CSS for responsive, mobile-first design
- Password-based authentication system with plain text storage
- Full internationalization with comprehensive Mongolian language support

## Recent Changes

### Tournament Results Management System (August 2025)
- **Comprehensive tournament results system** with both admin input and user viewing capabilities
- **Excel-style admin interface** for group stage and knockout bracket management with dynamic row/column controls
- **Player auto-suggestion and linking** using intelligent search with profile connections
- **Structured results viewing** with group stage tables and visual knockout brackets for users
- **Advanced tournament results database schema** supporting both group stage and knockout formats with player references
- **Conditional UI elements** including "View Results" button that only appears when tournaments are completed
- **Admin-only results input interface** with secure authentication and role-based access control
- **Complete API integration** with tournament results endpoints for saving, retrieving, and publishing results

### Password Storage Update (August 2025)
- **Plain text password storage** implemented as requested by user
- **Authentication system updated** to compare passwords directly without encryption
- **Profile update functionality** modified to work with plain text password verification

### User Profile Management System (August 2025)
- **Comprehensive user profile update functionality** allowing users to modify all registration information
- **Enhanced security with password confirmation** requiring current password verification before any changes
- **Credential change warnings** with clear notifications when email or phone numbers are updated
- **Robust duplicate prevention** during profile updates, excluding the current user from duplicate checks
- **Complete registration system** with comprehensive data collection (name, gender, DOB, phone, email, club affiliation)
- **Database migration completed** with unique constraints and proper schema for all user fields
- **Navigation integration** added profile management links to user interface
- **Full system testing verified** for registration, profile updates, duplicate prevention, and authentication

### Authentication Features
- **Registration**: Requires email/phone, name, password (min 6 chars), and role
- **Login**: Requires email/phone and password
- **Password Storage**: Passwords stored in plain text format (as requested by user)
- **Session Management**: Simple session-based authentication
- **Form Validation**: Client-side validation with Zod schemas
- **Error Handling**: Comprehensive error messages in Mongolian

## User Preferences
- Language: Mongolian language throughout the interface
- Authentication: Password-required login system
- UI Framework: shadcn/ui components with Tailwind CSS
- Form Handling: react-hook-form with Zod validation

## Project Architecture

### Frontend Structure
- `/client/src/pages/login.tsx` - Password-enabled login form
- `/client/src/pages/register.tsx` - Registration form with password confirmation
- `/client/src/pages/landing.tsx` - Landing page with auth options
- `/client/src/pages/tournament-page.tsx` - Tournament details with conditional results viewing
- `/client/src/pages/tournament-results.tsx` - User tournament results viewing with structured display
- `/client/src/pages/admin-tournament-results.tsx` - Admin Excel-style results input interface
- `/client/src/components/navigation.tsx` - Navigation with auth state

### Backend Structure
- `/server/routes.ts` - Authentication routes, tournament management, and results API endpoints
- `/server/storage.ts` - Database operations with tournament results support
- `/shared/schema.ts` - Database schema with tournament results table and player relationships

### Database Schema
- **users table**: Added `password` field (nullable for backward compatibility)
- **Authentication**: Email or phone + password required
- **Password Storage**: Stored in plain text format (as requested by user)

## Development Guidelines
- Follow fullstack_js guidelines for React/Node.js development
- Use Drizzle ORM for database operations
- Implement proper password security practices
- Maintain Mongolian language support throughout
- Use session-based authentication for simplicity