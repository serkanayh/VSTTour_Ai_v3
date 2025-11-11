'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { CheckCircle, XCircle, Clock, FileText, User, Calendar } from 'lucide-react';
import { api } from '@/lib/api';

interface Approval {
  id: string;
  processId: string;
  process: {
    id: string;
    name: string;
    description?: string;
    department?: string;
    createdBy?: {
      name: string;
      email: string;
    };
  };
  version: number;
  status: string;
  comment?: string;
  createdAt: string;
}

export default function ApprovalsPage() {
  const [approvals, setApprovals] = useState<Approval[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [selectedApproval, setSelectedApproval] = useState<Approval | null>(null);
  const [comment, setComment] = useState('');

  useEffect(() => {
    loadApprovals();
  }, []);

  const loadApprovals = async () => {
    try {
      setIsLoading(true);
      const data = await api.getPendingApprovals();
      setApprovals(data);
    } catch (error) {
      console.error('Failed to load approvals:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleApprove = async (processId: string) => {
    try {
      setActionLoading(processId);
      await api.approveProcess(processId, comment || undefined);
      await loadApprovals();
      setSelectedApproval(null);
      setComment('');
    } catch (error) {
      console.error('Failed to approve:', error);
      alert('Failed to approve process');
    } finally {
      setActionLoading(null);
    }
  };

  const handleReject = async (processId: string) => {
    if (!comment.trim()) {
      alert('Please provide a reason for rejection');
      return;
    }

    try {
      setActionLoading(processId);
      await api.rejectProcess(processId, comment);
      await loadApprovals();
      setSelectedApproval(null);
      setComment('');
    } catch (error) {
      console.error('Failed to reject:', error);
      alert('Failed to reject process');
    } finally {
      setActionLoading(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Pending Approvals</h1>
        <p className="text-gray-600 mt-1">
          Review and approve processes submitted by your team
        </p>
      </div>

      {/* Stats */}
      <div className="grid md:grid-cols-3 gap-6">
        <div className="card bg-yellow-50 border-yellow-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-yellow-600">Pending</p>
              <p className="text-3xl font-bold text-yellow-900 mt-1">
                {isLoading ? '...' : approvals.length}
              </p>
            </div>
            <Clock className="h-12 w-12 text-yellow-400" />
          </div>
        </div>
      </div>

      {/* Approvals List */}
      {isLoading ? (
        <div className="card text-center py-12">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
          <p className="mt-4 text-gray-600">Loading approvals...</p>
        </div>
      ) : approvals.length === 0 ? (
        <div className="card text-center py-12">
          <CheckCircle className="h-16 w-16 mx-auto text-gray-400 mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">All caught up!</h3>
          <p className="text-gray-600">There are no pending approvals at this time.</p>
        </div>
      ) : (
        <div className="grid gap-6">
          {approvals.map((approval) => (
            <div key={approval.id} className="card hover:shadow-lg transition-shadow">
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <FileText className="h-5 w-5 text-primary-600" />
                    <h3 className="text-xl font-semibold text-gray-900">
                      {approval.process.name}
                    </h3>
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                      v{approval.version}
                    </span>
                  </div>

                  {approval.process.description && (
                    <p className="text-gray-600 mb-3 line-clamp-2">
                      {approval.process.description}
                    </p>
                  )}

                  <div className="flex flex-wrap items-center gap-4 text-sm text-gray-500">
                    {approval.process.department && (
                      <span>
                        <span className="font-medium">Department:</span>{' '}
                        {approval.process.department}
                      </span>
                    )}
                    {approval.process.createdBy && (
                      <span className="flex items-center gap-1">
                        <User className="h-4 w-4" />
                        {approval.process.createdBy.name}
                      </span>
                    )}
                    <span className="flex items-center gap-1">
                      <Calendar className="h-4 w-4" />
                      {new Date(approval.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="border-t pt-4 space-y-3">
                <div className="flex gap-2">
                  <Link
                    href={`/dashboard/processes/${approval.processId}`}
                    className="btn-secondary text-sm"
                  >
                    View Details
                  </Link>
                  <button
                    onClick={() =>
                      setSelectedApproval(
                        selectedApproval?.id === approval.id ? null : approval
                      )
                    }
                    className="text-sm text-primary-600 hover:text-primary-700 font-medium"
                  >
                    {selectedApproval?.id === approval.id
                      ? 'Hide Actions'
                      : 'Review'}
                  </button>
                </div>

                {/* Review Form */}
                {selectedApproval?.id === approval.id && (
                  <div className="bg-gray-50 p-4 rounded-lg space-y-3">
                    <div>
                      <label className="label">Comment (optional for approval, required for rejection)</label>
                      <textarea
                        value={comment}
                        onChange={(e) => setComment(e.target.value)}
                        className="input min-h-[80px]"
                        placeholder="Add your feedback or reason..."
                        disabled={actionLoading === approval.processId}
                      />
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleApprove(approval.processId)}
                        disabled={actionLoading === approval.processId}
                        className="bg-green-600 hover:bg-green-700 text-white font-medium py-2 px-4 rounded-lg transition-colors flex items-center disabled:opacity-50"
                      >
                        <CheckCircle className="h-4 w-4 mr-2" />
                        {actionLoading === approval.processId
                          ? 'Approving...'
                          : 'Approve'}
                      </button>
                      <button
                        onClick={() => handleReject(approval.processId)}
                        disabled={actionLoading === approval.processId}
                        className="bg-red-600 hover:bg-red-700 text-white font-medium py-2 px-4 rounded-lg transition-colors flex items-center disabled:opacity-50"
                      >
                        <XCircle className="h-4 w-4 mr-2" />
                        {actionLoading === approval.processId
                          ? 'Rejecting...'
                          : 'Reject'}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
