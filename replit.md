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

### Replit Environment Migration (August 2025)
- **Successfully migrated from Replit Agent to standard Replit environment**
- **Database setup completed** with PostgreSQL database provisioned and schema pushed
- **Authentication system adapted** for Replit environment with flexible OAuth configuration  
- **Session management configured** with proper session secret and PostgreSQL session store
- **All database tables created** including users, tournaments, matches, news, sponsors, and more
- **Application running successfully** on port 5000 with all API endpoints functional
- **Tournament creation tested and working** - API endpoints responding correctly
- **Authentication flow verified** - login/logout functionality working with session management
- **Migration completed successfully** - ready for continued development and feature additions

## Recent Changes

### Robust Theme System Implementation (August 2025)
- **Complete theme toggle system** implemented with dual compatibility (data-theme attribute + dark class)
- **Fixed theme persistence** using safe localStorage with iframe/SSR protection
- **Bulletproof CSS selectors** supporting both `[data-theme="dark"]` and `.dark` class strategies
- **Immediate DOM application** ensuring theme changes are visible on first paint
- **Enhanced profile page theming** with smooth transitions between light and dark modes
- **Theme toggle debugging** with comprehensive console logging for troubleshooting

### Tournament Creation Bug Fix (August 2025)
- **Critical tournament creation issue resolved** - fixed incorrect API call format in admin tournament generator
- **Frontend API call corrected** from `apiRequest('POST', '/api/tournaments', data)` to proper format with method and body parameters
- **Enhanced tournament creation logging** added to backend for better debugging and monitoring
- **Tournament filtering verification** confirmed published tournaments with "registration" status now display correctly
- **Tournament creation fully functional** - admin can now successfully create tournaments that appear in tournaments list

### Tournament Results Management System (August 2025)
- **Comprehensive tournament results system** with both admin input and user viewing capabilities
- **Excel-style admin interface** for group stage and knockout bracket management with dynamic row/column controls
- **Player auto-suggestion and linking** using intelligent search with profile connections
- **Structured results viewing** with group stage tables and visual knockout brackets for users
- **Advanced tournament results database schema** supporting both group stage and knockout formats with player references
- **Conditional UI elements** including "View Results" button that only appears when tournaments are completed
- **Admin-only results input interface** with secure authentication and role-based access control
- **Complete API integration** with tournament results endpoints for saving, retrieving, and publishing results

### Advanced Group Management System (August 2025)
- **Multi-group tournament support** with separate player lists and match results per group
- **Group creation functionality** with automatic naming (Group A, B, C, etc.)
- **Group deletion and renaming** with inline editing and safety constraints
- **Group selector interface** for easy navigation between multiple tournament groups
- **Player/team column separation** with distinct "Тамирчин" and "Баг" columns for individual tournaments
- **Enhanced group management UI** with player counts and visual group selection

### Match Creation System (August 2025)
- **Comprehensive match result input form** with team selection and individual player scoring
- **Set-by-set score tracking** following table tennis match format (up to 5 sets)
- **Visual match overview** with team logos and final score display
- **Individual player performance tracking** with detailed score input per set
- **Team vs team result recording** with automatic score calculation
- **Match metadata input** including date, time, and venue information

### Win/Loss Statistics Fix (August 2025)
- **Accurate statistics calculation** fixed to count only from current published tournament results
- **Player statistics reset and recalculated** to eliminate counting from previous deleted tournament data
- **Statistics now match visible match history** ensuring consistency between displayed matches and win/loss counts
- **Manual correction system** implemented for precise player statistics when needed

### 32 Mongolian Player Accounts Creation (August 2025)
- **Complete player database** with 32 authentic Mongolian player accounts created
- **Realistic player profiles** including traditional Mongolian names, birth dates, phone numbers, and club affiliations
- **Distributed club membership** across 4 main clubs: Улаанбаатар клуб, Дархан клуб, Эрдэнэт клуб, Чойбалсан клуб
- **Gender balance** with approximately equal male and female players
- **Age variety** spanning birth years from 1987 to 1999 for realistic age distribution
- **Authentication ready** all accounts use "password123" for easy testing and management

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