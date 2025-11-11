'use client';

import { useState, FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Save, AlertCircle } from 'lucide-react';
import { api } from '@/lib/api';
import { ProcessStatus } from '@/lib/store';

export default function NewProcessPage() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    department: '',
    estimatedTimeMinutes: '',
    tasksPerDay: '',
    minutesPerTask: '',
    costPerHour: '',
  });
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const processData: any = {
        name: formData.name,
        description: formData.description || undefined,
        department: formData.department || undefined,
        status: ProcessStatus.DRAFT,
      };

      // Add optional numeric fields
      if (formData.estimatedTimeMinutes) {
        processData.estimatedTimeMinutes = parseInt(formData.estimatedTimeMinutes);
      }
      if (formData.tasksPerDay) {
        processData.tasksPerDay = parseInt(formData.tasksPerDay);
      }
      if (formData.minutesPerTask) {
        processData.minutesPerTask = parseInt(formData.minutesPerTask);
      }
      if (formData.costPerHour) {
        processData.costPerHour = parseFloat(formData.costPerHour);
      }

      const newProcess = await api.createProcess(processData);
      router.push(`/dashboard/processes/${newProcess.id}`);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to create process');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href="/dashboard/processes" className="text-gray-600 hover:text-gray-900">
          <ArrowLeft className="h-6 w-6" />
        </Link>
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Create New Process</h1>
          <p className="text-gray-600 mt-1">
            Document a new business process for analysis and automation
          </p>
        </div>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Error Message */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start gap-3">
            <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
            <div className="text-sm text-red-800">{error}</div>
          </div>
        )}

        {/* Basic Information */}
        <div className="card">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Basic Information</h2>
          <div className="space-y-4">
            <div>
              <label htmlFor="name" className="label">
                Process Name *
              </label>
              <input
                id="name"
                name="name"
                type="text"
                value={formData.name}
                onChange={handleChange}
                className="input"
                placeholder="e.g., Invoice Processing"
                required
                disabled={isLoading}
              />
            </div>

            <div>
              <label htmlFor="description" className="label">
                Description
              </label>
              <textarea
                id="description"
                name="description"
                value={formData.description}
                onChange={handleChange}
                className="input min-h-[120px] resize-y"
                placeholder="Describe the process in detail..."
                disabled={isLoading}
              />
            </div>

            <div>
              <label htmlFor="department" className="label">
                Department
              </label>
              <input
                id="department"
                name="department"
                type="text"
                value={formData.department}
                onChange={handleChange}
                className="input"
                placeholder="e.g., Finance, IT, Sales"
                disabled={isLoading}
              />
            </div>
          </div>
        </div>

        {/* Process Metrics */}
        <div className="card">
          <h2 className="text-xl font-semibold text-gray-900 mb-2">
            Process Metrics
          </h2>
          <p className="text-sm text-gray-600 mb-4">
            These metrics are optional but help calculate ROI and potential savings
          </p>
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="estimatedTimeMinutes" className="label">
                Estimated Time (minutes)
              </label>
              <input
                id="estimatedTimeMinutes"
                name="estimatedTimeMinutes"
                type="number"
                min="0"
                value={formData.estimatedTimeMinutes}
                onChange={handleChange}
                className="input"
                placeholder="60"
                disabled={isLoading}
              />
            </div>

            <div>
              <label htmlFor="tasksPerDay" className="label">
                Tasks Per Day
              </label>
              <input
                id="tasksPerDay"
                name="tasksPerDay"
                type="number"
                min="0"
                value={formData.tasksPerDay}
                onChange={handleChange}
                className="input"
                placeholder="10"
                disabled={isLoading}
              />
            </div>

            <div>
              <label htmlFor="minutesPerTask" className="label">
                Minutes Per Task
              </label>
              <input
                id="minutesPerTask"
                name="minutesPerTask"
                type="number"
                min="0"
                value={formData.minutesPerTask}
                onChange={handleChange}
                className="input"
                placeholder="15"
                disabled={isLoading}
              />
            </div>

            <div>
              <label htmlFor="costPerHour" className="label">
                Cost Per Hour ($)
              </label>
              <input
                id="costPerHour"
                name="costPerHour"
                type="number"
                min="0"
                step="0.01"
                value={formData.costPerHour}
                onChange={handleChange}
                className="input"
                placeholder="50.00"
                disabled={isLoading}
              />
            </div>
          </div>

          {/* ROI Calculation Info */}
          {formData.tasksPerDay &&
            formData.minutesPerTask &&
            formData.costPerHour && (
              <div className="mt-4 p-4 bg-blue-50 rounded-lg">
                <p className="text-sm text-blue-900 font-medium mb-2">
                  Estimated Metrics:
                </p>
                <div className="grid grid-cols-2 gap-2 text-sm text-blue-800">
                  <div>
                    Hours per day:{' '}
                    {(
                      (parseInt(formData.tasksPerDay) *
                        parseInt(formData.minutesPerTask)) /
                      60
                    ).toFixed(2)}
                  </div>
                  <div>
                    Daily cost: $
                    {(
                      ((parseInt(formData.tasksPerDay) *
                        parseInt(formData.minutesPerTask)) /
                        60) *
                      parseFloat(formData.costPerHour)
                    ).toFixed(2)}
                  </div>
                </div>
              </div>
            )}
        </div>

        {/* Action Buttons */}
        <div className="flex justify-end gap-3">
          <Link href="/dashboard/processes" className="btn-secondary">
            Cancel
          </Link>
          <button
            type="submit"
            disabled={isLoading}
            className="btn-primary flex items-center disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Save className="h-4 w-4 mr-2" />
            {isLoading ? 'Creating...' : 'Create Process'}
          </button>
        </div>
      </form>

      {/* Help Section */}
      <div className="card bg-gray-50">
        <h3 className="font-semibold text-gray-900 mb-2">Need help?</h3>
        <p className="text-sm text-gray-600">
          After creating your process, you can use AI analysis to get insights and
          recommendations. Once approved, you can export it to n8n for automation.
        </p>
      </div>
    </div>
  );
}
