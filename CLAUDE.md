# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Proposal Writer is an AI-powered proposal intelligence platform designed to revolutionize how organizations respond to RFPs. The project is currently in the planning phase with comprehensive documentation but no implementation yet.

## Repository Structure

The repository contains product documentation and research:
- `product-requirements-document.md` - Comprehensive PRD defining the full vision
- `Research/` - Market analysis, technical research, and value proposition strategy
- No code implementation exists yet

## Key Product Concepts

### Core Functionality
1. **RFP Analysis Engine** - Automated extraction of evaluation criteria and scoring rubrics from RFPs
2. **Client Intelligence System** - Automated research across multiple sources
3. **Adaptive Proposal Builder** - Drag-and-drop document structuring inspired by NovelCraft
4. **AI Content Generation** - Context-aware proposal content using Claude 3.5 Sonnet or GPT-4
5. **Compliance Tracker** - Automated requirement tracking and verification

### Target Architecture (from PRD)
- Microservices architecture with Node.js backend
- React/Vue frontend with drag-and-drop capabilities
- PostgreSQL for structured data, MongoDB for documents
- Redis for caching and real-time features
- Docker/Kubernetes deployment
- AWS/Azure cloud infrastructure

## Development Status

### Current Phase: MVP Development - Week 0 Complete ✅

**Completed:**
- ✅ Project foundation and structure
- ✅ Monorepo setup with Lerna
- ✅ Frontend application skeleton (React + TypeScript + Vite)
- ✅ Backend microservices structure
- ✅ Docker configuration
- ✅ CI/CD pipeline
- ✅ Development environment setup
- ✅ OpenRouter API integration configured and tested
- ✅ AI service structure created with OpenRouter client

**Completed:**
- ✅ Phase 1: Authentication & Infrastructure (Week 1) - August 3, 2025
  - JWT-based authentication with access/refresh tokens
  - User registration and login with secure password validation
  - Protected routes with React Router
  - CSRF protection and rate limiting
  - Frontend authentication UI (login/register pages)
  - Redux authentication state management
  - Successful end-to-end authentication flow tested

**In Progress:**
- 🔄 Phase 2: RFP Analysis Engine (Week 3-6) - 90% Complete
  - ✅ File upload infrastructure with validation and storage
  - ✅ Database models (RFP, Organization, Proposal) with relationships
  - ✅ OpenRouter AI integration for RFP analysis
  - ✅ Evaluation rubric generation using Claude 3.5 Sonnet
  - ✅ Frontend upload interface with drag-and-drop functionality
  - ✅ TypeScript compilation and service startup resolved
  - ✅ API proxy configuration for development environment
  - ✅ End-to-end testing with Playwright validation
  - 🔄 Current: Document text extraction with Apache Tika (final task)

**Upcoming Phases:**
- Phase 2: RFP Analysis Engine (Week 3-6) - Core MVP feature
- Phase 3: Proposal Builder (Week 7-10)
- Phase 4: Compliance & Export (Week 11-12)
- Phase 5: Client Research (Week 13-14)
- Phase 6: Testing & Launch (Week 15-16)

### Progress Tracking
Detailed progress is tracked in `/Project_Management/MVP_Development_Plan.md`

### Recent Technical Achievements (August 2025)

**RFP Upload System - Phase 2 Core Implementation:**
- Full-stack file upload with FormData handling and multipart support
- Comprehensive TypeScript type definitions for RFP analysis results
- Drag-and-drop UI with Material-UI components and file validation
- Database schema with JSONB storage for complex analysis data
- Bull queue integration with Redis for async RFP processing
- OpenRouter API integration for AI-powered RFP analysis

**Development Environment Fixes:**
- Fixed Vite proxy configuration for API routing (`/api` → `localhost:8002`)
- Resolved TypeScript compilation errors in microservices
- Created demo authentication bypass for testing workflows
- Implemented comprehensive Playwright test coverage

**Service Architecture:**
- RFP Analysis Service: `localhost:8002` (Node.js + TypeORM + OpenRouter)
- Auth Service: `localhost:8001` (JWT + refresh tokens + CSRF protection)
- Frontend: `localhost:3000` (React + TypeScript + Vite + Material-UI)

### Implementation Guidelines
When implementing:
- Start with MVP features defined in Section 8 of the PRD
- Follow the technical recommendations in the technical research report
- Consider the value propositions outlined in the strategy document
- Refer to the MVP Development Plan for current priorities

