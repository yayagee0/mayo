\# AGENTS.md — FamilyNest Engineering Contract



This document defines the technical, architectural, and behavioral constraints for all code contributors and AI agents. \*\*No deviations allowed.\*\*



---



\## 🔧 STACK CONTRACT (LOCKED-IN)



| Layer           | Tech / Rule                                        |

|----------------|----------------------------------------------------|

| Framework       | SvelteKit 2 (SSR + TS)                             |

| Styling         | Tailwind CSS + @tailwindcss/forms                 |

| Icons           | lucide-svelte                                      |

| State           | Svelte stores only (no Redux, Zustand, etc.)       |

| Validation      | Zod                                                |

| Dates           | Day.js                                             |

| Auth            | Supabase (Google OAuth only)                       |

| Storage         | Supabase `post-media` bucket (private, signed URLs)|

| Package Manager | `pnpm` (lock file committed)                       |



---



\## 🔐 CSP CONTRACT

\- CSP headers are intentionally disabled in Phase 0 (private family use).
\- If project scope expands to public access, CSP must be re-enabled with a strict allowlist.
\- Until then, all code should assume no CSP restrictions.



---



\## 🧱 SCHEMA \& BACKEND RULES



\- ❄️ The schema is \*\*frozen\*\* in `PHASE0\_SCHEMA\_LOCKED.sql`. No other tables may be added.

\- All backend logic should \*\*match exactly\*\* what is in the schema file.

\- Supabase is used \*\*only\*\* for persistence — not for dynamic roles, logic, or migrations.

\- ✅ RLS must remain enabled for all tables.

\- ❌ No Supabase Edge Functions or additional services allowed.



---



\## 🔐 AUTH \& ROLE ENFORCEMENT



\- Google login is enforced via Supabase.

\- Only these \*\*four hardcoded emails\*\* are allowed:



\- **Allowlist must be server-only, not client/env.** Enforced in `src/lib/server/allowlist.ts`.

\- Role detection and permissions are \*\*handled in frontend only\*\*.

\- Backend never controls visibility or access logic.



---



\## 🎨 FRONTEND UX PRINCIPLES



\- Mobile-first, accessible, low-cognitive-load design.

\- Role-aware: Smart Cards \& prompts must respect user role.

\- Smart Cards render before feed; BirthdayCard mandatory if data exists.

\- Smart Card-first feed: Feed must show meaningful cards before content if empty.

\- Gentle UX: no gamification, no intrusive notifications.

\- Must support keyboard navigation, reduced motion preferences, and proper contrast.



---



\## 🧠 DESIGN PHILOSOPHY



\- Schema-First: Data drives design. Schema never changes post-deployment.

\- Contractual AI: Copilot, codegen, or any LLM must obey this file and `PHASE0\_SCHEMA\_LOCKED.sql`.

\- No Dead Ends: All screens should offer CTAs or Smart Cards, never show blanks.

\- Single-Family Privacy: All storage, media, and feeds are locked to one household context.



---



\## 🚫 PROHIBITED



\- ❌ Do not install UI mega-libraries (e.g., Material UI, Bootstrap).

\- ❌ Do not add new database tables, columns, triggers, or roles.

\- ❌ Do not rely on runtime dynamic role assignment or permissions logic.

\- ❌ Do not use Supabase functions, webhooks, or realtime features.



---



\## 🚧 SPRINT 1 CONSTRAINTS (MAYO SEPT 2025)



\- ❌ Do not change login flow (/ → Google OAuth → /dashboard).

\- ❌ Do not modify Supabase auth, allowlist, or RLS policies.

\- ✅ Focus on quality & stability improvements only.

\- ✅ Fix TypeScript errors and add error boundaries.

\- ✅ Implement shared stores for better state management.



---



\## 📁 CONTRACT FILES



| File | Description |

|------|-------------|

| `PHASE0\_SCHEMA\_LOCKED.sql` | Canonical schema. Immutable. |

| `COPILOT\_PROMPT\_PHASE0\_LOCKED.txt` | AI codegen scaffold guide |

| `README.md` | Project overview and usage instructions |

| `AGENTS.md` | Enforcement document for humans and machines |



---



✅ This contract is binding for any contributor or AI. Any deviation must be approved explicitly by Ghassan (Product Owner).




