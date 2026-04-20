# Cozy Dashboard - Project Context

This project is a modern event management dashboard built with React, Vite, and Supabase. It provides a platform for managing running events, participants, and categories, featuring distinct administrative and user interfaces.

## Project Overview

- **Purpose:** A comprehensive dashboard for managing and participating in running events.
- **Main Technologies:**
  - **Frontend:** React 18, TypeScript, Vite.
  - **Styling:** Tailwind CSS, Shadcn/UI (Radix UI primitives).
  - **Icons:** Lucide React.
  - **State Management:** TanStack Query (React Query) for server state, React Context for local global state (Auth and Events).
  - **Forms:** React Hook Form with Zod validation.
  - **Backend:** Supabase (PostgreSQL, Authentication, Real-time).
  - **Routing:** React Router DOM (v6).
  - **Testing:** Vitest and React Testing Library.

## Architecture

- **`src/App.tsx`**: The core routing engine that switches between `Layout` (Admin) and `UserLayout` (Guest/User) based on the user's role and authentication status.
- **`src/contexts/`**:
  - `AuthContext.tsx`: Manages Supabase sessions, user profiles, and the `isAdmin` flag.
  - `EventContext.tsx`: Handles event-related state and interactions.
- **`src/pages/`**:
  - `AdminEventsPage.tsx`: Event management for administrators.
  - `UserEventsPage.tsx`: Event browsing and registration for users.
  - `ProfilePage.tsx`: User profile management.
- **`src/lib/supabase.ts`**: Supabase client configuration.
- **`src/data/types.ts`**: TypeScript interfaces for `RunningEvent`, `TicketType`, `Participant`, and `Profile`.

## Building and Running

### Development
```powershell
npm run dev
```
Starts the Vite development server at `http://localhost:8080`.

### Build
```powershell
npm run build
```
Compiles the project for production.

### Testing
```powershell
npm run test        # Run tests once
npm run test:watch  # Run tests in watch mode
```

### Linting
```powershell
npm run lint
```

## Development Conventions

- **Components:** UI components are located in `src/components/ui` (managed via shadcn/ui). Domain-specific components are in `src/components`.
- **Styling:** Use Tailwind CSS utility classes. Prefer CSS variables for theme consistency (defined in `src/index.css`).
- **Data Fetching:** Use TanStack Query hooks for all Supabase interactions to ensure efficient caching and synchronization.
- **Form Validation:** Define Zod schemas for all forms and integrate them with React Hook Form.
- **Type Safety:** Maintain strict TypeScript definitions in `src/data/types.ts` and ensure all components and hooks are properly typed.
- **Authentication:** Use the `useAuth` hook to access the current session, user profile, and administrative status.
