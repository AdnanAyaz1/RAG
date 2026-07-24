# RAG

An AI Engineer Workbench for inspecting, debugging, and evaluating Retrieval-Augmented Generation systems.

## Project Structure

```
rag/
├── apps/
│   ├── web/          # Next.js frontend
│   ├── api/          # Backend API
│   └── ai/           # AI/RAG pipeline
├── docs/             # Documentation
├── research/         # Research notes & experiments
├── docker/           # Docker configurations
└── scripts/          # Utility scripts
```

## Philosophy

**Everything should be inspectable.** No black boxes. Every step of the RAG pipeline—from query transformation to retrieval to generation—is visible and debuggable.

## Tech Stack

### Frontend
- Next.js + TypeScript
- Tailwind CSS + Shadcn UI
- TanStack Query + Zustand
- Recharts

### Backend
- See `docs/backend/`

## Getting Started

```bash
# Install dependencies
npm install

# Start development
npm run dev
```

## Documentation

- [Architecture](docs/architecture/)
- [Frontend](docs/frontend/)
- [Backend](docs/backend/)
- [RAG Pipeline](docs/rag/)
