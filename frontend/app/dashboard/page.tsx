'use client';

import { useEffect, useState } from 'react';
import { useAuthStore } from '@/lib/store';
import { api } from '@/lib/api';
import {
  FileText,
  CheckSquare,
  Clock,
  TrendingUp,
  Activity,
  Users,
  BarChart3,
} from 'lucide-react';
import Link from 'next/link';

interface DashboardStats {
  totalProcesses: number;
  pendingApprovals: number;
  approvedProcesses: number;
  drafts: number;
  recentActivity: any[];
}

export default function DashboardPage() {
  const { user } = useAuthStore();
  const [stats, setStats] = useState<DashboardStats>({
    totalProcesses: 0,
    pendingApprovals: 0,
    approvedProcesses: 0,
    drafts: 0,
    recentActivity: [],
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setIsLoading(true);

      // Fetch processes
      const processes = await api.getProcesses();

      // Calculate stats
      const totalProcesses = processes.length;
      const pendingApprovals = processes.filter((p: any) => p.status === 'PENDING_APPROVAL').length;
      const approvedProcesses = processes.filter((p: any) => p.status === 'APPROVED').length;
      const drafts = processes.filter((p: any) => p.status === 'DRAFT').length;

      setStats({
        totalProcesses,
        pendingApprovals,
        approvedProcesses,
        drafts,
        recentActivity: processes.slice(0, 5),
      });
    } catch (error) {
      console.error('Failed to load dashboard data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const statCards = [
    {
      name: 'Total Processes',
      value: stats.totalProcesses,
      icon: FileText,
      color: 'bg-blue-500',
      bgColor: 'bg-blue-50',
      textColor: 'text-blue-600',
    },
    {
      name: 'Pending Approvals',
      value: stats.pendingApprovals,
      icon: Clock,
      color: 'bg-yellow-500',
      bgColor: 'bg-yellow-50',
      textColor: 'text-yellow-600',
    },
    {
      name: 'Approved',
      value: stats.approvedProcesses,
      icon: CheckSquare,
      color: 'bg-green-500',
      bgColor: 'bg-green-50',
      textColor: 'text-green-600',
    },
    {
      name: 'Drafts',
      value: stats.drafts,
      icon: FileText,
      color: 'bg-gray-500',
      bgColor: 'bg-gray-50',
      textColor: 'text-gray-600',
    },
  ];

  return (
    <div className="space-y-8">
      {/* Welcome Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">
          Welcome back, {user?.name.split(' ')[0]}!
        </h1>
        <p className="text-gray-600 mt-2">
          Here's what's happening with your processes today.
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statCards.map((stat) => (
          <div key={stat.name} className="card hover:shadow-lg transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">{stat.name}</p>
                <p className="text-3xl font-bold text-gray-900 mt-2">
                  {isLoading ? '...' : stat.value}
                </p>
              </div>
              <div className={`${stat.bgColor} p-3 rounded-lg`}>
                <stat.icon className={`h-6 w-6 ${stat.textColor}`} />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Quick Actions */}
      <div className="card">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Quick Actions</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Link
            href="/dashboard/processes/new"
            className="flex items-center p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-primary-500 hover:bg-primary-50 transition-colors group"
          >
            <div className="bg-primary-100 p-2 rounded-lg group-hover:bg-primary-200">
              <FileText className="h-5 w-5 text-primary-600" />
            </div>
            <span className="ml-3 font-medium text-gray-700 group-hover:text-primary-700">
              Create New Process
            </span>
          </Link>

          {(user?.role === 'MANAGER' || user?.role === 'ADMIN') && (
            <Link
              href="/dashboard/approvals"
              className="flex items-center p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-primary-500 hover:bg-primary-50 transition-colors group"
            >
              <div className="bg-yellow-100 p-2 rounded-lg group-hover:bg-yellow-200">
                <CheckSquare className="h-5 w-5 text-yellow-600" />
              </div>
              <span className="ml-3 font-medium text-gray-700 group-hover:text-primary-700">
                Review Approvals
              </span>
            </Link>
          )}

          {(user?.role === 'MANAGER' || user?.role === 'ADMIN') && (
            <Link
              href="/dashboard/roi"
              className="flex items-center p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-primary-500 hover:bg-primary-50 transition-colors group"
            >
              <div className="bg-green-100 p-2 rounded-lg group-hover:bg-green-200">
                <BarChart3 className="h-5 w-5 text-green-600" />
              </div>
              <span className="ml-3 font-medium text-gray-700 group-hover:text-primary-700">
                View ROI Dashboard
              </span>
            </Link>
          )}
        </div>
      </div>

      {/* Recent Activity */}
      <div className="card">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-gray-900">Recent Processes</h2>
          <Link
            href="/dashboard/processes"
            className="text-sm text-primary-600 hover:text-primary-700 font-medium"
          >
            View all →
          </Link>
        </div>

        {isLoading ? (
          <div className="text-center py-8 text-gray-500">Loading...</div>
        ) : stats.recentActivity.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <FileText className="h-12 w-12 mx-auto mb-3 text-gray-400" />
            <p>No processes yet. Create your first one!</p>
          </div>
        ) : (
          <div className="space-y-3">
            {stats.recentActivity.map((process: any) => (
              <Link
                key={process.id}
                href={`/dashboard/processes/${process.id}`}
                className="block p-4 border border-gray-200 rounded-lg hover:border-primary-300 hover:bg-primary-50 transition-colors"
              >
                <div className="flex items-center justify-between">
                  <div className="flex-1 min-w-0">
                    <h3 className="font-medium text-gray-900 truncate">
                      {process.name}
                    </h3>
                    {process.description && (
                      <p className="text-sm text-gray-600 truncate mt-1">
                        {process.description}
                      </p>
                    )}
                  </div>
                  <div className="ml-4 flex-shrink-0">
                    <span
                      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        process.status === 'APPROVED'
                          ? 'bg-green-100 text-green-800'
                          : process.status === 'PENDING_APPROVAL'
                          ? 'bg-yellow-100 text-yellow-800'
                          : process.status === 'REJECTED'
                          ? 'bg-red-100 text-red-800'
                          : 'bg-gray-100 text-gray-800'
                      }`}
                    >
                      {process.status.replace('_', ' ')}
                    </span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>

      {/* Help Section */}
      <div className="bg-gradient-to-r from-primary-500 to-primary-600 rounded-xl p-6 text-white">
        <div className="flex items-start justify-between">
          <div>
            <h3 className="text-xl font-semibold mb-2">Need Help Getting Started?</h3>
            <p className="text-primary-100 mb-4">
              Check out our documentation and guides to make the most of VSTTour AI.
            </p>
            <button className="bg-white text-primary-600 hover:bg-primary-50 font-medium py-2 px-4 rounded-lg transition-colors">
              View Documentation
            </button>
          </div>
          <Activity className="h-16 w-16 text-primary-200" />
        </div>
      </div>
    </div>
  );
}
