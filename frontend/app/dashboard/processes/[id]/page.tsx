'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
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
  ListChecks,
  MessageSquare,
  FileText,
  Plus,
  History,
  Lightbulb,
  X,
  ChevronDown,
  ChevronUp,
  GripVertical,
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
  tasksPerDay?: number;
  minutesPerTask?: number;
  costPerHour?: number;
  createdBy?: any;
  createdAt: string;
  updatedAt: string;
  versions?: any[];
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

interface SubStep {
  id: string;
  order: number;
  title: string;
  description: string;
  estimatedMinutes?: number;
}

interface ProcessStep {
  id: string;
  order: number;
  title: string;
  description: string;
  estimatedMinutes?: number;
  subSteps?: SubStep[];
}

type TabType = 'overview' | 'steps' | 'ai-chat' | 'history';

interface SortableStepItemProps {
  step: ProcessStep;
  index: number;
  canEdit: boolean;
  expandedSteps: Set<string>;
  onEdit: (step: ProcessStep) => void;
  onDelete: (stepId: string) => void;
  onToggleExpand: (stepId: string) => void;
  onAddSubStep: (stepId: string) => void;
  onEditSubStep: (stepId: string, subStep: SubStep) => void;
  onDeleteSubStep: (stepId: string, subStepId: string) => void;
}