## Key Technical Decisions (from research)

### AI/NLP Integration
- **Now Using: OpenRouter API** - Unified access to multiple AI models
  - Primary model: Claude 3.5 Sonnet via OpenRouter
  - Alternative models available: GPT-4, Gemini, Llama, etc.
  - Cost-effective pay-as-you-go pricing
  - API Key configured in `.env` as `OPENROUTER_API_KEY`
- Consider DeepRFP or AutoRFP.ai for specialized RFP processing

### Frontend Framework
- Recommended: React with react-beautiful-dnd for drag-and-drop
- Alternative: Vue.js with Vue.Draggable

### Backend Services
- Node.js with Express/Fastify for API services
- Python microservices for AI/ML operations
- Message queue (RabbitMQ/Kafka) for async processing

## Important Context

- The platform targets mid-market B2B services companies (50-500 employees)
- Initial focus on IT services vertical
- SaaS model with $49-299/user/month pricing
- Key differentiator: First automated RFP evaluation rubric generator
- Success metric: 40% average win rate improvement for users

## GitHub Integration

The repository is hosted at: https://github.com/PathWise-Solutions-Inc/Proposal_Writer
- Uses main branch as default
- Public repository for community collaboration

## Common Development Issues and Solutions

### TypeScript Unused Import Errors
When you encounter TypeScript errors about unused imports (e.g., `'OneToMany' is declared but its value is never read`):
- **Always remove unused imports** before committing or running services
- **Use your editor's "Organize Imports" feature** or manually clean up imports
- **Common in TypeORM entities**: When copying entity boilerplate, remove unused decorators like `OneToMany` if not defining relationships
- **This blocks service startup**: The auth-service and other TypeScript services will crash on startup with these errors

### Running Services
When testing the application, ensure all required services are running:
1. **Auth Service** (port 8001): `cd services/auth-service && npm run dev`
2. **RFP Analysis Service** (port 8002): `cd services/rfp-analysis-service && npm run dev`
3. **Frontend** (port 3000): `cd packages/web-app && npm run dev`
4. **Redis** (for queues): `redis-server` or via Docker
5. **PostgreSQL** (for database): Ensure database is running

## Available AI Agents

Claude Code provides specialized agents that can assist with different aspects of the Proposal Writer project:

### Product Development Agents
- **ui-ux-designer** - Design user interfaces for the proposal builder, RFP analyzer, and dashboard
- **api-documenter** - Document APIs for RFP processing, client intelligence, and proposal generation services

### Technical Implementation Agents
- **backend-architect** - Design microservices architecture, API endpoints, and database schemas
- **frontend-architect** - Plan React/Vue component structure and drag-and-drop implementation
- **database-optimizer** - Optimize PostgreSQL/MongoDB schemas for RFP and proposal data
- **ai-engineer** - Implement Claude/GPT-4 integration and prompt engineering for content generation
- **security-auditor** - Ensure secure handling of sensitive RFP and proposal data

### DevOps & Deployment Agents
- **deployment-engineer** - Set up Docker/Kubernetes configurations and CI/CD pipelines
- **terraform-specialist** - Create infrastructure as code for AWS/Azure deployment
- **performance-engineer** - Optimize platform performance for large RFP processing

### Quality Assurance Agents
- **test-automator** - Create test suites for RFP parsing, proposal generation, and compliance checking
- **code-reviewer** - Review code quality and adherence to architectural decisions
- **debugger** - Troubleshoot issues in RFP processing or AI content generation

Use these agents by invoking them with the Task tool when you need specialized assistance in their respective domains.

## Testing Tools

### Playwright MCP
The Playwright MCP (Model Context Protocol) server is available for automated browser testing and UI/UX validation. Use this tool whenever:
- New UI components or pages are added
- UI/UX changes need to be tested
- End-to-end user workflows need validation
- Visual regression testing is required
- Cross-browser compatibility needs verification

Key capabilities:
- Browser automation for testing user interactions
- Screenshot capture for visual verification
- Form filling and button clicking automation
- Navigation and page state validation
- Console message and network request monitoring

Example use cases for Proposal Writer:
- Testing the drag-and-drop proposal builder interface
- Validating RFP upload and parsing workflows
- Verifying authentication flows and protected routes
- Testing responsive design across different viewports
- Ensuring compliance tracker UI updates correctly