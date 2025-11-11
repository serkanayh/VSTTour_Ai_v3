'use client';

import { useEffect, useState } from 'react';
import { TrendingUp, DollarSign, Clock, BarChart3 } from 'lucide-react';
import { api } from '@/lib/api';
import Link from 'next/link';

interface ROISummary {
  totalProcesses: number;
  totalMonthlyCost: number;
  totalPotentialSavings: number;
  averageROI: number;
  processes: Array<{
    id: string;
    name: string;
    monthlyCost: number;
    potentialSavings: number;
    roi: number;
  }>;
}

export default function ROIDashboardPage() {
  const [summary, setSummary] = useState<ROISummary | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadROIData();
  }, []);

  const loadROIData = async () => {
    try {
      setIsLoading(true);
      const processes = await api.getProcesses({ status: 'APPROVED' });

      let totalMonthlyCost = 0;
      let totalPotentialSavings = 0;
      let totalROI = 0;
      let processCount = 0;

      const processesWithROI = await Promise.all(
        processes.map(async (process: any) => {
          if (!process.estimatedTimeMinutes) return null;

          try {
            const roi = await api.calculateROI(process.id);
            totalMonthlyCost += roi.monthlyCost;
            totalPotentialSavings += roi.potentialMonthlySavings;
            totalROI += roi.roi;
            processCount++;

            return {
              id: process.id,
              name: process.name,
              monthlyCost: roi.monthlyCost,
              potentialSavings: roi.potentialMonthlySavings,
              roi: roi.roi,
            };
          } catch (error) {
            return null;
          }
        })
      );

      setSummary({
        totalProcesses: processCount,
        totalMonthlyCost,
        totalPotentialSavings,
        averageROI: processCount > 0 ? totalROI / processCount : 0,
        processes: processesWithROI.filter((p) => p !== null) as any[],
      });
    } catch (error) {
      console.error('Failed to load ROI data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  if (!summary || summary.totalProcesses === 0) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">ROI Dashboard</h1>
          <p className="text-gray-600 mt-1">
            Track cost savings and return on investment
          </p>
        </div>
        <div className="card text-center py-12">
          <BarChart3 className="h-16 w-16 mx-auto text-gray-400 mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            No ROI data available
          </h3>
          <p className="text-gray-600">
            Create processes with metrics to see ROI analysis
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">ROI Dashboard</h1>
        <p className="text-gray-600 mt-1">
          Track cost savings and return on investment across all processes
        </p>
      </div>

      {/* Summary Cards */}
      <div className="grid md:grid-cols-4 gap-6">
        <div className="card bg-blue-50 border-blue-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-blue-600">Total Processes</p>
              <p className="text-3xl font-bold text-blue-900 mt-1">
                {summary.totalProcesses}
              </p>
            </div>
            <BarChart3 className="h-12 w-12 text-blue-400" />
          </div>
        </div>

        <div className="card bg-red-50 border-red-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-red-600">Monthly Cost</p>
              <p className="text-3xl font-bold text-red-900 mt-1">
                ${summary.totalMonthlyCost.toFixed(0)}
              </p>
            </div>
            <DollarSign className="h-12 w-12 text-red-400" />
          </div>
        </div>

        <div className="card bg-green-50 border-green-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-green-600">Potential Savings</p>
              <p className="text-3xl font-bold text-green-900 mt-1">
                ${summary.totalPotentialSavings.toFixed(0)}
              </p>
              <p className="text-xs text-green-600 mt-1">per month</p>
            </div>
            <TrendingUp className="h-12 w-12 text-green-400" />
          </div>
        </div>

        <div className="card bg-purple-50 border-purple-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-purple-600">Average ROI</p>
              <p className="text-3xl font-bold text-purple-900 mt-1">
                {summary.averageROI.toFixed(1)}%
              </p>
            </div>
            <Clock className="h-12 w-12 text-purple-400" />
          </div>
        </div>
      </div>

      {/* Annual Projection */}
      <div className="card bg-gradient-to-r from-primary-500 to-primary-600 text-white">
        <h2 className="text-2xl font-bold mb-2">Annual Projection</h2>
        <div className="grid md:grid-cols-2 gap-6">
          <div>
            <p className="text-primary-100 text-sm">Annual Cost</p>
            <p className="text-4xl font-bold">
              ${(summary.totalMonthlyCost * 12).toFixed(0)}
            </p>
          </div>
          <div>
            <p className="text-primary-100 text-sm">Potential Annual Savings</p>
            <p className="text-4xl font-bold">
              ${(summary.totalPotentialSavings * 12).toFixed(0)}
            </p>
          </div>
        </div>
      </div>

      {/* Process Breakdown */}
      <div className="card">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">
          Process ROI Breakdown
        </h2>
        <div className="space-y-4">
          {summary.processes
            .sort((a, b) => b.potentialSavings - a.potentialSavings)
            .map((process) => (
              <Link
                key={process.id}
                href={`/dashboard/processes/${process.id}`}
                className="block border border-gray-200 rounded-lg p-4 hover:border-primary-300 hover:bg-primary-50 transition-colors"
              >
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-semibold text-gray-900">{process.name}</h3>
                  <span className="text-lg font-bold text-primary-600">
                    {process.roi.toFixed(1)}% ROI
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-gray-600">Monthly Cost: </span>
                    <span className="font-medium text-red-600">
                      ${process.monthlyCost.toFixed(2)}
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-600">Potential Savings: </span>
                    <span className="font-medium text-green-600">
                      ${process.potentialSavings.toFixed(2)}
                    </span>
                  </div>
                </div>

                {/* Progress Bar */}
                <div className="mt-3">
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-green-500 h-2 rounded-full transition-all"
                      style={{
                        width: `${Math.min(
                          (process.potentialSavings / process.monthlyCost) * 100,
                          100
                        )}%`,
                      }}
                    />
                  </div>
                </div>
              </Link>
            ))}
        </div>
      </div>
    </div>
  );
}
