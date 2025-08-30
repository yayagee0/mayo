# AGENTS.md — Mayo Firebase Engineering Contract

This document defines the technical, architectural, and behavioral constraints for all code contributors and AI agents working on the Mayo family platform. **No deviations allowed without Product Owner (Ghassan) approval.**

---

## 🔧 STACK CONTRACT (LOCKED-IN)

| Layer           | Tech / Rule                                        |
|-----------------|----------------------------------------------------|
| Framework       | SvelteKit 2 (SSR + TS)                             |
| Styling         | TailwindCSS v4 + @tailwindcss/vite                 |
| Icons           | lucide-svelte                                      |
| State           | Svelte 5 $state() (no external stores)             |
| Validation      | Zod                                                |
| Dates           | Day.js                                             |
| Auth            | Firebase Auth (Google OAuth only)                  |
| Database        | Cloud Firestore                                    |
| Storage         | Firebase Storage (private, direct URLs)            |
| Image Processing| browser-image-compression                           |
| Package Manager | npm (lock file committed)                          |

---

## 🔥 FIREBASE & BACKEND RULES

- 🔥 Firebase is used for **auth, database, and storage** — no other backend services.
- All backend logic must **match exactly** the Firestore collections defined in the contract.
- Firebase is used **only** for persistence and auth — not for dynamic logic or complex queries.
- ✅ **Security Rules enforced** at Firebase level for allowlist and family ID.
- ✅ All Firestore collections require `familyId == "ghassan-family"`.
- ✅ All Firebase services restricted to **4 hardcoded emails**.
- ❌ No Firebase Functions, Extensions, or additional services allowed.

### Required Collections

**users** (user profiles):
```typescript
{
  email: string;
  displayName: string;
  avatarUrl?: string;
  familyId: string; // Must be "ghassan-family"
}
```

**widgets** (dashboard configuration):
```typescript
{
  familyId: string; // Must be "ghassan-family"
  key: string;
  order: number;
  mode: string;
  enabled: boolean;
}
```

**posts** (family feed content):
```typescript
{
  familyId: string; // Must be "ghassan-family"
  authorUid: string;
  createdAt: string;
  kind: 'text' | 'youtube' | 'photo' | 'video';
  text?: string;
  youtubeId?: string;
  imagePath?: string;
  videoPath?: string;
}
```

---

## 🔐 AUTH & ROLE ENFORCEMENT

- Google login is enforced via Firebase Auth.
- Only these **four hardcoded emails** are allowed (see `src/lib/allowlist.ts`):
  - `nilezat@gmail.com`
  - `abdessamia.mariem@gmail.com`
  - `yazidgeemail@gmail.com`
  - `yahyageemail@gmail.com`
- Role detection and permissions are **handled in frontend only**.
- Backend never controls visibility or access logic beyond security rules.
- **Firebase Security Rules** enforce allowlist and family ID restrictions.

---

## 🎨 FRONTEND UX PRINCIPLES

- Mobile-first, accessible, low-cognitive-load design.
- **Responsive Navigation**: Sidebar on desktop, bottom nav on mobile.
- **Touch Targets**: Minimum 44px for all interactive elements.
- **Image Compression**: Auto-compress uploads (≤2MB for photos, ≤400px for avatars).
- **Video Support**: Raw video uploads without compression.
- Gentle UX: no gamification, no intrusive notifications.
- Must support keyboard navigation, reduced motion preferences, and proper contrast.

### Core Pages & Components

**Required Routes**:
- `/login` → Firebase Google OAuth
- `/dashboard` → Widget grid with family stats
- `/profile` → Avatar upload and display name management
- `/feed` → Multi-format post creation and feed display

**Required Components**:
- `src/lib/Nav.svelte` → Responsive navigation (sidebar + bottom nav)
- `src/lib/FeedUpload.svelte` → Multi-format post composer with compression
- `src/lib/firebase.ts` → Firebase initialization and helper functions
- `src/lib/allowlist.ts` → Email allowlist validation

---

## 🧠 DESIGN PHILOSOPHY

- **Firebase-First**: Data and auth driven by Firebase services.
- **Contractual AI**: Copilot, codegen, or any LLM must obey this file and Firebase schema.
- **No Dead Ends**: All screens should offer navigation and content, never show blanks.
- **Single-Family Privacy**: All data, media, and feeds locked to `familyId: "ghassan-family"`.

---

## 🚫 PROHIBITED

- ❌ Do not install UI mega-libraries (e.g., Material UI, Bootstrap).
- ❌ Do not add new Firebase collections or modify schema without PO approval.
- ❌ Do not rely on runtime dynamic role assignment beyond email allowlist.
- ❌ Do not use Firebase Functions, Extensions, or realtime features.
- ❌ Do not add Supabase, PostgreSQL, or any other backend services.
- ❌ Do not modify the 4-email allowlist or family ID without PO approval.

---

## 🚧 CURRENT SPRINT CONSTRAINTS

- ❌ Do not change login flow (/ → Firebase Google Auth → /dashboard).
- ❌ Do not modify Firebase auth, allowlist, or baseline security model.
- ✅ Focus on UI polish and feature completeness.
- ✅ Ensure responsive design works on all device sizes.
- ✅ Implement proper error boundaries and loading states.
- ✅ Test image compression and video upload functionality.
- ✅ Validate Firebase Security Rules protect data appropriately.

---

## 📁 CONTRACT FILES

| File                          | Description                              |
|-------------------------------|------------------------------------------|
| README.md                     | Firebase setup and usage instructions   |
| AGENTS.md                     | Enforcement document for humans + AI    |
| src/lib/firebase.ts           | Firebase configuration and helpers      |
| src/lib/allowlist.ts          | Email allowlist validation              |
| tailwind.config.js            | TailwindCSS v4 configuration (ESM)     |
| postcss.config.cjs            | PostCSS configuration (CommonJS)       |

