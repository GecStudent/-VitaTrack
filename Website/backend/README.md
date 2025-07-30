# VitaTrack Backend

This directory contains the Express.js backend API for VitaTrack, following the architecture in [backend-architecture.mermaid](../../Architecture/backend-architecture.mermaid) and the endpoints in [API Endpoints.ipynb](../../Architecture/API%20Endpoints.ipynb).

## Structure
- `src/server.ts` — Main entry point, clustering, graceful shutdown
- `src/app.ts` — Express app, middleware, routes
- `src/middleware/` — Middleware (CORS, helmet, logging, etc.)
- `src/utils/` — Utilities and helpers
- `src/types/` — TypeScript types and interfaces
- `src/config/` — Environment-based configuration

## Conventions
- TypeScript throughout
- API versioning and OpenAPI docs
- Layered architecture: routes → controllers → services → data access 