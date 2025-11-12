'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  Workflow,
  Download,
  CheckCircle,
  XCircle,
  Clock,
  FileText,
  Calendar,
  ExternalLink,
} from 'lucide-react';
import { api } from '@/lib/api';
import { useProcessStore } from '@/lib/store';

interface Export {
  id: string;
  processId: string;
  process?: {
    id: string;
    name: string;
    description?: string;
  };
  format: string;
  status: string;
  workflowId?: string;
  errorMessage?: string;
  exportedAt: string;
  createdAt: string;
}

export default function IntegrationsPage() {
  const { processes } = useProcessStore();
  const [exports, setExports] = useState<Export[]>([]);
  const [selectedProcessId, setSelectedProcessId] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  const [isExporting, setIsExporting] = useState(false);

  useEffect(() => {
    loadProcesses();
  }, []);

  const loadProcesses = async () => {
    try {
      const data = await api.getProcesses();
      useProcessStore.getState().setProcesses(data);
      if (data.length > 0) {
        setSelectedProcessId(data[0].id);
      }
    } catch (error) {
      console.error('Failed to load processes:', error);
    }
  };

  const loadExports = async (processId: string) => {
    if (!processId) return;

    try {
      setIsLoading(true);
      const data = await api.getExportHistory(processId);
      setExports(data);
    } catch (error) {
      console.error('Failed to load exports:', error);
      setExports([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (selectedProcessId) {
      loadExports(selectedProcessId);
    }
  }, [selectedProcessId]);

  const handleExport = async () => {
    if (!selectedProcessId) {
      alert('Lütfen bir süreç seçin');
      return;
    }

    try {
      setIsExporting(true);
      await api.exportToN8n(selectedProcessId);
      alert('Süreç başarıyla n8n formatına aktarıldı!');
      await loadExports(selectedProcessId);
    } catch (error: any) {
      console.error('Export failed:', error);
      alert(error.response?.data?.message || 'Export işlemi başarısız oldu');
    } finally {
      setIsExporting(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'SUCCESS':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
            <CheckCircle className="h-3 w-3" />
            Success
          </span>
        );
      case 'FAILED':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
            <XCircle className="h-3 w-3" />
            Failed
          </span>
        );
      case 'PENDING':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
            <Clock className="h-3 w-3" />
            Pending
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
            {status}
          </span>
        );
    }
  };

  const selectedProcess = processes.find((p) => p.id === selectedProcessId);
  const approvedProcesses = processes.filter((p) => p.status === 'APPROVED');

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Integrations</h1>
        <p className="text-gray-600 mt-1">
          Export approved processes to n8n and manage integrations
        </p>
      </div>

      {/* Export Section */}
      <div className="card">
        <div className="flex items-center gap-3 mb-6">
          <div className="bg-primary-100 p-3 rounded-lg">
            <Workflow className="h-6 w-6 text-primary-600" />
          </div>
          <div>
            <h2 className="text-xl font-semibold text-gray-900">Export to n8n</h2>
            <p className="text-sm text-gray-600">
              Convert approved processes to n8n workflow format
            </p>
          </div>
        </div>

        {approvedProcesses.length === 0 ? (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 text-center">
            <FileText className="h-12 w-12 mx-auto text-yellow-400 mb-2" />
            <p className="text-yellow-800 font-medium">No approved processes available</p>
            <p className="text-sm text-yellow-700 mt-1">
              Processes must be approved before they can be exported
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            <div>
              <label className="label">Select Process</label>
              <select
                value={selectedProcessId}
                onChange={(e) => setSelectedProcessId(e.target.value)}
                className="input"
                disabled={isExporting}
              >
                {approvedProcesses.map((process) => (
                  <option key={process.id} value={process.id}>
                    {process.name} - v{process.currentVersion}
                  </option>
                ))}
              </select>
            </div>

            {selectedProcess && (
              <div className="bg-gray-50 p-4 rounded-lg space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-700">Process Name:</span>
                  <span className="text-sm text-gray-900">{selectedProcess.name}</span>
                </div>
                {selectedProcess.description && (
                  <div className="flex items-start justify-between">
                    <span className="text-sm font-medium text-gray-700">Description:</span>
                    <span className="text-sm text-gray-900 text-right max-w-xs">
                      {selectedProcess.description}
                    </span>
                  </div>
                )}
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-700">Department:</span>
                  <span className="text-sm text-gray-900">
                    {selectedProcess.department || 'N/A'}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-700">Version:</span>
                  <span className="text-sm text-gray-900">
                    v{selectedProcess.currentVersion}
                  </span>
                </div>
              </div>
            )}

            <button
              onClick={handleExport}
              disabled={isExporting || !selectedProcessId}
              className="btn-primary w-full flex items-center justify-center"
            >
              <Download className="h-5 w-5 mr-2" />
              {isExporting ? 'Exporting...' : 'Export to n8n'}
            </button>
          </div>
        )}
      </div>

      {/* Export History */}
      <div className="card">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold text-gray-900">Export History</h2>
          {selectedProcessId && (
            <Link
              href={`/dashboard/processes/${selectedProcessId}`}
              className="text-sm text-primary-600 hover:text-primary-700 font-medium flex items-center gap-1"
            >
              View Process
              <ExternalLink className="h-4 w-4" />
            </Link>
          )}
        </div>

        {isLoading ? (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
            <p className="mt-4 text-gray-600">Loading export history...</p>
          </div>
        ) : !selectedProcessId ? (
          <div className="text-center py-12 text-gray-500">
            <Workflow className="h-16 w-16 mx-auto mb-4 text-gray-400" />
            <p>Select a process to view export history</p>
          </div>
        ) : exports.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            <FileText className="h-16 w-16 mx-auto mb-4 text-gray-400" />
            <p>No exports yet for this process</p>
            <p className="text-sm mt-2">Export the process to see history here</p>
          </div>
        ) : (
          <div className="space-y-3">
            {exports.map((exportItem) => (
              <div
                key={exportItem.id}
                className="border border-gray-200 rounded-lg p-4 hover:border-primary-300 hover:bg-primary-50 transition-colors"
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className="bg-primary-100 p-2 rounded">
                      <Workflow className="h-5 w-5 text-primary-600" />
                    </div>
                    <div>
                      <h3 className="font-medium text-gray-900">
                        {exportItem.format.toUpperCase()} Export
                      </h3>
                      {exportItem.workflowId && (
                        <p className="text-sm text-gray-600">
                          Workflow ID: {exportItem.workflowId}
                        </p>
                      )}
                    </div>
                  </div>
                  {getStatusBadge(exportItem.status)}
                </div>

                {exportItem.errorMessage && (
                  <div className="bg-red-50 border border-red-200 rounded p-3 mb-3">
                    <p className="text-sm text-red-800">{exportItem.errorMessage}</p>
                  </div>
                )}

                <div className="flex items-center gap-4 text-sm text-gray-500">
                  <span className="flex items-center gap-1">
                    <Calendar className="h-4 w-4" />
                    {new Date(exportItem.exportedAt || exportItem.createdAt).toLocaleString()}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Info Card */}
      <div className="bg-gradient-to-r from-blue-500 to-blue-600 rounded-xl p-6 text-white">
        <div className="flex items-start justify-between">
          <div>
            <h3 className="text-xl font-semibold mb-2">About n8n Integration</h3>
            <p className="text-blue-100 mb-4">
              n8n is a powerful workflow automation tool. Export your approved processes
              to n8n format to automate your business workflows with ease.
            </p>
            <div className="flex gap-3">
              <a
                href="https://n8n.io"
                target="_blank"
                rel="noopener noreferrer"
                className="bg-white text-blue-600 hover:bg-blue-50 font-medium py-2 px-4 rounded-lg transition-colors inline-flex items-center gap-2"
              >
                Learn More
                <ExternalLink className="h-4 w-4" />
              </a>
            </div>
          </div>
          <Workflow className="h-16 w-16 text-blue-200" />
        </div>
      </div>
    </div>
  );
}
