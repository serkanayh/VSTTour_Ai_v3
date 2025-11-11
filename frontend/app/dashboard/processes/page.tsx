'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  FileText,
  Plus,
  Search,
  Filter,
  Clock,
  CheckCircle,
  XCircle,
  Archive,
} from 'lucide-react';
import { api } from '@/lib/api';
import { useProcessStore, ProcessStatus } from '@/lib/store';

export default function ProcessesPage() {
  const router = useRouter();
  const { processes, setProcesses } = useProcessStore();
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');

  useEffect(() => {
    loadProcesses();
  }, []);

  const loadProcesses = async () => {
    try {
      setIsLoading(true);
      const data = await api.getProcesses();
      setProcesses(data);
    } catch (error) {
      console.error('Failed to load processes:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const filteredProcesses = processes.filter((process) => {
    const matchesSearch =
      process.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      process.description?.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus =
      statusFilter === 'ALL' || process.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  const getStatusIcon = (status: ProcessStatus) => {
    switch (status) {
      case ProcessStatus.APPROVED:
        return <CheckCircle className="h-4 w-4" />;
      case ProcessStatus.PENDING_APPROVAL:
        return <Clock className="h-4 w-4" />;
      case ProcessStatus.REJECTED:
        return <XCircle className="h-4 w-4" />;
      case ProcessStatus.ARCHIVED:
        return <Archive className="h-4 w-4" />;
      default:
        return <FileText className="h-4 w-4" />;
    }
  };

  const getStatusColor = (status: ProcessStatus) => {
    switch (status) {
      case ProcessStatus.APPROVED:
        return 'bg-green-100 text-green-800';
      case ProcessStatus.PENDING_APPROVAL:
        return 'bg-yellow-100 text-yellow-800';
      case ProcessStatus.REJECTED:
        return 'bg-red-100 text-red-800';
      case ProcessStatus.ARCHIVED:
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-blue-100 text-blue-800';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Processes</h1>
          <p className="text-gray-600 mt-1">
            Manage and track all your business processes
          </p>
        </div>
        <Link href="/dashboard/processes/new" className="btn-primary flex items-center">
          <Plus className="h-5 w-5 mr-2" />
          New Process
        </Link>
      </div>

      {/* Filters */}
      <div className="card">
        <div className="flex flex-col sm:flex-row gap-4">
          {/* Search */}
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search processes..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="input pl-10"
              />
            </div>
          </div>

          {/* Status Filter */}
          <div className="sm:w-48">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="input"
            >
              <option value="ALL">All Status</option>
              <option value="DRAFT">Draft</option>
              <option value="PENDING_APPROVAL">Pending</option>
              <option value="APPROVED">Approved</option>
              <option value="REJECTED">Rejected</option>
              <option value="ARCHIVED">Archived</option>
            </select>
          </div>
        </div>
      </div>

      {/* Process List */}
      {isLoading ? (
        <div className="card text-center py-12">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
          <p className="mt-4 text-gray-600">Loading processes...</p>
        </div>
      ) : filteredProcesses.length === 0 ? (
        <div className="card text-center py-12">
          <FileText className="h-16 w-16 mx-auto text-gray-400 mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            {searchTerm || statusFilter !== 'ALL'
              ? 'No processes found'
              : 'No processes yet'}
          </h3>
          <p className="text-gray-600 mb-6">
            {searchTerm || statusFilter !== 'ALL'
              ? 'Try adjusting your filters'
              : 'Get started by creating your first process'}
          </p>
          {!searchTerm && statusFilter === 'ALL' && (
            <Link href="/dashboard/processes/new" className="btn-primary inline-flex items-center">
              <Plus className="h-5 w-5 mr-2" />
              Create Process
            </Link>
          )}
        </div>
      ) : (
        <div className="grid gap-4">
          {filteredProcesses.map((process) => (
            <Link
              key={process.id}
              href={`/dashboard/processes/${process.id}`}
              className="card hover:shadow-lg transition-shadow cursor-pointer"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="text-lg font-semibold text-gray-900 truncate">
                      {process.name}
                    </h3>
                    <span
                      className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(
                        process.status
                      )}`}
                    >
                      {getStatusIcon(process.status)}
                      {process.status.replace('_', ' ')}
                    </span>
                  </div>

                  {process.description && (
                    <p className="text-gray-600 text-sm mb-3 line-clamp-2">
                      {process.description}
                    </p>
                  )}

                  <div className="flex flex-wrap items-center gap-4 text-sm text-gray-500">
                    {process.department && (
                      <span className="flex items-center">
                        <span className="font-medium">Department:</span>
                        <span className="ml-1">{process.department}</span>
                      </span>
                    )}
                    <span className="flex items-center">
                      <span className="font-medium">Version:</span>
                      <span className="ml-1">{process.currentVersion}</span>
                    </span>
                    {process.estimatedTimeMinutes && (
                      <span className="flex items-center">
                        <Clock className="h-4 w-4 mr-1" />
                        {process.estimatedTimeMinutes} min
                      </span>
                    )}
                    <span className="flex items-center">
                      <span className="font-medium">Created:</span>
                      <span className="ml-1">
                        {new Date(process.createdAt).toLocaleDateString()}
                      </span>
                    </span>
                  </div>
                </div>

                <div className="ml-4 flex-shrink-0">
                  <div className="text-primary-600 hover:text-primary-700">
                    <svg
                      className="h-5 w-5"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9 5l7 7-7 7"
                      />
                    </svg>
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}

      {/* Summary Stats */}
      {!isLoading && processes.length > 0 && (
        <div className="card bg-gray-50">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
            <div>
              <p className="text-2xl font-bold text-gray-900">{processes.length}</p>
              <p className="text-sm text-gray-600">Total</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-green-600">
                {processes.filter((p) => p.status === ProcessStatus.APPROVED).length}
              </p>
              <p className="text-sm text-gray-600">Approved</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-yellow-600">
                {
                  processes.filter((p) => p.status === ProcessStatus.PENDING_APPROVAL)
                    .length
                }
              </p>
              <p className="text-sm text-gray-600">Pending</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-blue-600">
                {processes.filter((p) => p.status === ProcessStatus.DRAFT).length}
              </p>
              <p className="text-sm text-gray-600">Drafts</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
