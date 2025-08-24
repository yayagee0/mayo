AGENTS.md — FamilyNest Engineering Contract (Updated for Phase 1)

This document defines the technical, architectural, and behavioral constraints for all code contributors and AI agents. No deviations allowed without Product Owner (Ghassan) approval.

🔧 STACK CONTRACT (LOCKED-IN)
Layer	Tech / Rule
Framework	SvelteKit 2 (SSR + TS)
Styling	Tailwind CSS + @tailwindcss/forms
Icons	lucide-svelte
State	Svelte stores only (no Redux, Zustand, etc.)
Validation	Zod
Dates	Day.js
Auth	Supabase (Google OAuth only)
Storage	Supabase post-media bucket (private, signed URLs)
Package Manager	pnpm (lock file committed)
