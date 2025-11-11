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
  ListChecks,
  MessageSquare,
  FileText,
  Plus,
  History,
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

interface ProcessStep {
  id: string;
  order: number;
  title: string;
  description: string;
  estimatedMinutes?: number;
}

type TabType = 'overview' | 'steps' | 'ai-chat' | 'history';

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

  const handleAnalyze = async () => {
    try {
      setActionLoading('analyze');
      await api.analyzeProcess(params.id as string);
      alert('AI analizi başlatıldı. Bu işlem birkaç dakika sürebilir.');
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
            <>
              <Link
                href={`/dashboard/processes/${process.id}/edit`}
                className="btn-secondary flex items-center"
              >
                <Edit className="h-4 w-4 mr-2" />
                Düzenle
              </Link>
              <button
                onClick={() => setShowDeleteConfirm(true)}
                className="bg-red-100 text-red-700 hover:bg-red-200 font-medium py-2 px-4 rounded-lg transition-colors flex items-center"
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Sil
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
                        ₺{roi.monthlyCost.toFixed(2)}
                      </p>
                    </div>
                    <div className="bg-green-50 p-4 rounded-lg">
                      <p className="text-sm text-gray-600">Potansiyel Aylık Tasarruf</p>
                      <p className="text-2xl font-bold text-green-600">
                        ₺{roi.potentialMonthlySavings.toFixed(2)}
                      </p>
                    </div>
                    <div className="bg-purple-50 p-4 rounded-lg">
                      <p className="text-sm text-gray-600">ROI Yüzdesi</p>
                      <p className="text-2xl font-bold text-purple-600">
                        %{roi.roi.toFixed(1)}
                      </p>
                    </div>
                    <div className="bg-orange-50 p-4 rounded-lg">
                      <p className="text-sm text-gray-600">Geri Ödeme Süresi</p>
                      <p className="text-2xl font-bold text-orange-600">
                        {roi.paybackPeriod.toFixed(1)} ay
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

                  <button
                    onClick={handleAnalyze}
                    disabled={actionLoading === 'analyze'}
                    className="bg-purple-600 hover:bg-purple-700 text-white font-medium py-2 px-4 rounded-lg transition-colors flex items-center disabled:opacity-50"
                  >
                    <Bot className="h-4 w-4 mr-2" />
                    {actionLoading === 'analyze' ? 'Analiz Ediliyor...' : 'AI Analizi'}
                  </button>

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
              <div className="space-y-3">
                {steps.map((step, index) => (
                  <div key={step.id} className="card hover:shadow-lg transition-shadow">
                    <div className="flex items-start gap-4">
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
                            onClick={() => handleEditStep(step)}
                            className="text-gray-400 hover:text-primary-600"
                          >
                            <Edit className="h-5 w-5" />
                          </button>
                          <button
                            onClick={() => handleDeleteStep(step.id)}
                            className="text-gray-400 hover:text-red-600"
                          >
                            <Trash2 className="h-5 w-5" />
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
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
    </div>
  );
}
