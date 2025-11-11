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

  async analyzeProcess(id: string) {
    const response = await this.client.post(`/process/${id}/analyze`);
    return response.data;
  }

  // Approval endpoints
  async getPendingApprovals() {
    const response = await this.client.get('/approval/pending');
    return response.data;
  }

  async approveProcess(processId: string, comment?: string) {
    const response = await this.client.post(`/approval/${processId}/approve`, { comment });
    return response.data;
  }

  async rejectProcess(processId: string, comment: string) {
    const response = await this.client.post(`/approval/${processId}/reject`, { comment });
    return response.data;
  }

  // Integration endpoints
  async exportToN8n(processId: string) {
    const response = await this.client.post(`/integration/export/${processId}`);
    return response.data;
  }

  async getExportHistory(processId?: string) {
    const response = await this.client.get('/integration/history', {
      params: processId ? { processId } : undefined,
    });
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
}

export const api = new ApiClient();
export default api;
