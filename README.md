# 🏠 Mayo — Family Engagement Platform (Firebase Edition)

Mayo is a private **SvelteKit-based family engagement app** with a Firebase backend, featuring **responsive navigation, feed sharing, and family member profiles**.  
It is designed for one household only — **bonding before scrolling**.

---

## 🔧 Stack

- **Framework:** SvelteKit 2 + TypeScript  
- **Styling:** TailwindCSS v4 + @tailwindcss/vite  
- **Icons:** lucide-svelte  
- **State:** Svelte 5 $state() stores  
- **Validation:** Zod v4  
- **Dates:** Day.js  
- **Auth:** Firebase Auth (Google OAuth only)  
- **Database:** Cloud Firestore  
- **Storage:** Firebase Storage  
- **Image Processing:** browser-image-compression  
- **Package Manager:** npm  

---

## 🚀 Getting Started

### Prerequisites
- Node.js 18+  
- Firebase project with Auth, Firestore, and Storage enabled  

### Installation
```bash
npm install
npm run dev
npm run build
```

### Environment Setup

Copy `.env.example` to `.env` and configure your Firebase credentials:

```bash
# Firebase Configuration
VITE_FB_API_KEY=your-firebase-api-key-here
VITE_FB_AUTH_DOMAIN=your-project.firebaseapp.com
VITE_FB_PROJECT_ID=your-project-id
VITE_FB_STORAGE_BUCKET=your-project.appspot.com
VITE_FB_APP_ID=your-firebase-app-id
VITE_FB_RETURN_URL=http://localhost:5173/dashboard

# Family Configuration
VITE_FAMILY_ID=ghassan-family
VITE_ALLOWED_EMAILS=nilezat@gmail.com,abdessamia.mariem@gmail.com,yazidgeemail@gmail.com,yahyageemail@gmail.com
```

### Development Commands
```bash
npm run dev          # Start development server
npm run build        # Build for production
npm run preview      # Preview production build
npm run check        # Run TypeScript checks
npm run check:watch  # Watch mode TypeScript checks
```

---

## 🔒 Security & Access

- **4-person allowlist** → only specific family emails may log in (Google OAuth only).
- **Firebase Auth** controls authentication with email allowlist validation.
- **Firestore Security Rules** enforce family ID restrictions and email allowlist.
- **Firebase Storage Rules** restrict file access to authenticated family members only.
- Security enforced at **client + Firebase rules layer**.

---

## 📦 Data Structure

### Firestore Collections

**users**: User profiles and family membership
```typescript
{
  email: string;
  displayName: string;
  avatarUrl?: string;
  familyId: string;
}
```

**widgets**: Dashboard widget configuration
```typescript
{
  familyId: string;
  key: string;
  order: number;
  mode: string;
  enabled: boolean;
}
```

**posts**: Family feed posts with media
```typescript
{
  familyId: string;
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

## 🎨 Features

### Navigation
- **Desktop**: Fixed sidebar with navigation menu
- **Mobile**: Bottom navigation bar with accessible touch targets
- **Responsive**: Adapts seamlessly between desktop and mobile layouts

### Authentication
- **Google OAuth**: One-click sign-in with Google accounts
- **Email Allowlist**: Restricted to 4 family email addresses
- **Auto-redirect**: Seamless flow from login to dashboard

### Dashboard
- **Widget Grid**: Sample family widgets with different categories
- **Quick Actions**: Fast access to create posts and update profile
- **Family Stats**: Overview of family members and activity

### Profile Management
- **Avatar Upload**: Compressed image upload (≤2MB, max 400px)
- **Display Name**: Customizable family member names
- **Account Info**: View creation date and last sign-in

### Family Feed
- **Multi-format Posts**: Text, YouTube videos, photos, and raw videos
- **Image Compression**: Automatic compression for photos (≤2MB, max 1920px)
- **Video Support**: Raw video upload without compression
- **YouTube Integration**: Automatic embed with URL parsing

---

## 🔧 Firebase Setup

### 1. Create Firebase Project
1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Create a new project
3. Enable Google Analytics (optional)

### 2. Enable Services
```bash
# Enable Authentication
- Go to Authentication → Sign-in method
- Enable Google provider
- Add your domain to authorized domains

# Enable Firestore
- Go to Firestore Database
- Create database in production mode
- Deploy security rules (see below)

