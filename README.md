# Mayo - Family Engagement Platform

Mayo is a private SvelteKit-based family engagement app with Supabase backend, featuring role-aware smart cards, Google OAuth authentication, and a widget-based dashboard system.

## 🔧 Stack

- **Framework**: SvelteKit 2 + TypeScript
- **Styling**: Tailwind CSS + @tailwindcss/forms
- **Icons**: lucide-svelte
- **State**: Svelte stores
- **Validation**: Zod v4
- **Dates**: Day.js
- **Auth**: Supabase (Google OAuth only)
- **Package Manager**: pnpm

## 🚀 Getting Started

### Prerequisites

- Node.js 18+
- pnpm (automatically managed via package.json)

### Installation

```bash
# Install dependencies
pnpm install

# Start development server
pnpm run dev

# Build for production
pnpm run build
```

### Development Commands

```bash
# Type checking
pnpm run check

# Watch mode type checking
pnpm run check:watch

# Run tests
pnpm test

# Run tests with UI
pnpm test:ui

# Run tests once
pnpm test:run
```

## 🧪 Testing

This project uses Vitest for unit testing with jsdom environment for DOM testing.

Test coverage includes:
- Zod v4 validation schemas (auth, items, interactions, UI)
- Auth allowlist validation
- Widget configuration validation
- Notification handling

## 🔒 Security & Access

- **4-person allowlist**: Only specific family emails are allowed
- **Server-side validation**: Allowlist enforced at server level
- **RLS policies**: Database-level security with Row Level Security
- **Google OAuth only**: No other auth methods supported

## 📦 Schema & Database

- **Locked schema**: Database schema is frozen and immutable
- **3 core tables**: profiles, items, interactions
- **Comprehensive RLS**: 18 policies across all tables
- **No migrations**: Schema changes not permitted in this phase

## 🧱 Architecture Principles

- **Schema-First**: Data drives design decisions
- **Mobile-First**: Responsive design prioritizing mobile experience  
- **Widget-Based**: Modular dashboard with smart cards
- **Single-Family**: All data scoped to one household context
- **No Dead Ends**: Every screen offers clear CTAs or smart cards
