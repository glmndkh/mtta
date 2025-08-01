# Mongolian Table Tennis Association Web Application

## Project Overview
A comprehensive web application for the Mongolian Table Tennis Association that streamlines tournament management and player engagement through digital solutions.

## Key Technologies
- React TypeScript frontend with dynamic tournament management
- Node.js/Express backend with flexible tournament creation
- PostgreSQL database with Drizzle ORM
- Tailwind CSS for responsive, mobile-first design
- Password-based authentication system with bcrypt encryption
- Full internationalization with comprehensive Mongolian language support

## Recent Changes

### Comprehensive Registration System (August 2025)
- **Enhanced registration data collection** requiring first name, last name, gender, date of birth, phone, email, and club affiliation
- **Implemented robust duplicate prevention** blocking registration with existing email addresses or phone numbers
- **Added comprehensive validation** with specific error messages for each field requirement
- **Updated database schema** to include gender (enum), date_of_birth (timestamp), and club_affiliation (varchar) fields
- **Password-based authentication** with bcrypt encryption and minimum 6-character requirement
- **Database migration completed** with unique constraints on email and phone numbers
- **Full system testing verified** for registration, duplicate prevention, and login functionality

### Authentication Features
- **Registration**: Requires email/phone, name, password (min 6 chars), and role
- **Login**: Requires email/phone and password
- **Password Security**: Uses bcrypt with salt rounds of 10
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
- `/client/src/components/navigation.tsx` - Navigation with auth state

### Backend Structure
- `/server/routes.ts` - Authentication routes with password verification
- `/server/storage.ts` - Database operations with password support
- `/shared/schema.ts` - Database schema with password field

### Database Schema
- **users table**: Added `password` field (nullable for backward compatibility)
- **Authentication**: Email or phone + password required
- **Password Storage**: Hashed with bcrypt, never stored in plaintext

## Development Guidelines
- Follow fullstack_js guidelines for React/Node.js development
- Use Drizzle ORM for database operations
- Implement proper password security practices
- Maintain Mongolian language support throughout
- Use session-based authentication for simplicity