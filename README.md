# VSTTour AI Platform

Enterprise-grade platform for process automation and ROI estimation. Collect, analyze, and automate company processes with real-time ROI calculation, AI-driven documentation, and seamless n8n integration.

## Features

- **AI-Driven Process Documentation**: Interactive AI assistant guides users through process documentation
- **Real-time ROI Estimation**: Calculate potential savings based on frequency, duration, and cost data
- **Approval Workflow**: Manager approval system with email notifications
- **n8n Integration**: Export approved processes as n8n workflows
- **Role-Based Access Control**: User, Developer, Manager, and Admin roles
- **Audit Logging**: Complete audit trail of all actions
- **Process Versioning**: Track changes and maintain process history
- **Secure Configuration**: Encrypted API keys and sensitive data

## Technology Stack

- **Backend**: NestJS (Node.js + TypeScript)
- **Database**: PostgreSQL with Prisma ORM
- **Cache & Queue**: Redis + BullMQ
- **Message Broker**: RabbitMQ
- **AI Provider**: OpenAI (GPT-4)
- **API Documentation**: Swagger/OpenAPI
- **Authentication**: JWT + Passport

## Quick Start

### 1. Install dependencies

```bash
npm install
```

### 2. Setup environment variables

Copy `.env.example` to a new `.env` file and configure:

```bash
cp .env.example .env
```

Key variables to configure:
- `DATABASE_URL`: PostgreSQL connection string
- `JWT_SECRET`: Secret key for JWT tokens
- `OPENAI_API_KEY`: Your OpenAI API key (optional for development)
- `ENCRYPTION_KEY`: 32-character key for encrypting sensitive data

### 3. Start infrastructure services

```bash
docker-compose up -d
```

This starts:
- PostgreSQL (port 5432)
- Redis (port 6379)
- RabbitMQ (port 5672, management UI: 15672)
- n8n (port 5678)

### 4. Run database migrations

```bash
npm run prisma:generate
npm run prisma:migrate
```

### 5. Seed the database

```bash
npm run prisma:seed
```

This creates sample users:
- **Admin**: admin@vsttour.com / admin123
- **Manager**: manager@vsttour.com / manager123
- **User**: ayse.yilmaz@vsttour.com / user123

### 6. Start the application

```bash
# Development mode
npm run start:dev

# Production mode
npm run build
npm run start:prod
```

### 7. Access API Documentation

Open: `http://localhost:3000/api/v1/docs`

## API Endpoints

For complete API documentation, visit the Swagger UI at `/api/v1/docs` after starting the application.

### Key Endpoints

- **Auth**: `/api/v1/auth/*` - Authentication and authorization
- **Process**: `/api/v1/process/*` - Process CRUD and ROI calculation
- **AI**: `/api/v1/process/chat-input` - AI-guided documentation
- **Approval**: `/api/v1/approval/*` - Manager approval workflow
- **Integration**: `/api/v1/integration/export/*` - n8n/JSON export
- **Admin**: `/api/v1/admin/*` - System configuration

## User Roles

- **USER**: Create and manage own processes, submit for approval
- **DEVELOPER**: Same as USER + technical access
- **MANAGER**: Approve/reject processes, view department data
- **ADMIN**: Full system access, configure AI, manage users

## Development Commands

```bash
# Run tests
npm run test
npm run test:e2e
npm run test:cov

# Lint and format
npm run lint
npm run format

# Database
npm run prisma:studio  # Open database GUI
npm run prisma:seed    # Seed with sample data
```

## Project Structure

```
src/
├── admin/           # Admin module (AI config)
├── ai-orchestrator/ # AI integration
├── approval/        # Approval workflow
├── auth/            # Authentication
├── integration/     # n8n export
├── prisma/          # Database service
├── process/         # Process management
└── users/           # User management
```

## Documentation

See `/docs` folder for:
- Product Requirements Document (PRD)
- Task and Sprint Plan
- Technical Architecture

## Security

- JWT authentication
- Role-based access control
- AES-256 encryption
- Input validation
- Audit logging
- Rate limiting

## License

Copyright © 2025 VSTTour AI Systems. All Rights Reserved.