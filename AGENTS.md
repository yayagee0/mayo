# 🏠 Mayo — Family Engagement Platform

Mayo is a private **SvelteKit-based family engagement app** with Supabase backend, featuring **role-aware smart cards**, **Google OAuth authentication**, and a **widget-based dashboard system**. It is designed for one household only — bonding before scrolling.

---

## 🔧 Stack

- **Framework:** SvelteKit 2 + TypeScript  
- **Styling:** Tailwind CSS + @tailwindcss/forms  
- **Icons:** lucide-svelte  
- **State:** Svelte stores  
- **Validation:** Zod v4  
- **Dates:** Day.js  
- **Auth:** Supabase (Google OAuth only)  
- **Package Manager:** pnpm  

---

## 🚀 Getting Started

### Prerequisites
- Node.js 18+  
- pnpm (auto-managed via `package.json`)  

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

---

## 🧪 Testing

This project uses **Vitest** with a **jsdom** environment for DOM testing.  
Coverage includes:  
- Zod v4 validation schemas (auth, items, interactions, quiz, reflections, scenario)  
- Auth allowlist validation  
- Widget configuration validation  
- Notification handling  

---

## 🔒 Security & Access

- **4-person allowlist**: only specific family emails can log in  
- **Server-side validation**: allowlist enforced at server level  
- **RLS policies**: Row-Level Security active for every table  
- **Google OAuth only**: no other authentication supported  

---

## 📦 Schema & Database

Schema is **locked and immutable** (`PHASE0_SCHEMA_LOCKED.sql`).  

### Core Tables (Phase 0)
- `app_settings`  
- `profiles`  
- `items`  
- `interactions`  

### Extended Tables (Phase 1)
- `quiz_questions`  
- `quiz_answers`  
- `quiz_guesses`  
- `reflections`  
- `scenario_questions`  
- `scenario_answers`  

RLS is **enabled for all tables**.  
Policies are designed around **self-ownership** (users can only manage their own rows).  

---

## 🔐 Security Headers (CSP)

As of Phase 0/1, no CSP (Content-Security-Policy) is enforced.  
Reason: App is private (4 whitelisted users only) and CSP caused blocked videos/avatars.  

If the app is ever opened beyond this household, **reintroduce CSP** with explicit allowlists (Supabase, YouTube, DiceBear).  

---

## 🧱 Architecture Principles

- **Schema-First**: Data drives design decisions; schema locked in version control  
- **Mobile-First**: Responsive design prioritizes mobile experience  
- **Widget-Based**: Modular dashboard with smart cards  
- **Single-Family**: All data scoped to one household context  
- **No Dead Ends**: Every screen offers CTAs or Smart Cards  

---
