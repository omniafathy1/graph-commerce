# Graph Commerce

Full-stack e-commerce app built with **Next.js 16**, **TypeScript** and a **graph database** (CognoDB, queried with Cypher over Bolt).

> Work in progress: features are being added incrementally.

## Tech stack

- Next.js 16 (App Router), React, TypeScript, Tailwind CSS
- CognoDB (graph DB) via `neo4j-driver`
- TanStack React Query, Zustand
- bcrypt + JWT (httpOnly cookies) for authentication

## Getting started

1. `npm install`
2. Copy `.env.example` to `.env.local` and fill in your values
3. `npm run dev`

## Roadmap

- [x] Database layer
- [x] Authentication and route protection
- [x] UI foundations (React Query, Zustand toasts, header)
- [x] Product catalog, filters and quick-view modal
- [ ] Cart and checkout
- [ ] Admin dashboard
- [ ] Sales analytics and caching