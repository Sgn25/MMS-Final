# MainTMan Multi-Unit

Maintenance Management System with support for multiple dairy units and users.

## Features
- **Multi-Unit Support**: Data isolation across different dairy units.
- **Role-Based Access**: Specialized views for different designations.
- **Task Management**: Create, assign, and track maintenance tasks per unit.
- **Real-time Notifications**: Unit-specific FCM notifications for task updates and daily summaries.

## Tech Stack
- **Frontend**: React, Vite, Tailwind CSS, Shadcn UI.
- **Mobile**: React Native (Expo), NativeWind.
- **Backend**: Supabase (Auth, Database, Edge Functions, RLS).
- **Deployment**: Vercel (Web App).

## Getting Started

### Prerequisites
- Node.js & npm
- Supabase CLI

### Setup
1. Clone the repository.
2. Install dependencies:
   ```bash
   npm install
   ```
3. Set up environment variables in `.env`:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`

4. Run the development server:
   ```bash
   npm run dev
   ```

## Deployment to Vercel
1. Push the code to a GitHub repository.
2. Connect the repository to Vercel.
3. Configure environment variables in the Vercel dashboard.
