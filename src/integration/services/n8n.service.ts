import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class N8nService {
  constructor(private configService: ConfigService) {}

  convertSOPToN8n(process: any, sopJson: any): any {
    // Convert SOP JSON to n8n workflow format
    const nodes = [];
    const connections: any = {};

    // Start node
    nodes.push({
      id: 'start',
      name: 'Start',
      type: 'n8n-nodes-base.start',
      typeVersion: 1,
      position: [250, 300],
      parameters: {},
    });

    // Convert each SOP step to n8n node
    if (sopJson.steps && Array.isArray(sopJson.steps)) {
      sopJson.steps.forEach((step: any, index: number) => {
        const nodeId = `step_${index + 1}`;
        const prevNodeId = index === 0 ? 'start' : `step_${index}`;

        // Create node based on step action
        const node = {
          id: nodeId,
          name: `${step.order}. ${step.action}`,
          type: this.determineNodeType(step),
          typeVersion: 1,
          position: [250 + (index + 1) * 200, 300],
          parameters: {
            operation: step.action,
            description: step.notes || '',
            estimatedTime: step.estimatedTime || 0,
          },
        };

        nodes.push(node);

        // Create connection from previous node
        if (!connections[prevNodeId]) {
          connections[prevNodeId] = { main: [[]] };
        }
        connections[prevNodeId].main[0].push({
          node: nodeId,
          type: 'main',
          index: 0,
        });
      });
    }

    // End node
    const lastStepId = sopJson.steps?.length > 0 ? `step_${sopJson.steps.length}` : 'start';
    nodes.push({
      id: 'end',
      name: 'End',
      type: 'n8n-nodes-base.noOp',
      typeVersion: 1,
      position: [250 + (sopJson.steps?.length + 1 || 1) * 200, 300],
      parameters: {},
    });

    if (!connections[lastStepId]) {
      connections[lastStepId] = { main: [[]] };
    }
    connections[lastStepId].main[0].push({
      node: 'end',
      type: 'main',
      index: 0,
    });

    return {
      name: process.processName,
      nodes: nodes,
      connections: connections,
      active: false,
      settings: {
        saveExecutionProgress: true,
        saveManualExecutions: true,
      },
      tags: [
        {
          name: 'VSTTour AI',
        },
        {
          name: process.department?.name || 'General',
        },
      ],
      meta: {
        processId: process.id,
        automationScore: process.automationScore,
        exportedAt: new Date().toISOString(),
        exportedBy: 'VSTTour AI Platform',
      },
    };
  }

  private determineNodeType(step: any): string {
    // Map step actions to n8n node types
    const action = step.action.toLowerCase();

    if (action.includes('email') || action.includes('mail')) {
      return 'n8n-nodes-base.emailSend';
    } else if (action.includes('http') || action.includes('api') || action.includes('request')) {
      return 'n8n-nodes-base.httpRequest';
    } else if (action.includes('database') || action.includes('sql')) {
      return 'n8n-nodes-base.postgres';
    } else if (action.includes('file') || action.includes('upload')) {
      return 'n8n-nodes-base.readWriteFile';
    } else if (action.includes('wait') || action.includes('delay')) {
      return 'n8n-nodes-base.wait';
    } else if (action.includes('condition') || action.includes('if')) {
      return 'n8n-nodes-base.if';
    } else {
      // Default to function node for custom operations
      return 'n8n-nodes-base.function';
    }
  }

  validateN8nWorkflow(workflow: any): boolean {
    // Basic validation
    if (!workflow.name || !workflow.nodes || !workflow.connections) {
      return false;
    }

    // Check if workflow has at least one node
    if (!Array.isArray(workflow.nodes) || workflow.nodes.length === 0) {
      return false;
    }

    // Check if all nodes have required properties
    for (const node of workflow.nodes) {
      if (!node.id || !node.name || !node.type) {
        return false;
      }
    }

    return true;
  }

  async uploadToN8nInstance(workflow: any): Promise<any> {
    // This would upload the workflow to an actual n8n instance
    // Requires n8n API endpoint and credentials
    const n8nUrl = this.configService.get<string>('N8N_WEBHOOK_URL');
    const n8nApiKey = this.configService.get<string>('N8N_API_KEY');

    if (!n8nUrl || !n8nApiKey) {
      throw new Error('n8n configuration not set');
    }

    // TODO: Implement actual n8n API integration
    // const response = await axios.post(`${n8nUrl}/api/v1/workflows`, workflow, {
    //   headers: {
    //     'X-N8N-API-KEY': n8nApiKey,
    //   },
    // });

    return {
      message: 'Workflow upload not implemented yet',
      workflow,
    };
  }
}
