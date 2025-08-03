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

This is a greenfield project in the planning phase. When implementing:
- Start with MVP features defined in Section 8 of the PRD
- Follow the technical recommendations in the technical research report
- Consider the value propositions outlined in the strategy document

## Key Technical Decisions (from research)

### AI/NLP Integration
- Primary: Claude 3.5 Sonnet API for content generation
- Alternative: GPT-4 for specific use cases
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

## Available AI Agents

Claude Code provides specialized agents that can assist with different aspects of the Proposal Writer project:

### Research & Analysis Agents
- **market-research-analyst** - Conduct market research for RFP automation space, competitor analysis, and market opportunities
- **technical-solutions-researcher** - Research technical approaches for RFP parsing, AI integration, and document processing
- **value-proposition-strategist** - Develop unique value propositions and competitive advantages for the platform

### Product Development Agents
- **prd-architect** - Create and refine product requirements documents based on research findings
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