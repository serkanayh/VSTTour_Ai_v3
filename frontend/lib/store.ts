import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export enum UserRole {
  USER = 'USER',
  DEVELOPER = 'DEVELOPER',
  MANAGER = 'MANAGER',
  ADMIN = 'ADMIN',
}

export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  department?: string;
  isActive: boolean;
}

interface AuthState {
  user: User | null;
  accessToken: string | null;
  isAuthenticated: boolean;
  setAuth: (user: User, token: string) => void;
  clearAuth: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      accessToken: null,
      isAuthenticated: false,
      setAuth: (user, token) =>
        set({
          user,
          accessToken: token,
          isAuthenticated: true,
        }),
      clearAuth: () =>
        set({
          user: null,
          accessToken: null,
          isAuthenticated: false,
        }),
    }),
    {
      name: 'auth-storage',
    }
  )
);

export enum ProcessStatus {
  DRAFT = 'DRAFT',
  PENDING_APPROVAL = 'PENDING_APPROVAL',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED',
  ARCHIVED = 'ARCHIVED',
}

export interface Process {
  id: string;
  name: string;
  description?: string;
  status: ProcessStatus;
  currentVersion: number;
  department?: string;
  estimatedTimeMinutes?: number;
  createdById: string;
  createdBy?: User;
  createdAt: string;
  updatedAt: string;
}

interface ProcessState {
  selectedProcess: Process | null;
  processes: Process[];
  setSelectedProcess: (process: Process | null) => void;
  setProcesses: (processes: Process[]) => void;
  addProcess: (process: Process) => void;
  updateProcess: (id: string, updates: Partial<Process>) => void;
  removeProcess: (id: string) => void;
}

export const useProcessStore = create<ProcessState>((set) => ({
  selectedProcess: null,
  processes: [],
  setSelectedProcess: (process) => set({ selectedProcess: process }),
  setProcesses: (processes) => set({ processes }),
  addProcess: (process) =>
    set((state) => ({ processes: [process, ...state.processes] })),
  updateProcess: (id, updates) =>
    set((state) => ({
      processes: state.processes.map((p) =>
        p.id === id ? { ...p, ...updates } : p
      ),
      selectedProcess:
        state.selectedProcess?.id === id
          ? { ...state.selectedProcess, ...updates }
          : state.selectedProcess,
    })),
  removeProcess: (id) =>
    set((state) => ({
      processes: state.processes.filter((p) => p.id !== id),
      selectedProcess:
        state.selectedProcess?.id === id ? null : state.selectedProcess,
    })),
}));

interface UIState {
  sidebarOpen: boolean;
  toggleSidebar: () => void;
  setSidebarOpen: (open: boolean) => void;
}

export const useUIStore = create<UIState>((set) => ({
  sidebarOpen: true,
  toggleSidebar: () => set((state) => ({ sidebarOpen: !state.sidebarOpen })),
  setSidebarOpen: (open) => set({ sidebarOpen: open }),
}));
