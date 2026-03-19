# Inmobiq

Dashboard de inteligencia de mercado inmobiliario para Tijuana, México.

## Stack

- **Framework:** Next.js 15 (App Router, Server Components)
- **Lenguaje:** TypeScript (strict)
- **Estilos:** Tailwind CSS v4
- **Componentes UI:** Componentes propios (basados en shadcn/ui patterns)
- **Iconos:** Lucide
- **Base de datos:** Supabase (Postgres + RLS)
- **Charts:** Recharts
- **IA:** Anthropic API (server-side, para insights narrativos)
- **Deploy:** Vercel

## Setup

```bash
npm install
cp .env.local.example .env.local
# Fill in your Supabase and Anthropic API keys
npm run dev
```

## Database

Run `supabase/schema.sql` in your Supabase SQL editor to create the tables.

## Structure

```
src/
├── app/
│   ├── layout.tsx          # Root layout with navbar + footer
│   ├── page.tsx            # Home: Tijuana city overview
│   └── zona/[slug]/
│       └── page.tsx        # Zone detail page
├── components/
│   ├── ui/                 # Base UI components (card, badge)
│   ├── navbar.tsx          # Navigation bar
│   ├── metric-card.tsx     # KPI metric card
│   ├── zone-card.tsx       # Zone summary card
│   ├── price-chart.tsx     # Price trend area chart
│   └── insight-card.tsx    # AI-generated insight card
├── lib/
│   ├── utils.ts            # Utility functions (cn, formatters)
│   ├── supabase.ts         # Supabase client
│   └── mock-data.ts        # Mock data for development
└── types/
    └── database.ts         # TypeScript types + DB schema
```
