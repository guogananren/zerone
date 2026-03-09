# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Zerone is a Vue 3 + Express full-stack application featuring an AI chat interface. The frontend is a Vue SPA with Element Plus UI, and the backend is a BFF (Backend-for-Frontend) that proxies requests to Alibaba's DashScope API (Qwen model).

## Commands

```sh
# Install dependencies
pnpm install

# Run frontend dev server (Vite on port 5173)
npm run dev

# Run BFF server (Express on port 3001)
npm run dev:server

# Run both frontend and backend
npm run dev:all

# Type-check and build for production
npm run build

# Lint code (oxlint + ESLint)
npm run lint

# Type-check only
npm run type-check
```

## Architecture

### Frontend (`src/`)
- **Pages**: `@/pages` - Route pages (home, chat)
- **Components**: `@/common/components` - Shared components
- **Stores**: `@/stores` - Pinia state management
- **APIs**: `@/common/apis` - HTTP request modules
- **Router**: `@/router` - Vue Router configuration

### Backend (`server/`)
Express BFF server that:
- Receives chat requests from frontend at `/api/chat`
- Forwards to Alibaba DashScope API (Qwen Plus model)
- Returns streaming responses

### API Proxy
- Vite proxies `/api/*` requests to `http://localhost:3001`
- Backend reads `DASHSCOPE_API_KEY` from `.env`

## Path Aliases

- `@` → `src`
- `@@` → `src/common`

## Tech Stack

- Vue 3.5+ (Composition API + `<script setup lang="ts">`)
- Vite 7+
- Vue Router 5
- Pinia 3
- Element Plus
- TypeScript
- SCSS
- Express + OpenAI SDK (DashScope)

## Key Conventions

- Component files: PascalCase (e.g., `ChatBot.vue`)
- Page files: kebab-case (e.g., `chat/index.vue`)
- TS/JS files: kebab-case
- Use `ref` over `reactive`
- Prefer interfaces over types for object definitions
- Avoid `any`, use `unknown` instead

## Git Commit Format

```
type: message
```

Types: `feat`, `fix`, `perf`, `refactor`, `docs`, `types`, `test`, `ci`, `revert`, `chore`
