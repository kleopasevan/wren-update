# DataAsk Frontend

Next.js 15 frontend for RantAI DataAsk platform.

## Features

- **Next.js 15** - App Router, Server Components, Server Actions
- **shadcn/ui** - Beautiful, accessible UI components
- **Tailwind CSS** - Utility-first CSS framework
- **Tanstack Query** - Powerful data synchronization
- **Zustand** - Simple state management
- **TypeScript** - Type safety

## Setup

### Prerequisites

- Node.js 18+
- npm or yarn

### Installation

```bash
# Install dependencies
npm install
# or
yarn install

# Start development server
npm run dev
# or
yarn dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser.

## Environment Variables

Create a `.env.local` file:

```bash
NEXT_PUBLIC_API_URL=http://localhost:8000
```

## Project Structure

```
dataask-frontend/
├── app/                  # Next.js 15 App Router
│   ├── layout.tsx       # Root layout
│   ├── page.tsx         # Homepage
│   └── globals.css      # Global styles
├── components/          # React components
│   ├── ui/             # shadcn/ui components
│   └── ...             # Custom components
├── lib/                # Utilities
│   ├── api.ts          # API client
│   └── utils.ts        # Helper functions
└── public/             # Static assets
```

## Development

### Adding shadcn/ui Components

```bash
npx shadcn-ui@latest add button
npx shadcn-ui@latest add card
npx shadcn-ui@latest add dialog
```

### Build for Production

```bash
npm run build
npm run start
```

## Docker

```bash
# Build
docker build -t dataask-frontend .

# Run
docker run -p 3000:3000 dataask-frontend
```
