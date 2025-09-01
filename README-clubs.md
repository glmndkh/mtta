
# Mobile-First Клубууд App

A mobile-first React + TypeScript + Tailwind CSS application for browsing and filtering clubs.

## Features

### 🎯 Core Functionality
- **Mobile-first design** optimized for touch interaction
- **Smart search** with 300ms debounce
- **Advanced filtering** by city, type, and sorting options
- **Detailed club views** in bottom sheet format
- **Direct contact** integration (phone/email)

### 🎨 Design System
- **Dark theme** with consistent color tokens
- **Touch-friendly** 44px minimum target sizes
- **Accessible** AA contrast ratios and focus indicators
- **Smooth animations** and loading states

### 📱 Mobile UX
- **Sticky header** with search and filter
- **Bottom sheets** for details and filters
- **Single column** card layout
- **Quick actions** for calling and emailing

## Performance Targets

- **Lighthouse Mobile Performance**: ≥90
- **Lighthouse Accessibility**: ≥95
- **Lazy loading** for images
- **Code splitting** for detail components

## File Structure

```
src/
├── components/clubs/
│   ├── Header.tsx              # Sticky header with search
│   ├── ClubCard.tsx           # Individual club card
│   ├── FilterSheet.tsx        # Bottom sheet filter UI
│   └── ClubDetailSheet.tsx    # Full club details
├── hooks/
│   └── useClubs.ts            # Data fetching and filtering
├── types/
│   └── club.ts                # TypeScript interfaces
├── lib/
│   └── design-tokens.ts       # Design system tokens
└── pages/
    └── clubs-mobile.tsx       # Main page component
```

## Data Format

```json
{
  "id": "1",
  "name": "УБ Спорт Клуб",
  "logo": "/uploads/club-logo.jpg",
  "verified": true,
  "city": "Улаанбаатар",
  "district": "Сүхбаатар дүүрэг",
  "type": "Спорт клуб",
  "phone": "+976 11223344",
  "email": "contact@ubsport.mn",
  "status": "active",
  "description": "Club description...",
  "address": "Full address...",
  "coordinates": { "lat": 47.9184, "lng": 106.9177 },
  "schedule": "Opening hours...",
  "training": "Training info...",
  "coaches": ["Coach 1", "Coach 2"],
  "equipment": ["Equipment 1", "Equipment 2"],
  "rating": 4.8,
  "createdAt": "2024-01-15T08:00:00Z"
}
```

## Usage

1. Place your clubs data in `public/clubs.json`
2. Import and use the `ClubsMobile` component
3. Customize design tokens in `design-tokens.ts`

## Accessibility Features

- ✅ Minimum 44px touch targets
- ✅ Keyboard navigation support
- ✅ Screen reader compatible
- ✅ High contrast focus indicators
- ✅ Semantic HTML structure
