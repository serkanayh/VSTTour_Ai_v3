# VSTTour AI - Task & Sprint Plan

This document defines the development milestones, sprint breakdowns, and tasks required to deliver the **VSTTour AI platform**.

---

## Sprint Overview

| Sprint | Duration | Focus |
|---------|-----------|--------|
| Sprint 1 | Week 1–2 | Core NestJS setup, DB schema, Auth |
| Sprint 2 | Week 3–4 | Process Module & Queue System |
| Sprint 3 | Week 5–6 | AI Orchestrator & Prompt Logic |
| Sprint 4 | Week 7–8 | Approval Workflow & Integration |
| Sprint 5 | Week 9–10 | Frontend Dashboard & Testing |

---

## Task Breakdown

### Sprint 1 - Core Setup
- [ ] Initialize NestJS + TypeScript project.
- [ ] Configure PostgreSQL + Prisma ORM.
- [ ] Setup Docker Compose with Redis & RabbitMQ.
- [ ] Implement Auth (JWT + Role-based guard).
- [ ] Create DB migration scripts.

### Sprint 2 - Process Management
- [ ] Implement Process entity CRUD.
- [ ] Integrate BullMQ for async task handling.
- [ ] Build SOP JSON structure and schema validation.
- [ ] Create test seed data for AI evaluation.

### Sprint 3 - AI Orchestrator
- [ ] Integrate OpenAI API (Realtime + Whisper).
- [ ] Implement prompt template builder.
- [ ] Create model fallback mechanism.
- [ ] Validate AI responses (schema + retry logic).

### Sprint 4 - Governance & Integrations
- [ ] Manager approval flow with email notifications.
- [ ] Create n8n export endpoint.
- [ ] Add audit logging and process status transitions.

### Sprint 5 - Frontend (Next.js)
- [ ] Dashboard for users & managers.
- [ ] Process list, chat-based input UI.
- [ ] Admin AI configuration panel.
- [ ] End-to-end testing & performance validation.

---

## Deliverables

| Deliverable | Owner | Tool |
|--------------|--------|------|
| Backend APIs | Dev Team | NestJS |
| Database | DevOps | PostgreSQL |
| Queue & Cache | DevOps | Redis |
| Frontend | UI/UX Team | Next.js |
| Testing | QA | Postman + Jest |

---

© 2025 VSTTour AI Systems. All Rights Reserved.
