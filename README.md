# Finance OS

A personal finance dashboard built with Next.js, Prisma (SQLite), and Tailwind CSS.

---

## First-time setup (Mac)

### 1. Install Node.js and pnpm

```bash
brew install node
npm install -g pnpm
```

### 2. Clone and open in VS Code

```bash
git clone https://github.com/amruthasatishkumar/finance-os.git
cd finance-os
code .
```

### 3. Install dependencies

Open the VS Code Terminal (`Ctrl+`` ` or **Terminal → New Terminal**) and run:

```bash
pnpm install
```

### 4. Create the environment file

In the VS Code Terminal, run:

```bash
echo 'DATABASE_URL="file:./prisma/dev.db"' > .env.local
```

Or manually create a file called `.env.local` in the project root with:

```
DATABASE_URL="file:./prisma/dev.db"
```

### 5. Set up the database

```bash
pnpm db:push
pnpm db:seed
```

### 6. Start the app

```bash
pnpm dev
```

Open **[http://localhost:3004](http://localhost:3004)** in your browser. Done.

> The app is hardcoded to port **3004** — `pnpm dev` will always start it there.

---

## Every time after that

Just open the folder in VS Code and run:

```bash
pnpm dev
```

---

## Other useful commands

| Command | What it does |
|---|---|
| `pnpm build` | Build for production |
| `pnpm start` | Run production build on port 3004 |
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

