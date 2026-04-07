# Finance OS

A personal finance dashboard built with Next.js, Prisma (SQLite), and Tailwind CSS.

---

## Prerequisites

Install these once on your Mac before anything else.

### 1. Node.js (v20+)

```bash
# Install via Homebrew (recommended)
brew install node
```

Verify: `node -v` should print `v20.x.x` or higher.

### 2. pnpm

```bash
npm install -g pnpm
```

Verify: `pnpm -v`

---

## Getting the project

```bash
git clone https://github.com/amruthasatishkumar/finance-os.git
cd finance-os
```

---

## Setup

### 1. Install dependencies

```bash
pnpm install
```

### 2. Create the environment file

Create a file called `.env.local` in the project root with this content:

```
DATABASE_URL="file:./prisma/dev.db"
```

### 3. Set up the database

This creates the SQLite database file and seeds it with sample data:

```bash
pnpm db:push
pnpm db:seed
```

---

## Run the app

```bash
pnpm dev
```

Open [http://localhost:3004](http://localhost:3004) in your browser.

---

## Useful commands

| Command | What it does |
|---|---|
| `pnpm dev` | Start dev server on port 3004 |
| `pnpm build` | Build for production |
| `pnpm start` | Run production build |
| `pnpm db:push` | Apply schema changes to the database |
| `pnpm db:seed` | Re-seed the database with sample data |
| `pnpm db:studio` | Open Prisma Studio (visual DB browser) |

---

## Tech stack

- **Next.js 15** — App Router, Server Actions
- **Prisma 7 + SQLite** — local database, no external DB needed
- **Tailwind CSS v4** — utility-first styling
- **Framer Motion** — animations
- **Recharts** — charts and graphs
- **pnpm** — package manager
