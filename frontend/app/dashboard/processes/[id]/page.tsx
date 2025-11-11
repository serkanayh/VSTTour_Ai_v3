'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowLeft,
  Edit,
  Trash2,
  Send,
  Download,
  Bot,
  BarChart3,
  Clock,
  Calendar,
  User,
  Building,
  CheckCircle,
  XCircle,
  AlertCircle,
} from 'lucide-react';
import { api } from '@/lib/api';
import { useAuthStore, ProcessStatus, UserRole } from '@/lib/store';

interface ProcessDetail {
  id: string;
  name: string;
  description?: string;
  status: ProcessStatus;
  currentVersion: number;
  department?: string;
  estimatedTimeMinutes?: number;
  createdBy?: any;
  createdAt: string;
  updatedAt: string;
}

interface ROIData {
  dailyCost: number;
  monthlyCost: number;
  yearlyCost: number;
  potentialMonthlySavings: number;
  potentialYearlySavings: number;
  roi: number;
  paybackPeriod: number;
}

export default function ProcessDetailPage() {
  const router = useRouter();
  const params = useParams();
  const { user } = useAuthStore();
  const [process, setProcess] = useState<ProcessDetail | null>(null);
  const [roi, setRoi] = useState<ROIData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  useEffect(() => {
    if (params.id) {
      loadProcess();
    }
  }, [params.id]);

  const loadProcess = async () => {
    try {
      setIsLoading(true);
      const data = await api.getProcess(params.id as string);
      setProcess(data);

      // Load ROI if process has estimation data
      if (data.estimatedTimeMinutes) {
        const roiData = await api.calculateROI(params.id as string);
        setRoi(roiData);
      }
    } catch (error) {
      console.error('Failed to load process:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async () => {
    try {
      setActionLoading('delete');
      await api.deleteProcess(params.id as string);
      router.push('/dashboard/processes');
    } catch (error) {
      console.error('Failed to delete process:', error);
      alert('Failed to delete process');
    } finally {
      setActionLoading(null);
      setShowDeleteConfirm(false);
    }
  };

  const handleSubmitForApproval = async () => {
    try {
      setActionLoading('submit');
      await api.updateProcess(params.id as string, {
        status: ProcessStatus.PENDING_APPROVAL,
      });
      await loadProcess();
    } catch (error) {
      console.error('Failed to submit for approval:', error);
      alert('Failed to submit for approval');
    } finally {
      setActionLoading(null);
    }
  };

  const handleAnalyze = async () => {
    try {
      setActionLoading('analyze');
      await api.analyzeProcess(params.id as string);
      alert('AI analysis started. This may take a few moments.');
      await loadProcess();
    } catch (error) {
      console.error('Failed to analyze process:', error);
      alert('Failed to start AI analysis');
    } finally {
      setActionLoading(null);
    }
  };

  const handleExport = async () => {
    try {
      setActionLoading('export');
      await api.exportToN8n(params.id as string);
      alert('Process exported to n8n successfully!');
    } catch (error: any) {
      console.error('Failed to export:', error);
      alert(error.response?.data?.message || 'Failed to export to n8n');
    } finally {
      setActionLoading(null);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  if (!process) {
    return (
      <div className="text-center py-12">
        <AlertCircle className="h-16 w-16 mx-auto text-gray-400 mb-4" />
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Process Not Found</h2>
        <Link href="/dashboard/processes" className="text-primary-600 hover:text-primary-700">
          ← Back to Processes
        </Link>
      </div>
    );
  }

  const canEdit = user?.id === process.createdBy?.id || user?.role === UserRole.ADMIN;
  const canSubmit = process.status === ProcessStatus.DRAFT && canEdit;
  const canExport = process.status === ProcessStatus.APPROVED &&
    (user?.role === UserRole.DEVELOPER || user?.role === UserRole.ADMIN);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link
            href="/dashboard/processes"
            className="text-gray-600 hover:text-gray-900"
          >
            <ArrowLeft className="h-6 w-6" />
          </Link>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">{process.name}</h1>
            <p className="text-gray-600 mt-1">Version {process.currentVersion}</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {canEdit && (
            <>
              <Link
                href={`/dashboard/processes/${process.id}/edit`}
                className="btn-secondary flex items-center"
              >
                <Edit className="h-4 w-4 mr-2" />
                Edit
              </Link>
              <button
                onClick={() => setShowDeleteConfirm(true)}
                className="bg-red-100 text-red-700 hover:bg-red-200 font-medium py-2 px-4 rounded-lg transition-colors flex items-center"
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Delete
              </button>
            </>
          )}
        </div>
      </div>

      {/* Status Badge */}
      <div>
        <span
          className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium ${
            process.status === ProcessStatus.APPROVED
              ? 'bg-green-100 text-green-800'
              : process.status === ProcessStatus.PENDING_APPROVAL
              ? 'bg-yellow-100 text-yellow-800'
              : process.status === ProcessStatus.REJECTED
              ? 'bg-red-100 text-red-800'
              : 'bg-blue-100 text-blue-800'
          }`}
        >
          {process.status === ProcessStatus.APPROVED && <CheckCircle className="h-4 w-4" />}
          {process.status === ProcessStatus.REJECTED && <XCircle className="h-4 w-4" />}
          {process.status.replace('_', ' ')}
        </span>
      </div>

      {/* Main Content Grid */}
      <div className="grid lg:grid-cols-3 gap-6">
        {/* Left Column - Details */}
        <div className="lg:col-span-2 space-y-6">
          {/* Description */}
          <div className="card">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Description</h2>
            <p className="text-gray-700 whitespace-pre-wrap">
              {process.description || 'No description provided'}
            </p>
          </div>

          {/* ROI Metrics */}
          {roi && (
            <div className="card">
              <div className="flex items-center gap-2 mb-4">
                <BarChart3 className="h-6 w-6 text-primary-600" />
                <h2 className="text-xl font-semibold text-gray-900">ROI Analysis</h2>
              </div>
              <div className="grid md:grid-cols-2 gap-4">
                <div className="bg-blue-50 p-4 rounded-lg">
                  <p className="text-sm text-gray-600">Monthly Cost</p>
                  <p className="text-2xl font-bold text-blue-600">
                    ${roi.monthlyCost.toFixed(2)}
                  </p>
                </div>
                <div className="bg-green-50 p-4 rounded-lg">
                  <p className="text-sm text-gray-600">Potential Monthly Savings</p>
                  <p className="text-2xl font-bold text-green-600">
                    ${roi.potentialMonthlySavings.toFixed(2)}
                  </p>
                </div>
                <div className="bg-purple-50 p-4 rounded-lg">
                  <p className="text-sm text-gray-600">ROI Percentage</p>
                  <p className="text-2xl font-bold text-purple-600">
                    {roi.roi.toFixed(1)}%
                  </p>
                </div>
                <div className="bg-orange-50 p-4 rounded-lg">
                  <p className="text-sm text-gray-600">Payback Period</p>
                  <p className="text-2xl font-bold text-orange-600">
                    {roi.paybackPeriod.toFixed(1)} months
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="card">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Actions</h2>
            <div className="flex flex-wrap gap-3">
              {canSubmit && (
                <button
                  onClick={handleSubmitForApproval}
                  disabled={actionLoading === 'submit'}
                  className="btn-primary flex items-center disabled:opacity-50"
                >
                  <Send className="h-4 w-4 mr-2" />
                  {actionLoading === 'submit' ? 'Submitting...' : 'Submit for Approval'}
                </button>
              )}

              <button
                onClick={handleAnalyze}
                disabled={actionLoading === 'analyze'}
                className="bg-purple-600 hover:bg-purple-700 text-white font-medium py-2 px-4 rounded-lg transition-colors flex items-center disabled:opacity-50"
              >
                <Bot className="h-4 w-4 mr-2" />
                {actionLoading === 'analyze' ? 'Analyzing...' : 'AI Analysis'}
              </button>

              {canExport && (
                <button
                  onClick={handleExport}
                  disabled={actionLoading === 'export'}
                  className="bg-green-600 hover:bg-green-700 text-white font-medium py-2 px-4 rounded-lg transition-colors flex items-center disabled:opacity-50"
                >
                  <Download className="h-4 w-4 mr-2" />
                  {actionLoading === 'export' ? 'Exporting...' : 'Export to n8n'}
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Right Column - Metadata */}
        <div className="space-y-6">
          <div className="card">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Details</h2>
            <div className="space-y-4">
              {process.department && (
                <div className="flex items-start gap-3">
                  <Building className="h-5 w-5 text-gray-400 mt-0.5" />
                  <div>
                    <p className="text-sm text-gray-600">Department</p>
                    <p className="font-medium text-gray-900">{process.department}</p>
                  </div>
                </div>
              )}

              {process.estimatedTimeMinutes && (
                <div className="flex items-start gap-3">
                  <Clock className="h-5 w-5 text-gray-400 mt-0.5" />
                  <div>
                    <p className="text-sm text-gray-600">Estimated Time</p>
                    <p className="font-medium text-gray-900">
                      {process.estimatedTimeMinutes} minutes
                    </p>
                  </div>
                </div>
              )}

              {process.createdBy && (
                <div className="flex items-start gap-3">
                  <User className="h-5 w-5 text-gray-400 mt-0.5" />
                  <div>
                    <p className="text-sm text-gray-600">Created By</p>
                    <p className="font-medium text-gray-900">
                      {process.createdBy.firstName} {process.createdBy.lastName}
                    </p>
                  </div>
                </div>
              )}

              <div className="flex items-start gap-3">
                <Calendar className="h-5 w-5 text-gray-400 mt-0.5" />
                <div>
                  <p className="text-sm text-gray-600">Created</p>
                  <p className="font-medium text-gray-900">
                    {new Date(process.createdAt).toLocaleDateString()}
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <Calendar className="h-5 w-5 text-gray-400 mt-0.5" />
                <div>
                  <p className="text-sm text-gray-600">Last Updated</p>
                  <p className="font-medium text-gray-900">
                    {new Date(process.updatedAt).toLocaleDateString()}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-75 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Delete Process</h3>
            <p className="text-gray-600 mb-6">
              Are you sure you want to delete this process? This action cannot be undone.
            </p>
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="btn-secondary"
                disabled={actionLoading === 'delete'}
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                disabled={actionLoading === 'delete'}
                className="bg-red-600 hover:bg-red-700 text-white font-medium py-2 px-4 rounded-lg transition-colors disabled:opacity-50"
              >
                {actionLoading === 'delete' ? 'Deleting...' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