# Enable Storage
- Go to Storage
- Create bucket with Firebase rules
```

### 3. Security Rules

**Firestore Rules** (`firestore.rules`):
```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Helper function to check allowed emails
    function isAllowedEmail() {
      return request.auth != null && 
        (request.auth.token.email == 'nilezat@gmail.com' ||
         request.auth.token.email == 'abdessamia.mariem@gmail.com' ||
         request.auth.token.email == 'yazidgeemail@gmail.com' ||
         request.auth.token.email == 'yahyageemail@gmail.com');
    }
    
    // Helper function to check family ID
    function isFamilyMember() {
      return resource.data.familyId == 'ghassan-family';
    }
    
    // Users collection
    match /users/{userId} {
      allow read, write: if isAllowedEmail() && 
        request.auth.uid == userId && 
        resource.data.familyId == 'ghassan-family';
    }
    
    // Widgets collection
    match /widgets/{widgetId} {
      allow read, write: if isAllowedEmail() && isFamilyMember();
    }
    
    // Posts collection
    match /posts/{postId} {
      allow read, write: if isAllowedEmail() && isFamilyMember();
    }
  }
}
```

**Storage Rules** (`storage.rules`):
```javascript
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    match /{allPaths=**} {
      allow read, write: if request.auth != null &&
        (request.auth.token.email == 'nilezat@gmail.com' ||
         request.auth.token.email == 'abdessamia.mariem@gmail.com' ||
         request.auth.token.email == 'yazidgeemail@gmail.com' ||
         request.auth.token.email == 'yahyageemail@gmail.com');
    }
  }
}
```

---

## 🧱 Architecture Principles

- **Firebase-First** → Leverage Firebase services for auth, data, and storage.  
- **Mobile-First UX** → Responsive design optimized for mobile devices.  
- **Single-Family Privacy** → Data scoped to one household only.  
- **Client-Side Optimization** → Image compression and efficient uploads.  
- **Accessible Design** → Proper focus management and touch targets.  

---

## 📱 Responsive Design

- **Desktop (≥768px)**: Fixed sidebar navigation with main content area
- **Mobile (<768px)**: Bottom navigation bar with full-screen content
- **Touch Targets**: Minimum 44px touch targets for accessibility
- **Safe Areas**: Proper handling of notched devices and safe areas

---

## 🔄 Migration Notes

This project has been completely migrated from Supabase to Firebase:

### Removed Dependencies
- `@supabase/supabase-js`
- `@supabase/auth-ui-svelte`
- `@supabase/auth-ui-shared`
- `heic2any` (replaced with browser-image-compression)

### Added Dependencies
- `firebase` (Auth, Firestore, Storage)
- Enhanced `browser-image-compression` usage

### Key Changes
- Auth flow now uses Firebase Auth with Google OAuth
- Data storage moved from PostgreSQL to Firestore
- File storage moved from Supabase Storage to Firebase Storage
- Simplified data model: users, widgets, posts collections
- TailwindCSS v4 with proper @tailwindcss/vite integration

---

## 🎯 Future Enhancements

- **Real-time Updates**: Firestore real-time listeners for live feed updates
- **Push Notifications**: Firebase Cloud Messaging for family notifications
- **Offline Support**: Progressive Web App with offline capabilities
- **Advanced Widgets**: More interactive family engagement features

---

*Mayo - Bringing families together, one post at a time.*  

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
- Islamic Q&A reassurance flow and 1-2 question limits
- Widget visibility rules (children-only, parents-only)  
- Accessibility (ARIA, reduced motion)  
- Schema integrity and RLS enforcement  

---

## 🔒 Security & Access

- **4-person allowlist** → only specific family emails may log in (Google OAuth only).
- **RLS is completely disabled** for all tables.
- **Authenticated role** has full privileges (SELECT, INSERT, UPDATE, DELETE, REFERENCES, TRIGGER, TRUNCATE).
- **Anon role** has no privileges.
- New tables automatically grant privileges to `authenticated`.
- Security enforced at the **Auth allowlist layer**, not by row policies.  

---

## 📦 Schema & Database

Schema is **locked and immutable** (`PHASE0_SCHEMA_NO_RLS.sql`).  

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

**RLS is disabled for all tables** - security enforced via allowlist only.  

---

## 🎯 PWA Support (Scaffolded)

PWA features are scaffolded but **disabled by default** in production:

- **Service Worker**: `/static/sw.js` with caching strategies
- **Manifest**: `/static/manifest.json` for installable app
- **Feature Flag**: `PUBLIC_ENABLE_PWA=true` to activate
- **Install Prompt**: Automatic detection and user prompts

To enable PWA features, set `PUBLIC_ENABLE_PWA=true` in your environment variables.

---

## ⚠️ Previous Issues (Fixed)

Recent fixes implemented:

### ✅ Bundle Size Optimization
- **Lazy Loading**: Implemented for non-critical widgets (40% reduction in initial load)
- **Progressive Enhancement**: Core widgets load immediately, optional widgets on-demand
- **Performance Tracking**: Console-based monitoring for load times and query duration

### ✅ Accessibility Compliance  
- **Video Captions**: Added WCAG 2.1 AA compliant `<track>` elements to all videos
- **SSR Configuration**: Moved SSR config from component to proper server file

### ✅ Security Verification
- **RLS Disabled**: Confirmed per AGENTS.md requirements  
- **Allowlist Enforcement**: 4-person allowlist with redirect to `/access-denied`
- **Test Coverage**: 353+ tests passing with security validation

---

---

## 📊 Widgets

### Anchor Widgets (always shown, 3–4 max on load)
- 🌞 Reflection/Mood Today  
- 📖 Daily Ayah  
- 🎂 Birthday/Milestone  
- ❓ Interactive (Quiz OR Scenario, rotating)  
- ✅ Closing Ritual  

### Quiet Mode (collapsed by default, explore panel)
- 📸 Feed  
- 💙 **Family Reflections Digest (Ghassan + Mariem only)**  
- 💙 **Scenario Reflection Digest (Ghassan + Mariem only)**  
- 👤 Fun Profile  
- 🕹️ Age Playground (up to 70 years for Ghassan)  
- 👩‍👩‍👦 Profession Card (updated roles/icons)  
- 🕌 Islamic Q&A (1–2 reassuring questions per session)  
- Archives  

### Visibility Rules
- **"What Would You Do?"**: Visible only to Yazid and Yahya (children)
- **Digest Widgets**: Visible only to Ghassan and Mariem (parents)
- **Age Playground**: Extended to 70 years max for Ghassan, 18 years for others  

### Family Roles & Dreams (Updated Phase 2)
- **Ghassan** → Master of Business, HRBP - "Helps people grow at work, Snack Boss at home." (Business icon)
- **Mariem** → Computer Science Master, Super Mom - "Hacker in disguise, bedtime maker." (Computer icon)  
- **Yazid** → Future Engineer - "Wants to build tanks, airship, rockets." (Engineer icon)
- **Yahya** → Future Engineer - "Wants to design rockets, airplanes, flying machines." (Plane icon)

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