---

## 🔧 TECHNICAL REQUIREMENTS

### TailwindCSS v4 Setup
- ✅ `vite.config.ts` must include `tailwindcss()` plugin
- ✅ `postcss.config.cjs` must use CommonJS format
- ✅ `tailwind.config.js` must use ESM format (`export default`)
- ✅ `src/app.css` must use `@import "tailwindcss";`
- ✅ Global styles with proper focus management and accessibility

### Svelte 5 Compliance
- ✅ Use `$state()` for reactive variables
- ✅ Use `onclick` instead of `on:click`
- ✅ Use `onchange` instead of `on:change`
- ✅ Handle `preventDefault()` manually in event handlers
- ✅ Use `{#if}` blocks for conditional icon rendering

### Firebase Integration
- ✅ All auth operations through `src/lib/firebase.ts`
- ✅ Client-side image compression before upload
- ✅ Proper error handling for Firebase operations
- ✅ Security rules enforcement in Firestore and Storage

---

✅ This contract is binding for any contributor or AI. Any deviation must be approved explicitly by Ghassan (Product Owner).

---

## 🧱 SCHEMA & BACKEND RULES

- ❄️ The schema is **frozen** in `PHASE0_SCHEMA_NO_RLS.sql` (updated to disable RLS).  
- These tables are canonical and immutable without approval:  

  **Core (Phase 0)**  
  - `app_settings`  
  - `profiles`  
  - `items`  
  - `interactions`  

  **Extended (Phase 1)**  
  - `quiz_questions`  
  - `quiz_answers`  
  - `quiz_guesses`  
  - `reflections`  
  - `scenario_questions`  
  - `scenario_answers`  

  **Extended (Phase 2)**  
  - `islamic_questions` (Q&A with reassurance fields: `explanation_correct`, `explanation_incorrect`, categories, order_index)  

- All backend logic must **match exactly** what is in the schema file.  
- Supabase is used **only** for persistence — not for dynamic roles, logic, or migrations.  
- ❌ **RLS is not used in this project.**  
- ✅ All `public` tables have RLS disabled.  
- ✅ Access is controlled exclusively via Supabase Auth allowlist (4 hardcoded emails).  
- ✅ `authenticated` role = full privileges across all tables.  
- ❌ `anon` role has no privileges.  
- ❌ No Supabase Edge Functions or additional services allowed.  

---

## 🔐 AUTH & ROLE ENFORCEMENT

- Google login is enforced via Supabase.  
- Only these **four hardcoded emails** are allowed (see `src/lib/server/allowlist.ts`).  
- Role detection and permissions are **handled in frontend only**.  
- Backend never controls visibility or access logic.  
- **Database does not use RLS** - access controlled via allowlist only.  

---

## 🎨 FRONTEND UX PRINCIPLES

- Mobile-first, accessible, low-cognitive-load design.  
- Smart Cards render before feed; `BirthdayCard` mandatory if data exists.  
- Smart Card-first feed: Feed must show meaningful cards before content if empty.  
- Gentle UX: no gamification, no intrusive notifications.  
- Must support keyboard navigation, reduced motion preferences, and proper contrast.  

### Phase 2 Widget Visibility Rules
- **"What Would You Do?" (ScenarioCard)** → children only (Yazid, Yahya).  
- **Reflections Digest & Scenario Digest** → parents only (Ghassan, Mariem).  
- **Profession Card** updated roles & icons as defined in Phase 2 requirements.  
- **Age Playground** max age = 70 for Ghassan, 18 for others.  
- **Islamic Q&A** → 1-2 questions per session, gentle reassurance explanations.  

---

## 🧠 DESIGN PHILOSOPHY

- Schema-First: Data drives design. Schema never changes without PO approval.  
- Contractual AI: Copilot, codegen, or any LLM must obey this file and `PHASE0_SCHEMA_NO_RLS.sql`.  
- No Dead Ends: All screens should offer CTAs or Smart Cards, never show blanks.  
- Single-Family Privacy: All storage, media, and feeds are locked to one household context.  

---

## 🚫 PROHIBITED

- ❌ Do not install UI mega-libraries (e.g., Material UI, Bootstrap).  
- ❌ Do not add new database tables, columns, triggers, or roles without PO approval.  
- ❌ Do not rely on runtime dynamic role assignment or permissions logic.  
- ❌ Do not use Supabase functions, webhooks, or realtime features.  

---

## 🚧 CURRENT SPRINT CONSTRAINTS

- ❌ Do not change login flow (/ → Google OAuth → /dashboard).  
- ❌ Do not modify Supabase auth, allowlist, or baseline security model.  
- ✅ Focus on quality & stability improvements only.  
- ✅ Fix TypeScript errors and add error boundaries.  
- ✅ Implement shared stores for better state management.  
- ✅ Enforce visibility rules on all widgets per Phase 2 specifications.  
- ✅ Test Islamic Q&A reassurance flow and accessibility compliance.  
- ✅ Use mock Supabase client in tests to prevent egress usage.  

---

## 📁 CONTRACT FILES

| File                          | Description                              |
|-------------------------------|------------------------------------------|
| PHASE0_SCHEMA_NO_RLS.sql      | Canonical schema (Phase 0–2 tables)      |
| COPILOT_PROMPT_PHASE2_FULL.txt| AI codegen scaffold guide                |
| README.md                     | Project overview and usage instructions |
| AGENTS.md                     | Enforcement document for humans + AI    |

---

✅ This contract is binding for any contributor or AI. Any deviation must be approved explicitly by Ghassan (Product Owner).  