function SortableStepItem({
  step,
  index,
  canEdit,
  expandedSteps,
  onEdit,
  onDelete,
  onToggleExpand,
  onAddSubStep,
  onEditSubStep,
  onDeleteSubStep,
}: SortableStepItemProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: step.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div ref={setNodeRef} style={style} className="card hover:shadow-lg transition-shadow">
      <div className="flex items-start gap-4">
        {canEdit && (
          <button
            {...attributes}
            {...listeners}
            className="flex-shrink-0 cursor-grab active:cursor-grabbing text-gray-400 hover:text-gray-600 mt-2"
          >
            <GripVertical className="h-5 w-5" />
          </button>
        )}
        <div className="flex-shrink-0 w-10 h-10 rounded-full bg-primary-100 flex items-center justify-center">
          <span className="text-primary-600 font-bold">{step.order}</span>
        </div>
        <div className="flex-1">
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            {step.title}
          </h3>
          <p className="text-gray-600 mb-3">{step.description}</p>
          {step.estimatedMinutes && (
            <div className="flex items-center text-sm text-gray-500">
              <Clock className="h-4 w-4 mr-1" />
              ~{step.estimatedMinutes} dakika
            </div>
          )}
        </div>
        {canEdit && (
          <div className="flex gap-2">
            <button
              onClick={() => onEdit(step)}
              className="text-gray-400 hover:text-primary-600"
            >
              <Edit className="h-5 w-5" />
            </button>
            <button
              onClick={() => onDelete(step.id)}
              className="text-gray-400 hover:text-red-600"
            >
              <Trash2 className="h-5 w-5" />
            </button>
          </div>
        )}
      </div>

      {/* Sub-Steps Section */}
      <div className="mt-4 ml-14 border-l-2 border-gray-200 pl-4">
        <div className="flex items-center justify-between mb-2">
          <button
            onClick={() => onToggleExpand(step.id)}
            className="flex items-center gap-2 text-sm font-medium text-gray-700 hover:text-primary-600"
          >
            {expandedSteps.has(step.id) ? (
              <ChevronUp className="h-4 w-4" />
            ) : (
              <ChevronDown className="h-4 w-4" />
            )}
            <span>
              Alt Adımlar {step.subSteps && step.subSteps.length > 0 && `(${step.subSteps.length})`}
            </span>
          </button>
          {canEdit && expandedSteps.has(step.id) && (
            <button
              onClick={() => onAddSubStep(step.id)}
              className="text-sm text-primary-600 hover:text-primary-800 flex items-center gap-1"
            >
              <Plus className="h-4 w-4" />
              Ekle
            </button>
          )}
        </div>

        {expandedSteps.has(step.id) && step.subSteps && step.subSteps.length > 0 && (
          <div className="space-y-2 mt-2">
            {step.subSteps.map((subStep, subIndex) => (
              <div
                key={subStep.id}
                className="bg-gray-50 rounded-lg p-3 hover:bg-gray-100 transition-colors"
              >
                <div className="flex items-start gap-3">
                  <div className="flex-shrink-0 bg-green-100 text-green-800 text-xs font-semibold px-2 py-1 rounded">
                    {step.order}.{subStep.order}
                  </div>
                  <div className="flex-1">
                    <h4 className="text-sm font-medium text-gray-900">{subStep.title}</h4>
                    <p className="text-xs text-gray-600 mt-1">{subStep.description}</p>
                    {subStep.estimatedMinutes && (
                      <div className="flex items-center text-xs text-gray-500 mt-1">
                        <Clock className="h-3 w-3 mr-1" />
                        ~{subStep.estimatedMinutes} dakika
                      </div>
                    )}
                  </div>
                  {canEdit && (
                    <div className="flex gap-1">
                      <button
                        onClick={() => onEditSubStep(step.id, subStep)}
                        className="text-gray-400 hover:text-primary-600"
                      >
                        <Edit className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => onDeleteSubStep(step.id, subStep.id)}
                        className="text-gray-400 hover:text-red-600"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
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
  const [activeTab, setActiveTab] = useState<TabType>('overview');

  // Process steps
  const [steps, setSteps] = useState<ProcessStep[]>([]);
  const [stepsLoading, setStepsLoading] = useState(false);
  const [showStepForm, setShowStepForm] = useState(false);
  const [editingStep, setEditingStep] = useState<ProcessStep | null>(null);
  const [stepFormData, setStepFormData] = useState({ title: '', description: '', estimatedMinutes: '' });

  // AI Chat
  const [aiMessages, setAiMessages] = useState<Array<{role: 'user' | 'assistant', content: string}>>([
    { role: 'assistant', content: 'Merhaba! Bu süreç hakkında sorularınız varsa yardımcı olabilirim. Örneğin, adımları optimize etmek veya otomasyon önerileri almak isterseniz sorabilirsiniz.' },
  ]);
  const [aiInput, setAiInput] = useState('');
  const [aiLoading, setAiLoading] = useState(false);

  // AI Analysis
  const [analysisResult, setAnalysisResult] = useState<any>(null);
  const [analysisLoading, setAnalysisLoading] = useState(false);
  const [showAnalysis, setShowAnalysis] = useState(false);

  // Sub-steps
  const [expandedSteps, setExpandedSteps] = useState<Set<string>>(new Set());
  const [showSubStepForm, setShowSubStepForm] = useState(false);
  const [currentStepId, setCurrentStepId] = useState<string | null>(null);
  const [editingSubStep, setEditingSubStep] = useState<{ stepId: string; subStep: SubStep } | null>(null);
  const [subStepFormData, setSubStepFormData] = useState({ title: '', description: '', estimatedMinutes: '' });

  // SOP Generation
  const [sopResult, setSopResult] = useState<any>(null);
  const [sopLoading, setSopLoading] = useState(false);
  const [showSopModal, setShowSopModal] = useState(false);

  // Drag & Drop sensors
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  useEffect(() => {
    if (params.id) {
      loadProcess();
      loadSteps();
      loadConversation();
    }
  }, [params.id]);

  const loadProcess = async () => {
    try {
      setIsLoading(true);
      const data = await api.getProcess(params.id as string);
      setProcess(data);

      // Load ROI if process has estimation data
      if (data.tasksPerDay && data.minutesPerTask && data.costPerHour) {
        const roiData = await api.calculateROI(params.id as string);
        setRoi(roiData);
      }
    } catch (error) {
      console.error('Failed to load process:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const loadSteps = async () => {
    try {
      setStepsLoading(true);
      const data = await api.getProcessSteps(params.id as string);
      setSteps(data.steps || []);
    } catch (error) {
      console.error('Failed to load steps:', error);
    } finally {
      setStepsLoading(false);
    }
  };

  const loadConversation = async () => {
    try {
      const data = await api.getConversationHistory(params.id as string);
      if (data.messages && data.messages.length > 0) {
        setAiMessages(data.messages.map((msg: any) => ({
          role: msg.role,
          content: msg.content,
        })));
      }
    } catch (error) {
      console.error('Failed to load conversation:', error);
    }
  };

  const handleAddStep = async () => {
    if (!stepFormData.title || !stepFormData.description) {
      alert('Başlık ve açıklama zorunludur');
      return;
    }

    try {
      const stepData = {
        title: stepFormData.title,
        description: stepFormData.description,
        estimatedMinutes: stepFormData.estimatedMinutes ? parseInt(stepFormData.estimatedMinutes) : undefined,
      };

      if (editingStep) {
        await api.updateProcessStep(params.id as string, editingStep.id, stepData);
      } else {
        await api.addProcessStep(params.id as string, stepData);
      }

      await loadSteps();
      setStepFormData({ title: '', description: '', estimatedMinutes: '' });
      setShowStepForm(false);
      setEditingStep(null);
    } catch (error) {
      console.error('Failed to save step:', error);
      alert('Adım kaydedilemedi');
    }
  };

  const handleEditStep = (step: ProcessStep) => {
    setEditingStep(step);
    setStepFormData({
      title: step.title,
      description: step.description,
      estimatedMinutes: step.estimatedMinutes?.toString() || '',
    });
    setShowStepForm(true);
  };

  const handleDeleteStep = async (stepId: string) => {
    if (!confirm('Bu adımı silmek istediğinizden emin misiniz?')) return;

    try {
      await api.deleteProcessStep(params.id as string, stepId);
      await loadSteps();
    } catch (error) {
      console.error('Failed to delete step:', error);
      alert('Adım silinemedi');
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


  const handleExport = async () => {
    try {
      setActionLoading('export');
      await api.exportToN8n(params.id as string);
      alert('Process başarıyla n8n\'e export edildi!');
    } catch (error: any) {
      console.error('Failed to export:', error);
      alert(error.response?.data?.message || 'Failed to export to n8n');
    } finally {
      setActionLoading(null);
    }
  };

  const handleAIChat = async () => {
    if (!aiInput.trim()) return;

    const userMessage = aiInput;
    setAiInput('');
    setAiMessages([...aiMessages, { role: 'user', content: userMessage }]);
    setAiLoading(true);

    try {
      // Call real backend API
      const response = await api.sendMessage(params.id as string, userMessage);
      setAiMessages(prev => [...prev, { role: 'assistant', content: response.message }]);
    } catch (error: any) {
      console.error('AI chat error:', error);
      const errorMessage = error.response?.data?.message || 'AI yanıt veremedi. Lütfen tekrar deneyin.';
      setAiMessages(prev => [...prev, { role: 'assistant', content: errorMessage }]);
    } finally {
      setAiLoading(false);
    }
  };

  const handleAnalyzeProcess = async () => {
    if (steps.length === 0) {
      alert('Analiz için önce süreç adımları eklemelisiniz.');
      return;
    }

    setAnalysisLoading(true);
    setShowAnalysis(false);

    try {
      const result = await api.analyzeProcess(params.id as string);
      setAnalysisResult(result.analysis);
      setShowAnalysis(true);
    } catch (error: any) {
      console.error('Analysis error:', error);
      alert(error.response?.data?.message || 'Analiz başarısız oldu.');
    } finally {
      setAnalysisLoading(false);
    }
  };

  const handleGenerateSOP = async () => {
    if (steps.length === 0) {
      alert('SOP oluşturmak için önce süreç adımları eklemelisiniz.');
      return;
    }

    setSopLoading(true);
    setSopResult(null);

    try {
      const result = await api.generateSOP(params.id as string);
      setSopResult(result);
      setShowSopModal(true);
      // Reload process to see new version
      await loadProcess();
    } catch (error: any) {
      console.error('SOP generation error:', error);
      alert(error.response?.data?.message || 'SOP oluşturma başarısız oldu.');
    } finally {
      setSopLoading(false);
    }
  };

  const toggleStepExpansion = (stepId: string) => {
    const newExpanded = new Set(expandedSteps);
    if (newExpanded.has(stepId)) {
      newExpanded.delete(stepId);
    } else {
      newExpanded.add(stepId);
    }
    setExpandedSteps(newExpanded);
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;

    if (!over || active.id === over.id) {
      return;
    }

    const oldIndex = steps.findIndex((step) => step.id === active.id);
    const newIndex = steps.findIndex((step) => step.id === over.id);

    const newSteps = arrayMove(steps, oldIndex, newIndex);
    setSteps(newSteps);

    // Update on backend
    try {
      await api.reorderProcessSteps(params.id as string, newSteps.map(s => s.id));
    } catch (error) {
      console.error('Failed to reorder steps:', error);
      // Revert on error
      setSteps(steps);
      alert('Adımları yeniden sıralama başarısız oldu.');
    }
  };

  const handleAddSubStep = async () => {
    if (!subStepFormData.title || !subStepFormData.description || !currentStepId) {
      alert('Başlık ve açıklama zorunludur');
      return;
    }

    try {
      const subStepData = {
        title: subStepFormData.title,
        description: subStepFormData.description,
        estimatedMinutes: subStepFormData.estimatedMinutes ? parseInt(subStepFormData.estimatedMinutes) : undefined,
      };

      if (editingSubStep) {
        await api.updateSubStep(params.id as string, editingSubStep.stepId, editingSubStep.subStep.id, subStepData);
      } else {
        await api.addSubStep(params.id as string, currentStepId, subStepData);
      }

      await loadSteps();
      setSubStepFormData({ title: '', description: '', estimatedMinutes: '' });
      setShowSubStepForm(false);
      setEditingSubStep(null);
      setCurrentStepId(null);
    } catch (error) {
      console.error('Failed to save sub-step:', error);
      alert('Alt adım kaydedilemedi');
    }
  };

  const handleEditSubStep = (stepId: string, subStep: SubStep) => {
    setEditingSubStep({ stepId, subStep });
    setCurrentStepId(stepId);
    setSubStepFormData({
      title: subStep.title,
      description: subStep.description,
      estimatedMinutes: subStep.estimatedMinutes?.toString() || '',
    });
    setShowSubStepForm(true);
  };

  const handleDeleteSubStep = async (stepId: string, subStepId: string) => {
    if (!confirm('Bu alt adımı silmek istediğinizden emin misiniz?')) return;

    try {
      await api.deleteSubStep(params.id as string, stepId, subStepId);
      await loadSteps();
    } catch (error) {
      console.error('Failed to delete sub-step:', error);
      alert('Alt adım silinemedi');
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
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Process Bulunamadı</h2>
        <Link href="/dashboard/processes" className="text-primary-600 hover:text-primary-700">
          ← Süreçlere Dön
        </Link>
      </div>
    );
  }

  const canEdit = user?.id === process.createdBy?.id || user?.role === UserRole.ADMIN;
  const canSubmit = process.status === ProcessStatus.DRAFT && canEdit;
  const canExport = process.status === ProcessStatus.APPROVED &&
    (user?.role === UserRole.DEVELOPER || user?.role === UserRole.ADMIN);

  const tabs = [
    { id: 'overview' as TabType, label: 'Genel Bakış', icon: FileText },
    { id: 'steps' as TabType, label: 'Adımlar', icon: ListChecks },
    { id: 'ai-chat' as TabType, label: 'AI Asistan', icon: MessageSquare },
    { id: 'history' as TabType, label: 'Geçmiş', icon: History },
  ];

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
            <p className="text-gray-600 mt-1">Versiyon {process.currentVersion}</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {canEdit && (
            <button
              onClick={() => setShowDeleteConfirm(true)}
              className="bg-red-100 text-red-700 hover:bg-red-200 font-medium py-2 px-4 rounded-lg transition-colors flex items-center"
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Sil
            </button>
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

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="flex space-x-8">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                activeTab === tab.id
                  ? 'border-primary-600 text-primary-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <tab.icon className="h-5 w-5" />
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {/* Tab Content */}
      <div className="min-h-[400px]">
        {/* Overview Tab */}
        {activeTab === 'overview' && (
          <div className="grid lg:grid-cols-3 gap-6">
            {/* Left Column */}
            <div className="lg:col-span-2 space-y-6">
              {/* Description */}
              <div className="card">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">Açıklama</h2>
                <p className="text-gray-700 whitespace-pre-wrap">
                  {process.description || 'Açıklama eklenmemiş'}
                </p>
              </div>

              {/* ROI Metrics */}
              {roi && (
                <div className="card">
                  <div className="flex items-center gap-2 mb-4">
                    <BarChart3 className="h-6 w-6 text-primary-600" />
                    <h2 className="text-xl font-semibold text-gray-900">ROI Analizi</h2>
                  </div>
                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="bg-blue-50 p-4 rounded-lg">
                      <p className="text-sm text-gray-600">Aylık Maliyet</p>
                      <p className="text-2xl font-bold text-blue-600">
                        ₺{roi.monthlyCost?.toFixed(2) || '0.00'}
                      </p>
                    </div>
                    <div className="bg-green-50 p-4 rounded-lg">
                      <p className="text-sm text-gray-600">Potansiyel Aylık Tasarruf</p>
                      <p className="text-2xl font-bold text-green-600">
                        ₺{roi.potentialMonthlySavings?.toFixed(2) || '0.00'}
                      </p>
                    </div>
                    <div className="bg-purple-50 p-4 rounded-lg">
                      <p className="text-sm text-gray-600">ROI Yüzdesi</p>
                      <p className="text-2xl font-bold text-purple-600">
                        %{roi.roi?.toFixed(1) || '0.0'}
                      </p>
                    </div>
                    <div className="bg-orange-50 p-4 rounded-lg">
                      <p className="text-sm text-gray-600">Geri Ödeme Süresi</p>
                      <p className="text-2xl font-bold text-orange-600">
                        {roi.paybackPeriod?.toFixed(1) || '0.0'} ay
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Actions */}
              <div className="card">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">İşlemler</h2>
                <div className="flex flex-wrap gap-3">
                  {canSubmit && (
                    <button
                      onClick={handleSubmitForApproval}
                      disabled={actionLoading === 'submit'}
                      className="btn-primary flex items-center disabled:opacity-50"
                    >
                      <Send className="h-4 w-4 mr-2" />
                      {actionLoading === 'submit' ? 'Gönderiliyor...' : 'Onaya Gönder'}
                    </button>
                  )}

                  {canExport && (
                    <button
                      onClick={handleExport}
                      disabled={actionLoading === 'export'}
                      className="bg-green-600 hover:bg-green-700 text-white font-medium py-2 px-4 rounded-lg transition-colors flex items-center disabled:opacity-50"
                    >
                      <Download className="h-4 w-4 mr-2" />
                      {actionLoading === 'export' ? 'Export Ediliyor...' : 'n8n\'e Export Et'}
                    </button>
                  )}
                </div>

                <div className="mt-4 p-4 bg-purple-50 border border-purple-200 rounded-lg">
                  <div className="flex items-start gap-3">
                    <Bot className="h-5 w-5 text-purple-600 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="text-sm font-medium text-gray-900 mb-1">AI Analizi için</p>
                      <p className="text-sm text-gray-700">
                        Süreci AI ile analiz etmek ve iyileştirme önerileri almak için
                        <button
                          onClick={() => setActiveTab('steps')}
                          className="text-purple-600 hover:text-purple-800 font-semibold mx-1 underline"
                        >
                          Adımlar
                        </button>
                        sekmesine gidin ve "AI ile Analiz Et" butonunu kullanın.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Column - Metadata */}
            <div className="space-y-6">
              <div className="card">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Detaylar</h2>
                <div className="space-y-4">
                  {process.department && (
                    <div className="flex items-start gap-3">
                      <Building className="h-5 w-5 text-gray-400 mt-0.5" />
                      <div>
                        <p className="text-sm text-gray-600">Departman</p>
                        <p className="font-medium text-gray-900">{process.department}</p>
                      </div>
                    </div>
                  )}

                  {process.estimatedTimeMinutes && (
                    <div className="flex items-start gap-3">
                      <Clock className="h-5 w-5 text-gray-400 mt-0.5" />
                      <div>
                        <p className="text-sm text-gray-600">Tahmini Süre</p>
                        <p className="font-medium text-gray-900">
                          {process.estimatedTimeMinutes} dakika
                        </p>
                      </div>
                    </div>
                  )}

                  {process.createdBy && (
                    <div className="flex items-start gap-3">
                      <User className="h-5 w-5 text-gray-400 mt-0.5" />
                      <div>
                        <p className="text-sm text-gray-600">Oluşturan</p>
                        <p className="font-medium text-gray-900">
                          {process.createdBy.name}
                        </p>
                      </div>
                    </div>
                  )}

                  <div className="flex items-start gap-3">
                    <Calendar className="h-5 w-5 text-gray-400 mt-0.5" />
                    <div>
                      <p className="text-sm text-gray-600">Oluşturulma</p>
                      <p className="font-medium text-gray-900">
                        {new Date(process.createdAt).toLocaleDateString('tr-TR')}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <Calendar className="h-5 w-5 text-gray-400 mt-0.5" />
                    <div>
                      <p className="text-sm text-gray-600">Son Güncelleme</p>
                      <p className="font-medium text-gray-900">
                        {new Date(process.updatedAt).toLocaleDateString('tr-TR')}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Steps Tab */}
        {activeTab === 'steps' && (
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-bold text-gray-900">Süreç Adımları</h2>
              <div className="flex gap-3">
                {steps.length > 0 && (
                  <>
                    <button
                      onClick={handleAnalyzeProcess}
                      disabled={analysisLoading}
                      className="bg-purple-600 hover:bg-purple-700 text-white font-medium py-2 px-4 rounded-lg transition-colors flex items-center disabled:opacity-50"
                    >
                      <Bot className="h-4 w-4 mr-2" />
                      {analysisLoading ? 'Analiz Ediliyor...' : 'AI ile Analiz Et'}
                    </button>
                    <button
                      onClick={handleGenerateSOP}
                      disabled={sopLoading}
                      className="bg-indigo-600 hover:bg-indigo-700 text-white font-medium py-2 px-4 rounded-lg transition-colors flex items-center disabled:opacity-50"
                    >
                      <FileText className="h-4 w-4 mr-2" />
                      {sopLoading ? 'Oluşturuluyor...' : 'SOP Oluştur'}
                    </button>
                  </>
                )}
                {canEdit && (
                  <button
                    onClick={() => {
                      setEditingStep(null);
                      setStepFormData({ title: '', description: '', estimatedMinutes: '' });
                      setShowStepForm(true);
                    }}
                    className="btn-primary flex items-center"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Yeni Adım
                  </button>
                )}
              </div>
            </div>

            {/* AI Analysis Results */}
            {showAnalysis && analysisResult && (
              <div className="card bg-gradient-to-br from-purple-50 to-blue-50 border-2 border-purple-200">
                <div className="flex items-start gap-3 mb-4">
                  <Bot className="h-6 w-6 text-purple-600 flex-shrink-0 mt-1" />
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">AI Analiz Sonucu</h3>
                    <p className="text-gray-700 mb-4">{analysisResult.overall}</p>

                    {analysisResult.issues && analysisResult.issues.length > 0 && (
                      <div className="mb-4">
                        <h4 className="font-semibold text-red-700 mb-2 flex items-center">
                          <AlertCircle className="h-4 w-4 mr-2" />
                          Tespit Edilen Sorunlar ({analysisResult.issues.length})
                        </h4>
                        <ul className="space-y-2">
                          {analysisResult.issues.map((issue: any, idx: number) => (
                            <li key={idx} className="bg-white rounded-lg p-3 border border-red-200">
                              <span className="font-medium text-red-700">Adım {issue.stepNumber}:</span>{' '}
                              <span className="text-gray-700">{issue.issue}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {analysisResult.suggestions && analysisResult.suggestions.length > 0 && (
                      <div>
                        <h4 className="font-semibold text-green-700 mb-2 flex items-center">
                          <Lightbulb className="h-4 w-4 mr-2" />
                          İyileştirme Önerileri ({analysisResult.suggestions.length})
                        </h4>
                        <ul className="space-y-2">
                          {analysisResult.suggestions.map((suggestion: any, idx: number) => (
                            <li key={idx} className="bg-white rounded-lg p-3 border border-green-200">
                              <span className="font-medium text-green-700">Adım {suggestion.stepNumber}:</span>{' '}
                              <span className="text-gray-700">{suggestion.suggestion}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                  <button
                    onClick={() => setShowAnalysis(false)}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>
              </div>
            )}

            {/* Step Form Modal */}
            {showStepForm && (
              <div className="card bg-blue-50">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  {editingStep ? 'Adımı Düzenle' : 'Yeni Adım Ekle'}
                </h3>
                <div className="space-y-4">
                  <div>
                    <label className="label">Başlık *</label>
                    <input
                      type="text"
                      value={stepFormData.title}
                      onChange={(e) => setStepFormData({ ...stepFormData, title: e.target.value })}
                      className="input"
                      placeholder="ör. Veriyi Topla"
                    />
                  </div>
                  <div>
                    <label className="label">Açıklama *</label>
                    <textarea
                      value={stepFormData.description}
                      onChange={(e) => setStepFormData({ ...stepFormData, description: e.target.value })}
                      className="input min-h-[100px]"
                      placeholder="Bu adımda ne yapılacağını açıklayın..."
                    />
                  </div>
                  <div>
                    <label className="label">Tahmini Süre (dakika)</label>
                    <input
                      type="number"
                      value={stepFormData.estimatedMinutes}
                      onChange={(e) => setStepFormData({ ...stepFormData, estimatedMinutes: e.target.value })}
                      className="input"
                      placeholder="15"
                      min="0"
                    />
                  </div>
                  <div className="flex gap-3">
                    <button onClick={handleAddStep} className="btn-primary">
                      {editingStep ? 'Güncelle' : 'Ekle'}
                    </button>
                    <button
                      onClick={() => {
                        setShowStepForm(false);
                        setEditingStep(null);
                        setStepFormData({ title: '', description: '', estimatedMinutes: '' });
                      }}
                      className="btn-secondary"
                    >
                      İptal
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Sub-Step Form Modal */}
            {showSubStepForm && (
              <div className="card bg-green-50 border-2 border-green-200">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  {editingSubStep ? 'Alt Adımı Düzenle' : 'Yeni Alt Adım Ekle'}
                </h3>
                <div className="space-y-4">
                  <div>
                    <label className="label">Başlık *</label>
                    <input
                      type="text"
                      value={subStepFormData.title}
                      onChange={(e) => setSubStepFormData({ ...subStepFormData, title: e.target.value })}
                      className="input"
                      placeholder="ör. Veriyi Doğrula"
                    />
                  </div>
                  <div>
                    <label className="label">Açıklama *</label>
                    <textarea
                      value={subStepFormData.description}
                      onChange={(e) => setSubStepFormData({ ...subStepFormData, description: e.target.value })}
                      className="input min-h-[80px]"
                      placeholder="Bu alt adımda ne yapılacağını açıklayın..."
                    />
                  </div>
                  <div>
                    <label className="label">Tahmini Süre (dakika)</label>
                    <input
                      type="number"
                      value={subStepFormData.estimatedMinutes}
                      onChange={(e) => setSubStepFormData({ ...subStepFormData, estimatedMinutes: e.target.value })}
                      className="input"
                      placeholder="5"
                      min="0"
                    />
                  </div>
                  <div className="flex gap-3">
                    <button onClick={handleAddSubStep} className="btn-primary">
                      {editingSubStep ? 'Güncelle' : 'Ekle'}
                    </button>
                    <button
                      onClick={() => {
                        setShowSubStepForm(false);
                        setEditingSubStep(null);
                        setCurrentStepId(null);
                        setSubStepFormData({ title: '', description: '', estimatedMinutes: '' });
                      }}
                      className="btn-secondary"
                    >
                      İptal
                    </button>
                  </div>
                </div>
              </div>
            )}

            {stepsLoading ? (
              <div className="card text-center py-12">
                <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
              </div>
            ) : steps.length === 0 ? (
              <div className="card text-center py-12">
                <ListChecks className="h-16 w-16 mx-auto text-gray-400 mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  Henüz Adım Eklenmemiş
                </h3>
                <p className="text-gray-600 mb-6">
                  Bu süreç için adımları tanımlayarak başlayın
                </p>
                {canEdit && (
                  <button
                    onClick={() => {
                      setEditingStep(null);
                      setStepFormData({ title: '', description: '', estimatedMinutes: '' });
                      setShowStepForm(true);
                    }}
                    className="btn-primary inline-flex items-center"
                  >
                    <Plus className="h-5 w-5 mr-2" />
                    İlk Adımı Ekle
                  </button>
                )}
              </div>
            ) : (
              <DndContext
                sensors={sensors}
                collisionDetection={closestCenter}
                onDragEnd={handleDragEnd}
              >
                <SortableContext
                  items={steps.map(s => s.id)}
                  strategy={verticalListSortingStrategy}
                >
                  <div className="space-y-3">
                    {steps.map((step, index) => (
                      <SortableStepItem
                        key={step.id}
                        step={step}
                        index={index}
                        canEdit={canEdit}
                        expandedSteps={expandedSteps}
                        onEdit={handleEditStep}
                        onDelete={handleDeleteStep}
                        onToggleExpand={toggleStepExpansion}
                        onAddSubStep={(stepId) => {
                          setCurrentStepId(stepId);
                          setEditingSubStep(null);
                          setSubStepFormData({ title: '', description: '', estimatedMinutes: '' });
                          setShowSubStepForm(true);
                        }}
                        onEditSubStep={handleEditSubStep}
                        onDeleteSubStep={handleDeleteSubStep}
                      />
                    ))}
                  </div>
                </SortableContext>
              </DndContext>
            )}
          </div>
        )}

        {/* AI Chat Tab */}
        {activeTab === 'ai-chat' && (
          <div className="card">
            <div className="flex items-center gap-2 mb-4">
              <Bot className="h-6 w-6 text-primary-600" />
              <h2 className="text-xl font-semibold text-gray-900">AI Asistan</h2>
            </div>

            <div className="bg-gray-50 rounded-lg p-4 mb-4 h-96 overflow-y-auto">
              {aiMessages.map((msg, idx) => (
                <div
                  key={idx}
                  className={`mb-4 flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-[80%] rounded-lg p-3 ${
                      msg.role === 'user'
                        ? 'bg-primary-600 text-white'
                        : 'bg-white border border-gray-200'
                    }`}
                  >
                    <p className="text-sm">{msg.content}</p>
                  </div>
                </div>
              ))}
              {aiLoading && (
                <div className="flex justify-start">
                  <div className="bg-white border border-gray-200 rounded-lg p-3">
                    <div className="flex gap-2">
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="flex gap-2">
              <input
                type="text"
                value={aiInput}
                onChange={(e) => setAiInput(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleAIChat()}
                placeholder="Süreci geliştirmek için soru sorun..."
                className="input flex-1"
                disabled={aiLoading}
              />
              <button
                onClick={handleAIChat}
                disabled={aiLoading || !aiInput.trim()}
                className="btn-primary disabled:opacity-50"
              >
                <Send className="h-5 w-5" />
              </button>
            </div>

            <div className="mt-4 p-4 bg-blue-50 rounded-lg">
              <p className="text-sm text-blue-800">
                <strong>İpucu:</strong> AI asistanına süreç optimizasyonu, otomasyon önerileri veya adım iyileştirmeleri hakkında sorular sorabilirsiniz.
              </p>
            </div>
          </div>
        )}

        {/* History Tab */}
        {activeTab === 'history' && (
          <div className="space-y-4">
            <h2 className="text-2xl font-bold text-gray-900">Versiyon Geçmişi</h2>

            {process.versions && process.versions.length > 0 ? (
              <div className="space-y-3">
                {process.versions.map((version: any) => (
                  <div key={version.id} className="card">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="font-semibold text-gray-900">
                          Versiyon {version.version}
                        </h3>
                        <p className="text-sm text-gray-600 mt-1">
                          {new Date(version.createdAt).toLocaleDateString('tr-TR')}
                        </p>
                      </div>
                      <span className="px-3 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                        {version.version === process.currentVersion ? 'Aktif' : 'Eski'}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="card text-center py-12">
                <History className="h-16 w-16 mx-auto text-gray-400 mb-4" />
                <p className="text-gray-600">Henüz versiyon geçmişi yok</p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-75 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Süreci Sil</h3>
            <p className="text-gray-600 mb-6">
              Bu süreci silmek istediğinizden emin misiniz? Bu işlem geri alınamaz.
            </p>
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="btn-secondary"
                disabled={actionLoading === 'delete'}
              >
                İptal
              </button>
              <button
                onClick={handleDelete}
                disabled={actionLoading === 'delete'}
                className="bg-red-600 hover:bg-red-700 text-white font-medium py-2 px-4 rounded-lg transition-colors disabled:opacity-50"
              >
                {actionLoading === 'delete' ? 'Siliniyor...' : 'Sil'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* SOP Generation Result Modal */}
      {showSopModal && sopResult && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-75 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-3xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="bg-indigo-100 p-2 rounded-lg">
                  <FileText className="h-6 w-6 text-indigo-600" />
                </div>
                <div>
                  <h3 className="text-xl font-semibold text-gray-900">SOP Başarıyla Oluşturuldu!</h3>
                  <p className="text-sm text-gray-600 mt-1">
                    Versiyon {sopResult.version?.version || process.currentVersion} oluşturuldu
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowSopModal(false)}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X className="h-6 w-6" />
              </button>
            </div>

            <div className="bg-gradient-to-br from-indigo-50 to-purple-50 rounded-lg p-6 border-2 border-indigo-200">
              <h4 className="font-semibold text-gray-900 mb-3">Oluşturulan SOP İçeriği</h4>

              {sopResult.sop && (
                <div className="space-y-4">
                  {/* Process Info */}
                  <div className="bg-white rounded-lg p-4">
                    <h5 className="font-semibold text-gray-800 mb-2">Süreç Bilgileri</h5>
                    <p className="text-sm text-gray-700"><strong>Süreç Adı:</strong> {process.name}</p>
                    {process.description && (
                      <p className="text-sm text-gray-700 mt-1"><strong>Açıklama:</strong> {process.description}</p>
                    )}
                    {process.department && (
                      <p className="text-sm text-gray-700 mt-1"><strong>Departman:</strong> {process.department}</p>
                    )}
                  </div>

                  {/* SOP Steps */}
                  {sopResult.sop.steps && sopResult.sop.steps.length > 0 && (
                    <div className="bg-white rounded-lg p-4">
                      <h5 className="font-semibold text-gray-800 mb-3">SOP Adımları ({sopResult.sop.steps.length})</h5>
                      <div className="space-y-3">
                        {sopResult.sop.steps.map((step: any, index: number) => (
                          <div key={step.id || index} className="border-l-4 border-indigo-400 pl-4 py-2">
                            <h6 className="font-medium text-gray-900">
                              {index + 1}. {step.title}
                            </h6>
                            <p className="text-sm text-gray-700 mt-1">{step.description}</p>
                            {step.estimatedMinutes && (
                              <p className="text-xs text-gray-600 mt-1 flex items-center gap-1">
                                <Clock className="h-3 w-3" />
                                Tahmini süre: {step.estimatedMinutes} dakika
                              </p>
                            )}
                            {/* Sub-steps */}
                            {step.subSteps && step.subSteps.length > 0 && (
                              <div className="ml-4 mt-2 space-y-2">
                                {step.subSteps.map((subStep: any, subIndex: number) => (
                                  <div key={subStep.id || subIndex} className="border-l-2 border-green-300 pl-3 py-1">
                                    <p className="text-sm font-medium text-gray-800">
                                      {index + 1}.{subIndex + 1}. {subStep.title}
                                    </p>
                                    <p className="text-xs text-gray-600">{subStep.description}</p>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* AI Generated Content */}
                  {sopResult.sop.aiGeneratedContent && (
                    <div className="bg-white rounded-lg p-4">
                      <h5 className="font-semibold text-gray-800 mb-2">AI Önerileri</h5>
                      <p className="text-sm text-gray-700 whitespace-pre-wrap">{sopResult.sop.aiGeneratedContent}</p>
                    </div>
                  )}
                </div>
              )}

              <div className="mt-6 flex gap-3 justify-end">
                <button
                  onClick={() => setShowSopModal(false)}
                  className="btn-secondary"
                >
                  Kapat
                </button>
                <button
                  onClick={() => {
                    setShowSopModal(false);
                    setActiveTab('history');
                  }}
                  className="btn-primary flex items-center"
                >
                  <History className="h-4 w-4 mr-2" />
                  Versiyon Geçmişine Git
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
