import axios, { AxiosInstance, AxiosError } from 'axios';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api/v1';

class ApiClient {
  private client: AxiosInstance;

  constructor() {
    this.client = axios.create({
      baseURL: API_BASE_URL,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // Request interceptor to add auth token
    this.client.interceptors.request.use(
      (config) => {
        const token = this.getToken();
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
      },
      (error) => Promise.reject(error)
    );

    // Response interceptor for error handling
    this.client.interceptors.response.use(
      (response) => response,
      (error: AxiosError) => {
        if (error.response?.status === 401) {
          this.clearToken();
          if (typeof window !== 'undefined') {
            window.location.href = '/login';
          }
        }
        return Promise.reject(error);
      }
    );
  }

  private getToken(): string | null {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('accessToken');
    }
    return null;
  }

  private clearToken(): void {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('accessToken');
      localStorage.removeItem('user');
    }
  }

  // Auth endpoints
  async login(email: string, password: string) {
    const response = await this.client.post('/auth/login', { email, password });
    if (response.data.accessToken) {
      localStorage.setItem('accessToken', response.data.accessToken);
      localStorage.setItem('user', JSON.stringify(response.data.user));
    }
    return response.data;
  }

  async register(data: { email: string; password: string; name: string; department?: string }) {
    const response = await this.client.post('/auth/register', data);
    return response.data;
  }

  async logout() {
    try {
      await this.client.post('/auth/logout');
    } finally {
      this.clearToken();
    }
  }

  async getProfile() {
    const response = await this.client.get('/auth/profile');
    return response.data;
  }

  // Process endpoints
  async getProcesses(params?: { status?: string; search?: string; page?: number; limit?: number }) {
    const response = await this.client.get('/process', { params });
    return response.data;
  }

  async getProcess(id: string) {
    const response = await this.client.get(`/process/${id}`);
    return response.data;
  }

  async createProcess(data: any) {
    const response = await this.client.post('/process', data);
    return response.data;
  }

  async updateProcess(id: string, data: any) {
    const response = await this.client.patch(`/process/${id}`, data);
    return response.data;
  }

  async deleteProcess(id: string) {
    const response = await this.client.delete(`/process/${id}`);
    return response.data;
  }

  async calculateROI(id: string) {
    const response = await this.client.get(`/process/${id}/roi`);
    return response.data;
  }

  // Approval endpoints
  async getPendingApprovals() {
    const response = await this.client.get('/approval/pending');
    return response.data;
  }

  async approveProcess(approvalId: string, comment?: string) {
    const response = await this.client.post(`/approval/approve/${approvalId}`, { comment });
    return response.data;
  }

  async rejectProcess(approvalId: string, comment: string) {
    const response = await this.client.post(`/approval/reject/${approvalId}`, { comment });
    return response.data;
  }

  // Integration endpoints
  async exportToN8n(processId: string) {
    const response = await this.client.post(`/integration/export/${processId}/n8n`);
    return response.data;
  }

  async getExportHistory(processId: string) {
    const response = await this.client.get(`/integration/exports/${processId}`);
    return response.data;
  }

  // Admin endpoints
  async getAIConfigurations() {
    const response = await this.client.get('/admin/ai-config');
    return response.data;
  }

  async createAIConfiguration(data: any) {
    const response = await this.client.post('/admin/ai-config', data);
    return response.data;
  }

  async updateAIConfiguration(id: string, data: any) {
    const response = await this.client.patch(`/admin/ai-config/${id}`, data);
    return response.data;
  }

  async getAuditLogs(params?: { entityType?: string; entityId?: string; page?: number; limit?: number }) {
    const response = await this.client.get('/admin/audit-logs', { params });
    return response.data;
  }

  // Process Steps endpoints
  async getProcessSteps(processId: string) {
    const response = await this.client.get(`/process/${processId}/steps`);
    return response.data;
  }

  async addProcessStep(processId: string, stepData: { title: string; description: string; estimatedMinutes?: number }) {
    const response = await this.client.post(`/process/${processId}/steps`, stepData);
    return response.data;
  }

  async updateProcessStep(processId: string, stepId: string, stepData: { title?: string; description?: string; estimatedMinutes?: number }) {
    const response = await this.client.patch(`/process/${processId}/steps/${stepId}`, stepData);
    return response.data;
  }

  async deleteProcessStep(processId: string, stepId: string) {
    const response = await this.client.delete(`/process/${processId}/steps/${stepId}`);
    return response.data;
  }

  async reorderProcessSteps(processId: string, stepIds: string[]) {
    const response = await this.client.post(`/process/${processId}/steps/reorder`, { stepIds });
    return response.data;
  }

  // Sub-Steps endpoints
  async addSubStep(processId: string, stepId: string, subStepData: { title: string; description: string; estimatedMinutes?: number }) {
    const response = await this.client.post(`/process/${processId}/steps/${stepId}/substeps`, subStepData);
    return response.data;
  }

  async updateSubStep(processId: string, stepId: string, subStepId: string, subStepData: { title?: string; description?: string; estimatedMinutes?: number }) {
    const response = await this.client.patch(`/process/${processId}/steps/${stepId}/substeps/${subStepId}`, subStepData);
    return response.data;
  }

  async deleteSubStep(processId: string, stepId: string, subStepId: string) {
    const response = await this.client.delete(`/process/${processId}/steps/${stepId}/substeps/${subStepId}`);
    return response.data;
  }

  // AI Analysis endpoints
  async analyzeProcess(processId: string) {
    const response = await this.client.post(`/process/${processId}/analyze`);
    return response.data;
  }

  async applySuggestion(processId: string, stepNumber: number, suggestion: string) {
    const response = await this.client.post(`/process/${processId}/apply-suggestion`, {
      stepNumber,
      suggestion,
    });
    return response.data;
  }

  async generateSOP(processId: string) {
    const response = await this.client.post(`/process/${processId}/generate-sop`);
    return response.data;
  }

  // Conversation endpoints
  async sendMessage(processId: string, message: string) {
    const response = await this.client.post(`/process/${processId}/conversation/message`, { message });
    return response.data;
  }

  async getConversationHistory(processId: string) {
    const response = await this.client.get(`/process/${processId}/conversation/history`);
    return response.data;
  }

  async clearConversation(processId: string) {
    const response = await this.client.delete(`/process/${processId}/conversation`);
    return response.data;
  }
}

export const api = new ApiClient();
export default api;
