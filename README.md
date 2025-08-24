# 🏠 Mayo — Family Engagement Platform (Phase 2)

Mayo is a private **SvelteKit-based family engagement app** with a Supabase backend, featuring **smart cards, Islamic Q&A, and family-driven bonding widgets**.  
It is designed for one household only — **bonding before scrolling**.  

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
pnpm install
pnpm run dev
pnpm run build
```

### Development Commands
```bash
pnpm run check
pnpm run check:watch
pnpm test
pnpm test:ui
pnpm test:run
```

---

## 🧪 Testing

This project uses **Vitest** with a **jsdom** environment.  
Coverage includes:  
- Zod schemas (auth, items, interactions, quiz, reflections, scenario, islamic_questions)  
- Auth allowlist validation  
- Widget rendering and quiet/anchor rules  
- Islamic Q&A reassurance flow  
- Accessibility (ARIA, reduced motion)  

---

## 🔒 Security & Access

- **4-person allowlist** → only specific family emails may log in  
- **Server-side allowlist** enforced  
- **RLS policies** on every table  
- **Google OAuth only**  

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

### Extended Tables (Phase 2)
- `islamic_questions` (Q&A for kids with reassuring explanations)  

RLS is **enabled for all tables**.  

---

## 📊 Widgets

### Anchor Widgets (always shown, 3–4 max on load)
- 🌞 Reflection/Mood Today  
- 📖 Daily Ayah  
- 🎂 Birthday/Milestone  
- ❓ Interactive (Quiz OR Scenario, rotating)  
- ✅ Closing Ritual  

### Quiet Mode (collapsed by default, explore panel)
- 📸 Wall Card (Feed, auto-seeded)  
- 💙 Scenario Reflection Digest  
- 👤 Fun Profile  
- 🕹️ Age Playground  
- 👩‍👩‍👦 Profession Card  
- 🕌 Islamic Q&A (faith-based questions, gentle reassurance)  
- Archives  

### Deleted
- ❌ RoleAwarePromptCard  

---

## 🔐 Security Headers (CSP)

Still not enforced (household-only).  
If expanded beyond family, reintroduce CSP with explicit allowlists.  

---

## 🧱 Architecture Principles

- **Schema-First** → Schema defines capabilities, locked in VCS.  
- **Psychology-Driven UX** → Anchor vs Quiet separation, closure rituals, empathy-first design.  
- **Mobile-First** → Always optimized for mobile.  
- **Single-Family Privacy** → Data scoped to one household only.  
- **No Dead Ends** → Always a CTA or quiet widget available.  

---
