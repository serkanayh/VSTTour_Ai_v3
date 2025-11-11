'use client';

import { useState, FormEvent } from 'react';
import { useRouter } from 'next/navigation';
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
  ArrowRight,
  Save,
  AlertCircle,
  Check,
  Plus,
  Trash2,
  ChevronDown,
  ChevronUp,
  GripVertical,
} from 'lucide-react';
import { api } from '@/lib/api';
import { ProcessStatus } from '@/lib/store';

interface Step {
  id: string;
  title: string;
  description: string;
  estimatedMinutes: string;
  subSteps: SubStep[];
}

interface SubStep {
  id: string;
  title: string;
  description: string;
  estimatedMinutes: string;
}

type WizardStep = 'basic' | 'metrics' | 'steps' | 'review';

interface SortableStepItemProps {
  step: Step;
  stepIndex: number;
  expandedSteps: Set<string>;
  onToggleExpand: (stepId: string) => void;
  onEdit: (index: number) => void;
  onDelete: (index: number) => void;
  onAddSubStep: (stepIndex: number) => void;
  onEditSubStep: (stepIndex: number, subStepIndex: number) => void;
  onDeleteSubStep: (stepIndex: number, subStepIndex: number) => void;
}

function SortableStepItem({
  step,
  stepIndex,
  expandedSteps,
  onToggleExpand,
  onEdit,
  onDelete,
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
    <div ref={setNodeRef} style={style} className="card bg-white border-2 border-blue-200">
      <div className="flex items-start gap-3">
        <button
          {...attributes}
          {...listeners}
          className="flex-shrink-0 cursor-grab active:cursor-grabbing text-gray-400 hover:text-gray-600 mt-1"
        >
          <GripVertical className="h-5 w-5" />
        </button>
        <div className="bg-blue-100 text-blue-800 font-semibold rounded-full w-8 h-8 flex items-center justify-center flex-shrink-0">
          {stepIndex + 1}
        </div>
        <div className="flex-1 min-w-0">
          <h4 className="font-semibold text-gray-900">{step.title}</h4>
          <p className="text-sm text-gray-600 mt-1">{step.description}</p>
          {step.estimatedMinutes && (
            <p className="text-xs text-gray-500 mt-1">
              Tahmini süre: {step.estimatedMinutes} dakika
            </p>
          )}

          {/* Sub-steps section */}
          {step.subSteps.length > 0 && (
            <div className="mt-3 ml-0">
              <button
                onClick={() => onToggleExpand(step.id)}
                className="flex items-center gap-2 text-sm font-medium text-green-700 hover:text-green-800 transition-colors"
              >
                {expandedSteps.has(step.id) ? (
                  <ChevronUp className="h-4 w-4" />
                ) : (
                  <ChevronDown className="h-4 w-4" />
                )}
                Alt Adımlar ({step.subSteps.length})
              </button>

              {expandedSteps.has(step.id) && (
                <div className="mt-2 space-y-2 ml-6">
                  {step.subSteps.map((subStep, subStepIndex) => (
                    <div
                      key={subStep.id}
                      className="bg-gray-50 rounded-lg p-3 border border-green-200"
                    >
                      <div className="flex items-start gap-2">
                        <div className="bg-green-100 text-green-800 text-xs font-semibold rounded px-2 py-1 flex-shrink-0">
                          {stepIndex + 1}.{subStepIndex + 1}
                        </div>
                        <div className="flex-1 min-w-0">
                          <h5 className="text-sm font-medium text-gray-900">{subStep.title}</h5>
                          <p className="text-xs text-gray-600 mt-0.5">{subStep.description}</p>
                          {subStep.estimatedMinutes && (
                            <p className="text-xs text-gray-500 mt-1">
                              {subStep.estimatedMinutes} dakika
                            </p>
                          )}
                        </div>
                        <div className="flex gap-1">
                          <button
                            onClick={() => onEditSubStep(stepIndex, subStepIndex)}
                            className="text-blue-600 hover:text-blue-800 p-1"
                            title="Düzenle"
                          >
                            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                            </svg>
                          </button>
                          <button
                            onClick={() => onDeleteSubStep(stepIndex, subStepIndex)}
                            className="text-red-600 hover:text-red-800 p-1"
                            title="Sil"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Add sub-step button */}
          <button
            onClick={() => onAddSubStep(stepIndex)}
            className="mt-2 text-sm text-green-600 hover:text-green-800 font-medium flex items-center gap-1"
          >
            <Plus className="h-3 w-3" />
            Alt Adım Ekle
          </button>
        </div>
        <div className="flex gap-1">
          <button
            onClick={() => onEdit(stepIndex)}
            className="text-blue-600 hover:text-blue-800 p-1"
            title="Düzenle"
          >
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
          </button>
          <button
            onClick={() => onDelete(stepIndex)}
            className="text-red-600 hover:text-red-800 p-1"
            title="Sil"
          >
            <Trash2 className="h-5 w-5" />
          </button>
        </div>
      </div>
    </div>
  );
}

export default function NewProcessPage() {
  const router = useRouter();

  // Wizard state
  const [currentStep, setCurrentStep] = useState<WizardStep>('basic');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // Form data
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    department: '',
    estimatedTimeMinutes: '',
    tasksPerDay: '',
    minutesPerTask: '',
    costPerHour: '',
  });

  // Process steps
  const [processSteps, setProcessSteps] = useState<Step[]>([]);
  const [expandedSteps, setExpandedSteps] = useState<Set<string>>(new Set());

  // Step form
  const [showStepForm, setShowStepForm] = useState(false);
  const [editingStepIndex, setEditingStepIndex] = useState<number | null>(null);
  const [stepFormData, setStepFormData] = useState({ title: '', description: '', estimatedMinutes: '' });

  // Sub-step form
  const [showSubStepForm, setShowSubStepForm] = useState(false);
  const [parentStepIndex, setParentStepIndex] = useState<number | null>(null);
  const [editingSubStepIndex, setEditingSubStepIndex] = useState<number | null>(null);
  const [subStepFormData, setSubStepFormData] = useState({ title: '', description: '', estimatedMinutes: '' });

  const steps: { id: WizardStep; title: string; description: string }[] = [
    { id: 'basic', title: 'Temel Bilgiler', description: 'Süreç adı ve departman' },
    { id: 'metrics', title: 'Süreç Metrikleri', description: 'ROI hesaplaması için' },
    { id: 'steps', title: 'Süreç Adımları', description: 'Ana ve alt adımlar' },
    { id: 'review', title: 'İnceleme', description: 'Son kontrol ve kaydet' },
  ];

  const currentStepIndex = steps.findIndex(s => s.id === currentStep);

  // Drag & Drop sensors
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (!over || active.id === over.id) {
      return;
    }

    const oldIndex = processSteps.findIndex((step) => step.id === active.id);
    const newIndex = processSteps.findIndex((step) => step.id === over.id);

    setProcessSteps(arrayMove(processSteps, oldIndex, newIndex));
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const validateBasicInfo = () => {
    if (!formData.name.trim()) {
      setError('Süreç adı zorunludur');
      return false;
    }
    setError('');
    return true;
  };

  const validateMetrics = () => {
    // Metrics are optional
    setError('');
    return true;
  };

  const handleNext = () => {
    if (currentStep === 'basic' && !validateBasicInfo()) return;
    if (currentStep === 'metrics' && !validateMetrics()) return;

    const nextIndex = currentStepIndex + 1;
    if (nextIndex < steps.length) {
      setCurrentStep(steps[nextIndex].id);
    }
  };

  const handlePrevious = () => {
    const prevIndex = currentStepIndex - 1;
    if (prevIndex >= 0) {
      setCurrentStep(steps[prevIndex].id);
    }
  };

  const handleAddStep = () => {
    if (!stepFormData.title || !stepFormData.description) {
      alert('Başlık ve açıklama zorunludur');
      return;
    }

    if (editingStepIndex !== null) {
      // Update existing step
      const updated = [...processSteps];
      updated[editingStepIndex] = {
        ...updated[editingStepIndex],
        title: stepFormData.title,
        description: stepFormData.description,
        estimatedMinutes: stepFormData.estimatedMinutes,
      };
      setProcessSteps(updated);
    } else {
      // Add new step
      const newStep: Step = {
        id: `step-${Date.now()}`,
        title: stepFormData.title,
        description: stepFormData.description,
        estimatedMinutes: stepFormData.estimatedMinutes,
        subSteps: [],
      };
      setProcessSteps([...processSteps, newStep]);
    }

    setStepFormData({ title: '', description: '', estimatedMinutes: '' });
    setShowStepForm(false);
    setEditingStepIndex(null);
  };

  const handleDeleteStep = (index: number) => {
    setProcessSteps(processSteps.filter((_, i) => i !== index));
  };

  const handleEditStep = (index: number) => {
    const step = processSteps[index];
    setStepFormData({
      title: step.title,
      description: step.description,
      estimatedMinutes: step.estimatedMinutes,
    });
    setEditingStepIndex(index);
    setShowStepForm(true);
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

  const handleAddSubStep = () => {
    if (!subStepFormData.title || !subStepFormData.description || parentStepIndex === null) {
      alert('Başlık ve açıklama zorunludur');
      return;
    }

    const updated = [...processSteps];

    if (editingSubStepIndex !== null) {
      // Update existing sub-step
      updated[parentStepIndex].subSteps[editingSubStepIndex] = {
        id: updated[parentStepIndex].subSteps[editingSubStepIndex].id,
        title: subStepFormData.title,
        description: subStepFormData.description,
        estimatedMinutes: subStepFormData.estimatedMinutes,
      };
    } else {
      // Add new sub-step
      const newSubStep: SubStep = {
        id: `substep-${Date.now()}`,
        title: subStepFormData.title,
        description: subStepFormData.description,
        estimatedMinutes: subStepFormData.estimatedMinutes,
      };
      updated[parentStepIndex].subSteps.push(newSubStep);
    }

    setProcessSteps(updated);
    setSubStepFormData({ title: '', description: '', estimatedMinutes: '' });
    setShowSubStepForm(false);
    setEditingSubStepIndex(null);
  };

  const handleDeleteSubStep = (stepIndex: number, subStepIndex: number) => {
    const updated = [...processSteps];
    updated[stepIndex].subSteps = updated[stepIndex].subSteps.filter((_, i) => i !== subStepIndex);
    setProcessSteps(updated);
  };

  const handleEditSubStep = (stepIndex: number, subStepIndex: number) => {
    const subStep = processSteps[stepIndex].subSteps[subStepIndex];
    setSubStepFormData({
      title: subStep.title,
      description: subStep.description,
      estimatedMinutes: subStep.estimatedMinutes,
    });
    setParentStepIndex(stepIndex);
    setEditingSubStepIndex(subStepIndex);
    setShowSubStepForm(true);
  };

  const handleSubmit = async () => {
    if (!validateBasicInfo()) {
      setCurrentStep('basic');
      return;
    }

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

      // Add steps if any
      for (const step of processSteps) {
        const stepData = {
          title: step.title,
          description: step.description,
          estimatedMinutes: step.estimatedMinutes ? parseInt(step.estimatedMinutes) : undefined,
        };
        const createdStep = await api.addProcessStep(newProcess.id, stepData);

        // Add sub-steps if any
        for (const subStep of step.subSteps) {
          const subStepData = {
            title: subStep.title,
            description: subStep.description,
            estimatedMinutes: subStep.estimatedMinutes ? parseInt(subStep.estimatedMinutes) : undefined,
          };
          await api.addSubStep(newProcess.id, createdStep.step.id, subStepData);
        }
      }

      router.push(`/dashboard/processes/${newProcess.id}`);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to create process');
      setCurrentStep('basic');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href="/dashboard/processes" className="text-gray-600 hover:text-gray-900">
          <ArrowLeft className="h-6 w-6" />
        </Link>
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Yeni Süreç Oluştur</h1>
          <p className="text-gray-600 mt-1">
            İş sürecinizi adım adım oluşturun
          </p>
        </div>
      </div>

      {/* Progress Indicator */}
      <div className="card">
        <div className="flex items-center justify-between">
          {steps.map((step, index) => (
            <div key={step.id} className="flex items-center flex-1">
              <div className="flex flex-col items-center flex-1">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold transition-all ${
                  index < currentStepIndex ? 'bg-green-500 text-white' :
                  index === currentStepIndex ? 'bg-blue-600 text-white' :
                  'bg-gray-200 text-gray-600'
                }`}>
                  {index < currentStepIndex ? <Check className="h-5 w-5" /> : index + 1}
                </div>
                <div className="mt-2 text-center">
                  <div className={`text-sm font-medium ${
                    index === currentStepIndex ? 'text-blue-600' : 'text-gray-600'
                  }`}>
                    {step.title}
                  </div>
                  <div className="text-xs text-gray-500">{step.description}</div>
                </div>
              </div>
              {index < steps.length - 1 && (
                <div className={`h-1 w-full mx-2 -mt-12 transition-all ${
                  index < currentStepIndex ? 'bg-green-500' : 'bg-gray-200'
                }`} />
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start gap-3">
          <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
          <div className="text-sm text-red-800">{error}</div>
        </div>
      )}

      {/* Step Content */}
      <div className="card">
        {/* Step 1: Basic Information */}
        {currentStep === 'basic' && (
          <div className="space-y-4">
            <h2 className="text-xl font-semibold text-gray-900">Temel Bilgiler</h2>

            <div>
              <label htmlFor="name" className="label">
                Süreç Adı *
              </label>
              <input
                id="name"
                name="name"
                type="text"
                value={formData.name}
                onChange={handleChange}
                className="input"
                placeholder="örn: Fatura İşlemleri"
                required
              />
            </div>

            <div>
              <label htmlFor="description" className="label">
                Açıklama
              </label>
              <textarea
                id="description"
                name="description"
                value={formData.description}
                onChange={handleChange}
                className="input min-h-[120px] resize-y"
                placeholder="Süreci detaylı olarak açıklayın..."
              />
            </div>

            <div>
              <label htmlFor="department" className="label">
                Departman
              </label>
              <input
                id="department"
                name="department"
                type="text"
                value={formData.department}
                onChange={handleChange}
                className="input"
                placeholder="örn: Finans, IT, Satış"
              />
            </div>
          </div>
        )}

        {/* Step 2: Process Metrics */}
        {currentStep === 'metrics' && (
          <div className="space-y-4">
            <div>
              <h2 className="text-xl font-semibold text-gray-900 mb-2">
                Süreç Metrikleri
              </h2>
              <p className="text-sm text-gray-600">
                Bu metrikler opsiyoneldir ancak ROI ve potansiyel tasarruf hesaplamalarına yardımcı olur
              </p>
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="estimatedTimeMinutes" className="label">
                  Tahmini Süre (dakika)
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
                />
              </div>

              <div>
                <label htmlFor="tasksPerDay" className="label">
                  Günlük İşlem Sayısı
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
                />
              </div>

              <div>
                <label htmlFor="minutesPerTask" className="label">
                  İşlem Başına Süre (dakika)
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
                />
              </div>

              <div>
                <label htmlFor="costPerHour" className="label">
                  Saat Başı Maliyet ($)
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
                />
              </div>
            </div>

            {/* ROI Calculation Info */}
            {formData.tasksPerDay &&
              formData.minutesPerTask &&
              formData.costPerHour && (
                <div className="mt-4 p-4 bg-blue-50 rounded-lg">
                  <p className="text-sm text-blue-900 font-medium mb-2">
                    Tahmini Metrikler:
                  </p>
                  <div className="grid grid-cols-2 gap-2 text-sm text-blue-800">
                    <div>
                      Günlük saat:{' '}
                      {(
                        (parseInt(formData.tasksPerDay) *
                          parseInt(formData.minutesPerTask)) /
                        60
                      ).toFixed(2)}
                    </div>
                    <div>
                      Günlük maliyet: $
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
        )}

        {/* Step 3: Process Steps */}
        {currentStep === 'steps' && (
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <div>
                <h2 className="text-xl font-semibold text-gray-900">Süreç Adımları</h2>
                <p className="text-sm text-gray-600 mt-1">
                  Süreç adımlarını ve alt adımlarını tanımlayın
                </p>
              </div>
              <button
                onClick={() => {
                  setEditingStepIndex(null);
                  setStepFormData({ title: '', description: '', estimatedMinutes: '' });
                  setShowStepForm(true);
                }}
                className="btn-primary flex items-center"
              >
                <Plus className="h-4 w-4 mr-2" />
                Yeni Adım
              </button>
            </div>

            {/* Step Form */}
            {showStepForm && (
              <div className="card bg-blue-50 border-2 border-blue-200">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  {editingStepIndex !== null ? 'Adımı Düzenle' : 'Yeni Adım Ekle'}
                </h3>
                <div className="space-y-4">
                  <div>
                    <label className="label">Başlık *</label>
                    <input
                      type="text"
                      value={stepFormData.title}
                      onChange={(e) => setStepFormData({ ...stepFormData, title: e.target.value })}
                      className="input"
                      placeholder="Adım başlığı"
                    />
                  </div>
                  <div>
                    <label className="label">Açıklama *</label>
                    <textarea
                      value={stepFormData.description}
                      onChange={(e) => setStepFormData({ ...stepFormData, description: e.target.value })}
                      className="input min-h-[80px]"
                      placeholder="Adım açıklaması"
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
                    />
                  </div>
                  <div className="flex gap-3 justify-end">
                    <button
                      onClick={() => {
                        setShowStepForm(false);
                        setEditingStepIndex(null);
                        setStepFormData({ title: '', description: '', estimatedMinutes: '' });
                      }}
                      className="btn-secondary"
                    >
                      İptal
                    </button>
                    <button
                      onClick={handleAddStep}
                      className="btn-primary"
                    >
                      {editingStepIndex !== null ? 'Güncelle' : 'Ekle'}
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Sub-step Form */}
            {showSubStepForm && (
              <div className="card bg-green-50 border-2 border-green-200">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  {editingSubStepIndex !== null ? 'Alt Adımı Düzenle' : 'Yeni Alt Adım Ekle'}
                </h3>
                <div className="space-y-4">
                  <div>
                    <label className="label">Başlık *</label>
                    <input
                      type="text"
                      value={subStepFormData.title}
                      onChange={(e) => setSubStepFormData({ ...subStepFormData, title: e.target.value })}
                      className="input"
                      placeholder="Alt adım başlığı"
                    />
                  </div>
                  <div>
                    <label className="label">Açıklama *</label>
                    <textarea
                      value={subStepFormData.description}
                      onChange={(e) => setSubStepFormData({ ...subStepFormData, description: e.target.value })}
                      className="input min-h-[80px]"
                      placeholder="Alt adım açıklaması"
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
                    />
                  </div>
                  <div className="flex gap-3 justify-end">
                    <button
                      onClick={() => {
                        setShowSubStepForm(false);
                        setEditingSubStepIndex(null);
                        setSubStepFormData({ title: '', description: '', estimatedMinutes: '' });
                      }}
                      className="btn-secondary"
                    >
                      İptal
                    </button>
                    <button
                      onClick={handleAddSubStep}
                      className="btn-primary"
                    >
                      {editingSubStepIndex !== null ? 'Güncelle' : 'Ekle'}
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Steps List */}
            {processSteps.length === 0 ? (
              <div className="text-center py-12 bg-gray-50 rounded-lg">
                <p className="text-gray-600">Henüz adım eklenmedi</p>
                <p className="text-sm text-gray-500 mt-1">Yukarıdaki butonu kullanarak yeni adım ekleyin</p>
              </div>
            ) : (
              <DndContext
                sensors={sensors}
                collisionDetection={closestCenter}
                onDragEnd={handleDragEnd}
              >
                <SortableContext
                  items={processSteps.map(s => s.id)}
                  strategy={verticalListSortingStrategy}
                >
                  <div className="space-y-3">
                    {processSteps.map((step, stepIndex) => (
                      <SortableStepItem
                        key={step.id}
                        step={step}
                        stepIndex={stepIndex}
                        expandedSteps={expandedSteps}
                        onToggleExpand={toggleStepExpansion}
                        onEdit={handleEditStep}
                        onDelete={handleDeleteStep}
                        onAddSubStep={(index) => {
                          setParentStepIndex(index);
                          setEditingSubStepIndex(null);
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

        {/* Step 4: Review */}
        {currentStep === 'review' && (
          <div className="space-y-6">
            <h2 className="text-xl font-semibold text-gray-900">İnceleme ve Kaydet</h2>

            {/* Basic Info Review */}
            <div className="bg-gray-50 rounded-lg p-4">
              <h3 className="font-semibold text-gray-900 mb-3">Temel Bilgiler</h3>
              <dl className="space-y-2">
                <div>
                  <dt className="text-sm font-medium text-gray-600">Süreç Adı:</dt>
                  <dd className="text-sm text-gray-900">{formData.name}</dd>
                </div>
                {formData.description && (
                  <div>
                    <dt className="text-sm font-medium text-gray-600">Açıklama:</dt>
                    <dd className="text-sm text-gray-900">{formData.description}</dd>
                  </div>
                )}
                {formData.department && (
                  <div>
                    <dt className="text-sm font-medium text-gray-600">Departman:</dt>
                    <dd className="text-sm text-gray-900">{formData.department}</dd>
                  </div>
                )}
              </dl>
            </div>

            {/* Metrics Review */}
            {(formData.tasksPerDay || formData.minutesPerTask || formData.costPerHour) && (
              <div className="bg-gray-50 rounded-lg p-4">
                <h3 className="font-semibold text-gray-900 mb-3">Süreç Metrikleri</h3>
                <dl className="grid grid-cols-2 gap-3">
                  {formData.estimatedTimeMinutes && (
                    <div>
                      <dt className="text-sm font-medium text-gray-600">Tahmini Süre:</dt>
                      <dd className="text-sm text-gray-900">{formData.estimatedTimeMinutes} dakika</dd>
                    </div>
                  )}
                  {formData.tasksPerDay && (
                    <div>
                      <dt className="text-sm font-medium text-gray-600">Günlük İşlem:</dt>
                      <dd className="text-sm text-gray-900">{formData.tasksPerDay}</dd>
                    </div>
                  )}
                  {formData.minutesPerTask && (
                    <div>
                      <dt className="text-sm font-medium text-gray-600">İşlem Süresi:</dt>
                      <dd className="text-sm text-gray-900">{formData.minutesPerTask} dakika</dd>
                    </div>
                  )}
                  {formData.costPerHour && (
                    <div>
                      <dt className="text-sm font-medium text-gray-600">Saat Başı Maliyet:</dt>
                      <dd className="text-sm text-gray-900">${formData.costPerHour}</dd>
                    </div>
                  )}
                </dl>
              </div>
            )}

            {/* Steps Review */}
            <div className="bg-gray-50 rounded-lg p-4">
              <h3 className="font-semibold text-gray-900 mb-3">
                Süreç Adımları ({processSteps.length})
              </h3>
              {processSteps.length === 0 ? (
                <p className="text-sm text-gray-600">Henüz adım eklenmedi</p>
              ) : (
                <div className="space-y-2">
                  {processSteps.map((step, index) => (
                    <div key={step.id} className="text-sm">
                      <div className="font-medium text-gray-900">
                        {index + 1}. {step.title}
                        {step.subSteps.length > 0 && (
                          <span className="text-gray-600 font-normal ml-2">
                            ({step.subSteps.length} alt adım)
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <p className="text-sm text-blue-800">
                <strong>Not:</strong> Süreci oluşturduktan sonra AI analizi ile adımları optimize edebilir
                ve eksik kısımları tespit edebilirsiniz.
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Navigation Buttons */}
      <div className="flex justify-between items-center">
        <div>
          {currentStepIndex > 0 && (
            <button
              onClick={handlePrevious}
              disabled={isLoading}
              className="btn-secondary flex items-center disabled:opacity-50"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Önceki
            </button>
          )}
        </div>

        <div className="flex gap-3">
          <Link href="/dashboard/processes" className="btn-secondary">
            İptal
          </Link>

          {currentStepIndex < steps.length - 1 ? (
            <button
              onClick={handleNext}
              disabled={isLoading}
              className="btn-primary flex items-center disabled:opacity-50"
            >
              Sonraki
              <ArrowRight className="h-4 w-4 ml-2" />
            </button>
          ) : (
            <button
              onClick={handleSubmit}
              disabled={isLoading}
              className="btn-primary flex items-center disabled:opacity-50"
            >
              <Save className="h-4 w-4 mr-2" />
              {isLoading ? 'Oluşturuluyor...' : 'Süreci Oluştur'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
