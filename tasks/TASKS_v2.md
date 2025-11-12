# Development Tasks – Phase 2  

## Overview  
This phase extends the platform with features inspired by Aicado such as quickstart embedding, customizable agent styling, analytics dashboards, and voice interactions.  

## Tasks  

- **Project Setup and Dependencies**  
  - Set up Node.js backend with NestJS and Prisma ORM.  
  - Initialize Next.js frontend with Tailwind CSS.  
  - Configure PostgreSQL database and environment variables.  

- **Authentication and Role Management**  
  - Implement JWT-based authentication.  
  - Define roles: employee, supervisor, admin.  
  - Protect routes and components based on roles.  

- **Database Schema**  
  - Create tables: users, processes, steps, substeps, conversations, conversation_messages, flows, AI settings.  
  - Use Prisma migrations to apply schema.  

- **Process CRUD**  
  - Build API endpoints for creating, reading, updating and deleting processes, steps and substeps.  
  - Allow uploading screenshots for steps and substeps.  

- **AI Analysis Module**  
  - Integrate with GPT - 4o - mini to evaluate collected processes.  
  - Compute automation scores based on frequency, complexity, manual effort and risk.  
  - Provide admin settings for AI parameters such as temperature and model.  

- **Voice Review Module**  
  - Integrate OpenAI Realtime API to hold voice conversations with employees when details are missing.  
  - Use Whisper to transcribe voice responses.  
  - Update the process with additional steps gathered from the conversation.  

- **Supervisor Dashboard**  
  - Create dashboard listing all processes by department and automation score.  
  - Include actions to approve or reject processes.  
  - Provide a button to generate an n8n flow for high scoring processes.  

- **n8n Integration**  
  - Build service to generate flow definitions from approved processes.  
  - Use n8n REST API to create, test and publish flows.  
  - Track flow status (draft, testing, active).  

- **Styling & Embed**  
  - Provide options to customise the agent's look and feel (colors, logo, greeting).  
  - Generate embed script to insert the agent into external dashboards or sites.  

- **Analytics Dashboard**  
  - Implement charts summarizing automation scores, ROI and department - level metrics.  
  - Display counts of processes by status (draft, analyzed, published).  

- **Notification System**  
  - Send email notifications when a process is submitted, approved or rejected.  
  - Optionally add real time notifications via WebSocket.  

- **Testing and Documentation**  
  - Write unit and integration tests for backend and frontend components.  
  - Document API endpoints and provide a user guide for the platform.
