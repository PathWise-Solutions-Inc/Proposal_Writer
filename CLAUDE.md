# CLAUDE.md

This file provides guidance to Claude Code when working with the Proposal Writer repository.

## Project Overview

Proposal Writer is an AI-powered proposal intelligence platform for RFP response automation.
- **Tech Stack**: React + TypeScript, Node.js microservices, PostgreSQL, Redis, OpenRouter AI
- **Architecture**: Monorepo with Lerna, microservices backend, Material-UI frontend

## Current Status

**Active Phase**: Phase 3 - Proposal Builder (Week 7-10)
- ✅ Phase 1: Authentication (JWT, protected routes, user management)
- ✅ Phase 2: RFP Analysis Engine (file upload, AI analysis, evaluation rubrics)
- 🔄 Phase 3: Adaptive Proposal Builder with drag-and-drop

**Repository**: https://github.com/PathWise-Solutions-Inc/Proposal_Writer

## Service Architecture

| Service | Port | Purpose | Start Command |
|---------|------|---------|---------------|
| Frontend | 3000 | React app | `cd packages/web-app && npm run dev` |
| Auth Service | 8001 | JWT auth | `cd services/auth-service && npm run dev` |
| RFP Analysis | 8002 | AI processing | `cd services/rfp-analysis-service && npm run dev` |
| PostgreSQL | 5432 | Database | System service |
| Redis | 6379 | Queues/cache | `redis-server` |

## Proactive Tool Usage

### Before Implementation:
- Use `mcp__context7` to check latest docs for libraries (React, TypeORM, Material-UI, etc.)
- Use relevant architect agents (`backend-architect`, `frontend-architect`) for design decisions

### After Code Changes:
- Use `code-reviewer` agent after implementing significant features
- Use `security-auditor` agent for auth/data handling changes
- Run lint/typecheck: `npm run lint && npm run typecheck`

### After UI Changes:
- Use Playwright MCP for automated UI testing
- Test drag-and-drop interactions and user workflows
- Verify responsive design across viewports

### Common Patterns:
- New library feature → Context7 for latest docs
- Code complete → code-reviewer agent
- UI changes → Playwright testing
- Errors → debugger agent
- Performance issues → database-optimizer

## Common Issues & Solutions

### Port Conflicts
**Always kill existing processes before restarting services:**
```bash
# Kill services on specific ports
lsof -ti:8001 | xargs kill -9  # Auth service
lsof -ti:8002 | xargs kill -9  # RFP service
lsof -ti:3000 | xargs kill -9  # Frontend
```

### TypeScript Import Errors
- **Remove ALL unused imports** before running services
- Services crash on startup with unused imports
- Common with TypeORM decorators (`OneToMany`, etc.)

### Vite Proxy Issues
- Frontend proxy configured: `/api` → `localhost:8002`
- Check `vite.config.ts` if API calls fail

## Development Workflow

1. **Environment Setup**:
   - Copy `.env.example` to `.env`
   - Set `OPENROUTER_API_KEY` for AI features
   - Run `npm install` in root directory

2. **Starting Services**:
   - Start PostgreSQL and Redis first
   - Then auth service, RFP service, frontend
   - Check all ports are free before starting

3. **Testing**:
   - Unit tests: `npm test`
   - E2E tests: `npm run test:e2e`
   - Always test with Playwright after UI changes

## Quick Reference

- **OpenRouter API**: Primary AI integration (Claude 3.5 Sonnet)
- **Database**: TypeORM with PostgreSQL
- **Queue**: Bull with Redis for async processing
- **File Storage**: Local filesystem in `uploads/` directory
- **Auth**: JWT with access/refresh tokens