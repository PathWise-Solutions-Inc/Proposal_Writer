# Proposal Writer 🚀

An AI-powered proposal intelligence platform that revolutionizes how organizations respond to RFPs through automated analysis, intelligent content generation, and adaptive document structuring.

## 🌟 Overview

Proposal Writer transforms the traditional RFP response process by:
- **Automating RFP analysis** to extract evaluation criteria and generate scoring rubrics
- **Conducting intelligent client research** across multiple sources automatically
- **Providing adaptive proposal structuring** with drag-and-drop flexibility
- **Generating contextual content** using advanced AI models (Claude 3.5 Sonnet)
- **Ensuring compliance** through automated requirement tracking

## 🏗️ Architecture

This project uses a microservices architecture with:
- **Frontend**: React + TypeScript + Vite + Material-UI
- **Backend**: Node.js microservices with Express/Fastify
- **Databases**: PostgreSQL (relational), MongoDB (documents), Redis (cache)
- **AI/ML**: Claude 3.5 Sonnet API, custom NLP models
- **Infrastructure**: Docker, Kubernetes, AWS/Azure
- **API Gateway**: Kong for service orchestration

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ and npm 9+
- Docker and Docker Compose
- Git

### Installation

1. Clone the repository:
```bash
git clone https://github.com/PathWise-Solutions-Inc/Proposal_Writer.git
cd Proposal_Writer
```

2. Install dependencies:
```bash
make install
```

3. Set up environment variables:
```bash
cp .env.example .env
# Edit .env with your configuration
```

4. Start the development environment:
```bash
make quickstart
```

This will:
- Install all dependencies
- Start Docker containers (databases, cache, etc.)
- Initialize databases
- Start all services in development mode

5. Access the application:
- Frontend: http://localhost:3000
- API Gateway: http://localhost:8080
- Auth Service: http://localhost:8001
- RFP Analysis Service: http://localhost:8002

## 📁 Project Structure

```
proposal-writer/
├── packages/              # Frontend packages
│   ├── web-app/          # Main React application
│   ├── ui-components/    # Shared UI component library
│   └── shared/           # Shared types and utilities
├── services/             # Backend microservices
│   ├── auth-service/     # Authentication & authorization
│   ├── rfp-analysis-service/  # RFP processing & analysis
│   ├── proposal-service/ # Proposal management
│   ├── ai-service/       # AI content generation
│   └── document-service/ # Document processing & export
├── docker-compose.yml    # Docker configuration
├── kong/                 # API Gateway configuration
└── scripts/              # Utility scripts
```

## 🛠️ Development

### Available Commands

```bash
make dev          # Start development environment
make build        # Build all packages
make test         # Run all tests
make lint         # Run linters
make docker-up    # Start Docker containers
make docker-down  # Stop Docker containers
make docker-logs  # View Docker logs
```

### Development Workflow

1. Make changes to code
2. Tests run automatically on file changes
3. Commit changes (pre-commit hooks run linting)
4. Push to branch and create PR
5. CI/CD pipeline runs tests and builds

## 🧪 Testing

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm run test:coverage
```

## 📚 Documentation

- [Product Requirements Document](product-requirements-document.md)
- [Market Research](Research/proposal-software-market-research-report.md)
- [Technical Research](Research/technical-research-report.md)
- [Value Proposition Strategy](Research/value-proposition-strategy.md)
- [API Documentation](docs/api/README.md) *(coming soon)*
- [Architecture Guide](docs/architecture/README.md) *(coming soon)*

## 🤝 Contributing

We welcome contributions! Please see our [Contributing Guide](CONTRIBUTING.md) for details.

### Development Setup

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 🔒 Security

- All data is encrypted in transit (TLS 1.3) and at rest (AES-256)
- JWT-based authentication with refresh token rotation
- Role-based access control (RBAC)
- Regular security audits and penetration testing

## 📈 Roadmap

### Phase 1: MVP (Q1 2025)
- ✅ Core RFP analysis engine
- ✅ Evaluation rubric generator
- ✅ Basic proposal builder
- ✅ AI content generation
- ⬜ Beta launch with 10 customers

### Phase 2: Intelligence Enhancement (Q2 2025)
- ⬜ Advanced competitive intelligence
- ⬜ Win pattern analysis
- ⬜ Salesforce integration
- ⬜ Professional services vertical

### Phase 3: Scale (Q3 2025)
- ⬜ Government contracting support
- ⬜ Advanced analytics dashboard
- ⬜ API platform launch
- ⬜ Mobile applications

## 📊 Success Metrics

- **Goal**: 40% average win rate improvement for users
- **Time Savings**: 70% reduction in proposal creation time
- **Target Market**: Mid-market B2B services companies (50-500 employees)
- **Pricing**: SaaS model $49-299/user/month

## 📝 License

This project is proprietary software. All rights reserved.

## 🙏 Acknowledgments

- Built with [Claude 3.5 Sonnet](https://www.anthropic.com/claude) for AI capabilities
- Inspired by NovelCraft's document structuring approach
- Thanks to all contributors and beta testers

## 📞 Contact

- **Website**: [proposalwriter.ai](https://proposalwriter.ai) *(coming soon)*
- **Email**: support@proposalwriter.ai
- **GitHub Issues**: [Report bugs or request features](https://github.com/PathWise-Solutions-Inc/Proposal_Writer/issues)

---

Built with ❤️ by the Proposal Writer Team