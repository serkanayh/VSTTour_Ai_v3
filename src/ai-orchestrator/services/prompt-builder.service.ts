import { Injectable } from '@nestjs/common';

@Injectable()
export class PromptBuilderService {
  buildInitialPrompt(formData: any): string {
    return `Hi! I'm here to help document your business process: "${formData.processName}".

To create an effective automation plan, I'll need to understand:
- The exact steps you follow
- How often you perform this task
- How long each step typically takes
- Any pain points or repetitive actions

Let's start: Can you describe the first step of "${formData.processName}" in your own words?`;
  }

  buildConversationMessages(
    systemPrompt: string,
    conversationHistory: any[],
    newMessage: string,
  ): any[] {
    const messages = [{ role: 'system', content: systemPrompt }];

    // Add conversation history
    if (conversationHistory && conversationHistory.length > 0) {
      conversationHistory.forEach((msg) => {
        messages.push({
          role: msg.role,
          content: msg.content,
        });
      });
    }

    // Add new user message
    messages.push({
      role: 'user',
      content: newMessage,
    });

    return messages;
  }

  buildSOPGenerationPrompt(process: any, formData: any): string {
    return `Generate a detailed Standard Operating Procedure (SOP) for the following process:

Process Name: ${process.processName}
Description: ${process.description || 'N/A'}
Frequency: ${process.frequency || 'N/A'} times per day
Duration: ${process.duration || 'N/A'} minutes per task
Cost per Hour: ${process.costPerHour || 'N/A'} TRY

Form Data:
${JSON.stringify(formData, null, 2)}

Please generate a structured SOP in the following JSON format:

\`\`\`json
{
  "title": "Process Title",
  "summary": "Brief summary of the process",
  "steps": [
    {
      "order": 1,
      "action": "Description of the action",
      "estimatedTime": 60,
      "tools": ["Tool 1", "Tool 2"],
      "notes": "Any important notes"
    }
  ],
  "totalEstimatedTime": 300,
  "automationPotential": {
    "score": 8,
    "reasoning": "Why this can be automated",
    "suggestedTools": ["n8n", "Zapier"]
  },
  "riskAssessment": {
    "hasPersonalData": true,
    "kvkkCompliance": "Required steps for KVKK compliance",
    "criticalSteps": [1, 3]
  }
}
\`\`\`

Make sure the output is valid JSON and includes all necessary details for automation planning.`;
  }
}
