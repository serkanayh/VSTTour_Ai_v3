# VSTTour AI – Product Requirement Document (PRD)

## 1. Overview
VSTTour AI is an enterprise-grade platform designed to collect, analyze, and automate company processes with real-time ROI estimation. It combines AI-driven process documentation, automation scoring, and system orchestration through scalable microservices.

## 2. Objectives
- Identify and document repetitive business processes in standardized SOP format.
- Perform real-time ROI estimation based on employee cost and frequency data.
- Provide modular AI/STT integrations for flexible automation flows.
- Offer enterprise-grade governance (approvals, version control, encryption).

## 3. Key User Flow
1. Login & Role Detection → User, Developer, Manager, or Admin.
2. Process Entry → User describes a task (voice or text).
3. AI Analysis → Platform asks guided questions to document the task.
4. ROI Calculation → Frequency × Duration × Cost = Efficiency metric.
5. SOP Generation → Detailed standardized steps produced in JSON + table view.
6. Approval & Export → Manager approval required before n8n export.

## 4. System Architecture
### 4.1 Components
| Layer | Technology | Description |
|-------|-------------|-------------|
| Backend | NestJS (Node.js) | Modular architecture, dependency injection |
| Database | PostgreSQL | JSONB + relational schema |
| Cache | Redis | Session & token management |
| Queue | RabbitMQ / Redis Bull | Async AI task orchestration |
| STT | Google / Azure | Speech-to-text services |
| Gateway | Express + JWT | Auth, rate limiting, HTTPS enforcement |

### 4.2 Design Principles
- All AI tasks >5s use message queue.
- Stateless microservices via API Gateway.
- Retry + fallback mechanism for AI model errors.
- Full audit logs and encrypted config secrets.

## 5. Database Schema (ERD Overview)
### Main Entities
1. Users: id, name, role, department_id
2. AI_Configurations: system_prompt, api_key_encrypted, model_mapping
3. Processes: id, process_name, status (enum: Draft, Approved, Rejected), current_version
4. Process_Versions: sop_json (JSONB), form_data, created_by, timestamp

## 6. API Endpoints
| Category | Endpoint | Method | Error Codes |
|-----------|-----------|---------|--------------|
| Auth | /auth/sso-login | POST | 401 Unauthorized |
| Process Flow | /process/start-form | POST | 400 Missing Data |
| Process Flow | /process/chat-input | POST | 429 Rate Limit / 503 AI Error |
| Integration | /process/{id}/export/n8n | GET | 403 No Approval / 500 Conversion Error |
| Admin | /admin/ai-config | PUT | 403 Permission Denied |

## 7. Automation & AI Logic
### 7.1 Dynamic Prompting
Prompts are built dynamically using:
- System prompt
- Task context (process name, department, time data)
- User-provided answers

### 7.2 Error Recovery
If model output fails schema validation → re-prompt with fallback model.

### 7.3 n8n Export Logic
- Export only if status = Approved.
- SOP JSON mapped to n8n workflow schema.
- Validation required before upload.

## 8. Governance & Security
### 8.1 Security
- AES-256 encryption for sensitive keys.
- HTTPS mandatory across services.
- Input sanitization to prevent XSS/SQLi.

### 8.2 Governance Rules
- WaitingApproval processes visible only to Managers.
- On approval, previous version archived.
- All user actions logged with timestamp & IP.

## 9. Success Metrics
| Metric | Target |
|---------|--------|
| AI accuracy in SOP generation | ≥ 92% |
| Average ROI prediction variance | < 5% |
| Process approval cycle time | < 1 hour |

## 10. Appendix A – User Simulation
**User**: Ayşe Yılmaz (Accounting Department)  
**Process**: Uploading expense reports to ERP  
**Frequency**: 12 times/day  
**Duration**: 7 minutes/task  
**Cost per hour**: 120 TRY

### Simulation Steps
| Step | Actor | Message / Action | System Behavior |
|------|--------|------------------|-----------------|
| 1 | AI | “Hi Ayşe, let’s analyze your daily process.” | User context loaded. |
| 2 | AI | “What’s the average cost per hour for this task?” | Stores in form_data. |
| 3 | AI | “Do you process any personal data (KVKK)?” | Risk score added. |
| 4 | User | “We manually input invoices.” | Detected repetitive action. |
| 5 | System | Automation Score: 9/10 | Marked as “High Automation Potential.” |

### Approval Chain
1. Ayşe submits → Status: WaitingApproval.
2. Manager receives email → Approves.
3. Developer requests export before approval → 403 Forbidden.
4. After approval → Export available as n8n JSON.
