### Scenario 1 – Process Creation
1. Employee logs in to the system.  
2. Clicks **"Create New Process"** button.  
3. Enters the process name and selects the department.  
4. Adds a first step titled "Log into accounting software":  
   - **Sub-step 1:** Launch the accounting application.  
   - **Sub-step 2:** Enter username and password.  
   - Upload screenshot.  
5. Adds a second step titled "Generate report":  
   - **Sub-step 1:** Navigate to the report menu.  
   - **Sub-step 2:** Select the date filter as "yesterday".  
   - **Sub-step 3:** Download the report in CSV format.  
6. Clicks **Save** to submit the process draft.  

### Scenario 2 – AI Analysis & Voice Session
1. The system analyzes the submitted process and calculates an automation score.  
2. If missing details are detected (e.g., where the downloaded report is stored), the user receives a notification requesting a voice call.  
3. The user accepts, enabling the microphone.  
4. The AI assistant asks targeted questions about the missing details.  
5. The user's answers are transcribed using Whisper and appended as additional sub-steps.  
6. Once all required information is captured, the process status is updated to **Completed**.  

### Scenario 3 – Supervisor Approval & Automation
1. The supervisor views the list of processes in the dashboard, sorted by automation score.  
2. Chooses a high-scoring process and clicks **"Create Flow"**.  
3. The system generates an automation flow definition (JSON) and submits it via the n8n API.  
4. A test version of the flow is sent to the original process owner for verification.  
5. The employee tests the automation and confirms that it works as expected.  
6. The supervisor publishes the flow; the process transitions to the **Active** state and appears in the analytics dashboard.
