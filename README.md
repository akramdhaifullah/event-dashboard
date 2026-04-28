# 🏃‍♂️ LariTerus Event Dashboard

A modern, high-performance event management dashboard built for running events. **LariTerus** provides a seamless experience for both event organizers and participants, featuring a robust admin panel and an intuitive user registration flow.

[![Built with Vite](https://img.shields.io/badge/Vite-646CFF?style=for-the-badge&logo=vite&logoColor=white)](https://vitejs.dev/)
[![React](https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)](https://reactjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white)](https://tailwindcss.com/)
[![Supabase](https://img.shields.io/badge/Supabase-3ECF8E?style=for-the-badge&logo=supabase&logoColor=white)](https://supabase.io/)

---

## ✨ Features

### 🛠 Administrative Interface
- **Event Management**: Create, edit, and toggle visibility of running events.
- **Category Control**: Define multiple ticket categories (e.g., 5K, 10K, Marathon) with specific pricing and capacity.
- **Participant Tracking**: Comprehensive list of registered participants with status management.
- **Registration Setup**: Customizable registration forms to capture specific runner data.
- **KPI Dashboards**: Real-time insights into ticket sales and participant demographics.

### 👤 User Experience
- **Event Discovery**: Browse upcoming running events with rich descriptions and images.
- **Seamless Registration**: Multi-step registration process with validation.
- **Cart System**: Register for multiple events or categories in a single transaction.
- **Secure Payments**: Integrated with **Midtrans Snap** for reliable local payment methods.
- **Profile Management**: Keep track of registrations and personal details.

---

## 🚀 Tech Stack

- **Frontend**: [React 18](https://reactjs.org/), [TypeScript](https://www.typescriptlang.org/), [Vite](https://vitejs.dev/)
- **UI Components**: [Shadcn/UI](https://ui.shadcn.com/) (Radix UI)
- **Styling**: [Tailwind CSS](https://tailwindcss.com/)
- **Icons**: [Lucide React](https://lucide.dev/)
- **State Management**: 
  - [TanStack Query](https://tanstack.com/query) (Server State)
  - React Context (Global Local State)
- **Forms & Validation**: [React Hook Form](https://react-hook-form.com/), [Zod](https://zod.dev/)
- **Backend**: [Supabase](https://supabase.com/) (Auth, PostgreSQL, Real-time)
- **Routing**: [React Router DOM v6](https://reactrouter.com/)

---

## 🛠 Getting Started

### Prerequisites
- Node.js (v18 or later)
- npm or bun

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/akramdhaifullah/event-dashboard.git
   cd event-dashboard
   ```

2. **Install dependencies**
   ```bash
   npm install
   # or
   bun install
   ```

3. **Set up Environment Variables**
   Create a `.env` file in the root directory:
   ```env
   VITE_SUPABASE_URL=your_supabase_url
   VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
   ```

4. **Run Development Server**
   ```bash
   npm run dev
   ```
   Open [http://localhost:8080](http://localhost:8080) to see the app.

### Building for Production
```bash
npm run build
```

---

## 🧪 Testing

We use [Vitest](https://vitest.dev/) and [React Testing Library](https://testing-library.com/docs/react-testing-library/intro/) for unit and integration tests.

```bash
npm run test        # Run tests once
npm run test:watch  # Run tests in watch mode
```

---

## 📁 Project Structure

```
src/
├── components/     # UI and Domain components
│   └── ui/         # Shadcn/UI primitives
├── contexts/       # React Context providers (Auth, Event, Cart)
├── data/           # TypeScript types and static data
├── hooks/          # Custom React hooks
├── lib/            # Utility functions and Supabase client
├── pages/          # Application views/routes
└── App.tsx         # Main routing and provider setup
```

---

## 📝 License

This project is licensed under the MIT License.

---

*Made with ❤️ by the LariTerus Team*
