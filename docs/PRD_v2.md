# Product Requirements Document (v2)

## 1. Product Definition
VSTTour_Ai_v3 is an AI powered platform that collects manual business processes from employees, analyses them and fills gaps via targeted voice conversations, then generates automation flows in n8n for the most promising candidates. Inspired by the capabilities of the Aicado platform, this version supports text, voice and optional image interactions, offers quick start and embedding into internal dashboards, allows styling/branding of the agent interface and provides analytics to measure return on investment and departmental efficiency gains.

## 2. User Roles
- **Employee:** Describes their routine tasks through a form or by speaking to the agent. They can add steps and sub‭steps, upload screenshots and submit processes for analysis.
- **Supervisor/Admin:** Reviews submitted processes, launches voice sessions for incomplete or inconsistent tasks, selects candidates with high automation scores, exports them to n8n and approves publication.
- **AI Agent (System):** Guides the employee to capture a process in a Standard Operating Procedure (SOP) format, analyses the process based on multiple criteria, triggers voice sessions to collect missing information and calculates an automation score.

## 3. Overall Workflow
1. **Process Creation:** An employee starts a new process and provides a name and short description. They then add steps and sub‭steps, optionally attaching screenshots.
2. **AI Analysis:** The agent evaluates the inputs using GPT‭4o‭mini and returns an automation score from 1 to 10 based on frequency, complexity, manual effort and other factors. If information is missing or inconsistent, a voice session is suggested.
3. **Voice Session:** Using the OpenAI Realtime API the agent asks targeted questions in natural language. Whisper transcribes the conversation and updates the process definition.
4. **Supervisor Review:** All analysed processes are listed in a dashboard by department and score. The supervisor can approve or reject, request additional details or create an n8n flow.
5. **n8n Flow Generation:** The system converts the SOP‑like process definition into a JSON workflow and posts it to n8n. The flow is created in draft mode.
6. **Testing & Publishing:** The draft flow is presented to the employee for testing. If the user confirms that it automates the task correctly, the supervisor activates the flow in production.
7. **Analytics:** The platform computes department‑level metrics such as average automation score, estimated time savings and ROI. Charts highlight high‑impact processes and adoption rates.

## 4. Voice Conversation Mode
- **Realtime Interaction:** A voice session is initiated when the AI detects missing or disconnected steps. The agent uses the OpenAI Realtime API to ask follow‑up questions and listen to the user’s answers.
- **Speech‑to‑Text:** Audio is transcribed by the Whisper‑1 model and the transcript is stored.
- **Transcript Storage:** Every voice session is saved so supervisors can audit conversations and verify that the process record is complete.

## 5. AI Analysis Criteria
The automation score is calculated from several weighted factors:
- **Frequency:** How often the task is performed.
- **Step Count (Complexity):** The number of steps and sub”steps.
- **Manual Effort:** Percentage of the process that requires human interaction.
- **Data Type:** Whether the data is digital or on paper.
- **Difficulty Level:** Low, medium or high complexity.
- **Risk:** Likelihood of human error or compliance issues.
- **Estimated Time Savings:** Proportion of time automation could save.
The final score (1‑10) classifies a process as fully automatable, partially automatable or manual.

## 6. Core Modules
| Module                | Description |
|----------------------|-------------|
| **Auth & Role Management** | JWT‑based login and registration with roles for employees, supervisors and admins. |
| **Process Management** | CRUD operations for processes, steps and sub”steps, including screenshot uploads and versioning. |
| **AI Analysis** | Calls GPT‑4o‑mini to generate SOP summaries, identify missing steps and compute automation scores. |
| **Voice Review** | Initiates real‑time voice sessions, captures answers via Whisper and updates the process definition accordingly. |
| **Supervisor Dashboard** | Displays processes by department sorted by score, with actions to approve, reject, request voice review or export to n8n. |
| **n8n Integration** | Generates JSON flows from approved processes and communicates with the n8n API to create, test and publish workflows. |
| **Styling & Embedding** | Allows the agent interface to be branded and embedded into internal dashboards or external sites with minimal code. |
| **Analytics** | Provides charts and reports on automation adoption, average scores and ROI by department. |

## 7. Technology Stack
- **Backend:** Node.js with NestJS.
- **Database:** PostgreSQL managed via Prisma ORM.
- **Frontend:** Next.js 14 and Tailwind CSS.
- **AI Services:** OpenAI GPT‑4o‑mini, Realtime API and Whisper‑1.
- **Automation:** n8n REST API.
- **Storage:** Supabase or AWS S3 for file uploads.
- **Authentication:** Auth.js or Clerk.
- **State Management:** Zustand for client‑side state.

## 8. Success Criteria
- At least 80 % of recorded processes achieve an automation score of 7 or higher.
- Converting a process to an n8n flow takes less than five minutes.
- More than 90 % of flows submitted for testing are approved by users without requiring rework.

## 9. Future Enhancements
- Internationalisation for multi‑language support.
- Pre‑defined agent templates for common domains (CRM, finance, HR, support).
- Integration with team chat platforms like Slack or Microsoft Teams.
- Behavioural analytics to understand how employees interact with the agent and which questions lead to better process definitions.
