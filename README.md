# Vehicle Spare Parts POS System

A point-of-sale system built for vehicle spare parts shops. Manage inventory, process sales, track customers, and generate reports from a single dashboard.

## Tech Stack

- **Frontend:** Next.js 15 (App Router), React 19, TypeScript
- **Styling:** Tailwind CSS, Framer Motion
- **Backend:** Supabase (PostgreSQL, Auth)
- **Reports:** jsPDF, xlsx, Recharts
- **Email:** Resend

## Features

- **POS** — Scan/search parts by code, add to cart, checkout with multiple payment methods
- **Products** — CRUD with part numbers, pricing, categories, and image uploads
- **Inventory** — Stock tracking, low-stock alerts, stock adjustment history
- **Sales** — Sales history with invoice generation (PDF)
- **Customers** — Customer records and purchase history
- **Suppliers** — Supplier management
- **Purchases** — Purchase order tracking
- **Staff** — Role-based access (owner / receptionist)
- **Reports** — Daily/monthly sales summaries, top-selling products, revenue charts, Excel export
- **Settings** — Shop details, currency configuration
- **Auto Backup** — Scheduled data exports

## Getting Started

### Prerequisites

- Node.js 18+
- A Supabase project

### Setup

1. Clone the repository:
   ```bash
   git clone <repo-url>
   cd pos_system_vehicle_spare_parts_shop
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Create a `.env` file with your Supabase credentials:
   ```
   NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
   NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=your_supabase_anon_key
   SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
   ```

4. Run the development server:
   ```bash
   npm run dev
   ```

5. Open [http://localhost:3000](http://localhost:3000)

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start dev server |
| `npm run build` | Production build |
| `npm run start` | Start production server |
| `npm run lint` | Run ESLint |
| `npm test` | Run tests |
| `npm run test:coverage` | Run tests with coverage |

## Project Structure

```
src/
├── app/
│   ├── admin/
│   │   ├── (dashboard)/    # Protected dashboard pages
│   │   └── login/          # Login page
│   └── api/                # API routes
├── components/
│   ├── auth/               # ProtectedRoute
│   ├── layout/             # Sidebar, Header
│   └── shared/             # Reusable UI components
├── context/                # Toast context
├── lib/                    # Auth, Supabase clients, types, utilities
└── services/               # Data access layer (Supabase queries)
```
