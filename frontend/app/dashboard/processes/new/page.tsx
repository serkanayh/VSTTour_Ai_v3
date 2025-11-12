'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowLeft,
  Send,
  Loader2,
  CheckCircle2,
  AlertCircle,
  MessageSquare,
  Edit,
  Save,
} from 'lucide-react';
import { api } from '@/lib/api';

type Phase = 'form' | 'chat' | 'review';

interface Message {
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: Date;
}

interface ProcessStep {
  title: string;
  description: string;
  order: number;
  estimatedMinutes?: number;
  subSteps?: ProcessSubStep[];
}

interface ProcessSubStep {
  title: string;
  description: string;
  order: number;
  estimatedMinutes?: number;
}

export default function NewProcessPage() {
  const router = useRouter();

  // Phase management
  const [currentPhase, setCurrentPhase] = useState<Phase>('form');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // Form data
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    department: '',
  });

  // Process and chat data
  const [processId, setProcessId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [userInput, setUserInput] = useState('');
  const [isChatComplete, setIsChatComplete] = useState(false);

  // Generated steps
  const [generatedSteps, setGeneratedSteps] = useState<ProcessStep[]>([]);
  const [editingStepIndex, setEditingStepIndex] = useState<number | null>(null);

  const chatEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Auto-scroll chat to bottom
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Focus input after assistant responds
  useEffect(() => {
    if (currentPhase === 'chat' && !isLoading) {
      inputRef.current?.focus();
    }
  }, [isLoading, currentPhase]);

  const handleFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name.trim()) {
      setError('Süreç adı zorunludur');
      return;
    }

    setError('');
    setIsLoading(true);

    try {
      // Start AI process conversation
      const response = await api.startAIProcess({
        processName: formData.name,
        description: formData.description || undefined,
        // Note: departmentId should be a UUID, not a text. For now, we'll omit it.
        // In the future, this should be a dropdown with actual department IDs
        departmentId: undefined,
      });

      setProcessId(response.processId);

      // Add initial AI message
      setMessages([
        {
          role: 'assistant',
          content: response.aiPrompt || `Merhaba! "${formData.name}" sürecini birlikte oluşturalım. Lütfen bu sürecin nasıl işlediğini detaylı bir şekilde anlatır mısınız? Hangi adımları içeriyor?`,
          timestamp: new Date(),
        },
      ]);

      setCurrentPhase('chat');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Süreç başlatılamadı');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSendMessage = async () => {
    if (!userInput.trim() || !processId || isLoading) return;

    const userMessage: Message = {
      role: 'user',
      content: userInput.trim(),
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setUserInput('');
    setIsLoading(true);
    setError('');

    try {
      const response = await api.sendAIMessage({
        processId,
        userMessage: userMessage.content,
        conversationHistory: messages.map(m => ({ role: m.role, content: m.content })),
      });

      const assistantMessage: Message = {
        role: 'assistant',
        content: response.response,
        timestamp: new Date(),
      };

      setMessages(prev => [...prev, assistantMessage]);

      // Check if conversation is complete
      if (response.isComplete || response.structuredData) {
        setIsChatComplete(true);

        // Add completion message
        setTimeout(() => {
          setMessages(prev => [
            ...prev,
            {
              role: 'system',
              content: '✅ Harika! Yeterli bilgi toplandı. Şimdi adımları oluşturuyorum...',
              timestamp: new Date(),
            },
          ]);

          // Generate steps automatically
          setTimeout(() => generateStepsFromConversation(), 2000);
        }, 500);
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Mesaj gönderilemedi');
    } finally {
      setIsLoading(false);
    }
  };

  const generateStepsFromConversation = async () => {
    if (!processId) return;

    setIsLoading(true);
    try {
      // Call backend to extract and create steps from conversation
      const response = await api.generateStepsFromConversation(
        processId,
        messages.map(m => ({ role: m.role, content: m.content }))
      );

      setGeneratedSteps(response.steps || []);
      setCurrentPhase('review');

      setMessages(prev => [
        ...prev,
        {
          role: 'system',
          content: `✨ ${response.steps?.length || 0} adım başarıyla oluşturuldu! Lütfen kontrol edin.`,
          timestamp: new Date(),
        },
      ]);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Adımlar oluşturulamadı');
      setIsChatComplete(false);
    } finally {
      setIsLoading(false);
    }
  };

  const handleEditStep = (index: number) => {
    setEditingStepIndex(index);
  };

  const handleUpdateStep = (index: number, field: string, value: string) => {
    const updated = [...generatedSteps];
    updated[index] = { ...updated[index], [field]: value };
    setGeneratedSteps(updated);
  };

  const handleSubmitForApproval = async () => {
    if (!processId) return;

    setIsLoading(true);
    setError('');

    try {
      // Update process with final steps and submit for approval
      await api.submitForApproval(processId, generatedSteps);

      router.push(`/dashboard/processes/${processId}`);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Onaya gönderilemedi');
    } finally {
      setIsLoading(false);
    }
  };

  const renderPhaseIndicator = () => {
    const phases = [
      { id: 'form', label: 'Temel Bilgiler' },
      { id: 'chat', label: 'AI ile Detaylandırma' },
      { id: 'review', label: 'İnceleme ve Onay' },
    ];

    return (
      <div className="flex items-center justify-between mb-8">
        {phases.map((phase, index) => (
          <div key={phase.id} className="flex items-center flex-1">
            <div className="flex flex-col items-center flex-1">
              <div
                className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold transition-all ${
                  phases.findIndex(p => p.id === currentPhase) > index
                    ? 'bg-green-500 text-white'
                    : phases.findIndex(p => p.id === currentPhase) === index
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-200 text-gray-600'
                }`}
              >
                {phases.findIndex(p => p.id === currentPhase) > index ? (
                  <CheckCircle2 className="h-5 w-5" />
                ) : (
                  index + 1
                )}
              </div>
              <div className="mt-2 text-center">
                <div
                  className={`text-sm font-medium ${
                    phases.findIndex(p => p.id === currentPhase) === index
                      ? 'text-blue-600'
                      : 'text-gray-600'
                  }`}
                >
                  {phase.label}
                </div>
              </div>
            </div>
            {index < phases.length - 1 && (
              <div
                className={`h-1 w-full mx-2 -mt-12 transition-all ${
                  phases.findIndex(p => p.id === currentPhase) > index
                    ? 'bg-green-500'
                    : 'bg-gray-200'
                }`}
              />
            )}
          </div>
        ))}
      </div>
    );
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6 pb-8">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href="/dashboard/processes" className="text-gray-600 hover:text-gray-900">
          <ArrowLeft className="h-6 w-6" />
        </Link>
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Yeni Süreç Oluştur</h1>
          <p className="text-gray-600 mt-1">
            AI asistanı ile sürecinizi adım adım oluşturun
          </p>
        </div>
      </div>

      {/* Phase Indicator */}
      <div className="card">
        {renderPhaseIndicator()}
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start gap-3">
          <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
          <div className="text-sm text-red-800">{error}</div>
        </div>
      )}

      {/* Phase 1: Form */}
      {currentPhase === 'form' && (
        <div className="card">
          <form onSubmit={handleFormSubmit} className="space-y-4">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              Önce temel bilgileri girelim
            </h2>

            <div>
              <label htmlFor="name" className="label">
                Süreç Adı *
              </label>
              <input
                id="name"
                name="name"
                type="text"
                value={formData.name}
                onChange={handleFormChange}
                className="input"
                placeholder="örn: Fatura Onay Süreci"
                required
                autoFocus
              />
            </div>

            <div>
              <label htmlFor="description" className="label">
                Kısa Açıklama
              </label>
              <textarea
                id="description"
                name="description"
                value={formData.description}
                onChange={handleFormChange}
                className="input min-h-[100px] resize-y"
                placeholder="Sürecin genel amacını kısaca açıklayın..."
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
                onChange={handleFormChange}
                className="input"
                placeholder="örn: Finans, Muhasebe, İnsan Kaynakları"
              />
            </div>

            <div className="flex justify-end gap-3 pt-4">
              <Link href="/dashboard/processes" className="btn-secondary">
                İptal
              </Link>
              <button
                type="submit"
                disabled={isLoading}
                className="btn-primary flex items-center disabled:opacity-50"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Başlatılıyor...
                  </>
                ) : (
                  <>
                    <MessageSquare className="h-4 w-4 mr-2" />
                    AI ile Devam Et
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Phase 2: AI Chat */}
      {currentPhase === 'chat' && (
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-gray-900">
              AI Asistanı ile Konuşma
            </h2>
            {isChatComplete && (
              <span className="text-sm text-green-600 font-medium flex items-center gap-1">
                <CheckCircle2 className="h-4 w-4" />
                Tamamlandı
              </span>
            )}
          </div>

          {/* Chat Messages */}
          <div className="bg-gray-50 rounded-lg p-4 h-[500px] overflow-y-auto mb-4 space-y-4">
            {messages.map((message, index) => (
              <div
                key={index}
                className={`flex ${
                  message.role === 'user' ? 'justify-end' : 'justify-start'
                }`}
              >
                <div
                  className={`max-w-[80%] rounded-lg p-3 ${
                    message.role === 'user'
                      ? 'bg-blue-600 text-white'
                      : message.role === 'system'
                      ? 'bg-green-100 text-green-800 border border-green-200'
                      : 'bg-white text-gray-900 border border-gray-200'
                  }`}
                >
                  <div className="text-sm whitespace-pre-wrap">{message.content}</div>
                  <div
                    className={`text-xs mt-1 ${
                      message.role === 'user'
                        ? 'text-blue-200'
                        : 'text-gray-500'
                    }`}
                  >
                    {message.timestamp.toLocaleTimeString('tr-TR', {
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </div>
                </div>
              </div>
            ))}

            {isLoading && (
              <div className="flex justify-start">
                <div className="bg-white text-gray-900 border border-gray-200 rounded-lg p-3">
                  <Loader2 className="h-5 w-5 animate-spin text-blue-600" />
                </div>
              </div>
            )}

            <div ref={chatEndRef} />
          </div>

          {/* Chat Input */}
          {!isChatComplete && (
            <div className="space-y-3">
              <div className="flex gap-2">
                <input
                  ref={inputRef}
                  type="text"
                  value={userInput}
                  onChange={(e) => setUserInput(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                  placeholder="Mesajınızı yazın..."
                  className="input flex-1"
                  disabled={isLoading}
                />
                <button
                  onClick={handleSendMessage}
                  disabled={!userInput.trim() || isLoading}
                  className="btn-primary px-4 disabled:opacity-50"
                >
                  <Send className="h-5 w-5" />
                </button>
              </div>

              {/* Manual complete button */}
              {messages.length >= 4 && (
                <div className="border-t pt-3">
                  <button
                    onClick={() => {
                      setIsChatComplete(true);
                      setTimeout(() => {
                        setMessages(prev => [
                          ...prev,
                          {
                            role: 'system',
                            content: '✅ Harika! Yeterli bilgi toplandı. Şimdi adımları oluşturuyorum...',
                            timestamp: new Date(),
                          },
                        ]);
                        setTimeout(() => generateStepsFromConversation(), 2000);
                      }, 500);
                    }}
                    disabled={isLoading}
                    className="w-full btn-primary bg-green-600 hover:bg-green-700 disabled:opacity-50"
                  >
                    <CheckCircle2 className="h-5 w-5 mr-2" />
                    Konuşma Tamamlandı - Adımları Oluştur
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Phase 3: Review */}
      {currentPhase === 'review' && (
        <div className="space-y-6">
          <div className="card">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              Oluşturulan Adımları İnceleyin
            </h2>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
              <p className="text-sm text-blue-800">
                AI asistanı konuşmanıza dayanarak {generatedSteps.length} adım oluşturdu.
                İsterseniz düzenleyebilir veya doğrudan onaya gönderebilirsiniz.
              </p>
            </div>

            {/* Generated Steps */}
            <div className="space-y-4">
              {generatedSteps.map((step, index) => (
                <div key={index} className="bg-white border-2 border-gray-200 rounded-lg p-4">
                  <div className="flex items-start gap-3">
                    <div className="bg-blue-100 text-blue-800 font-semibold rounded-full w-8 h-8 flex items-center justify-center flex-shrink-0">
                      {index + 1}
                    </div>
                    <div className="flex-1">
                      {editingStepIndex === index ? (
                        <div className="space-y-3">
                          <input
                            type="text"
                            value={step.title}
                            onChange={(e) =>
                              handleUpdateStep(index, 'title', e.target.value)
                            }
                            className="input"
                            placeholder="Adım başlığı"
                          />
                          <textarea
                            value={step.description}
                            onChange={(e) =>
                              handleUpdateStep(index, 'description', e.target.value)
                            }
                            className="input min-h-[80px]"
                            placeholder="Adım açıklaması"
                          />
                          <button
                            onClick={() => setEditingStepIndex(null)}
                            className="btn-primary text-sm"
                          >
                            Tamam
                          </button>
                        </div>
                      ) : (
                        <>
                          <h4 className="font-semibold text-gray-900">{step.title}</h4>
                          <p className="text-sm text-gray-600 mt-1">{step.description}</p>

                          {/* Sub-steps */}
                          {step.subSteps && step.subSteps.length > 0 && (
                            <div className="mt-3 ml-4 space-y-2">
                              {step.subSteps.map((subStep, subIndex) => (
                                <div
                                  key={subIndex}
                                  className="bg-gray-50 rounded-lg p-3 border border-gray-200"
                                >
                                  <div className="flex items-start gap-2">
                                    <div className="bg-green-100 text-green-800 text-xs font-semibold rounded px-2 py-1">
                                      {index + 1}.{subIndex + 1}
                                    </div>
                                    <div>
                                      <h5 className="text-sm font-medium text-gray-900">
                                        {subStep.title}
                                      </h5>
                                      <p className="text-xs text-gray-600 mt-0.5">
                                        {subStep.description}
                                      </p>
                                    </div>
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}
                        </>
                      )}
                    </div>
                    {editingStepIndex !== index && (
                      <button
                        onClick={() => handleEditStep(index)}
                        className="text-blue-600 hover:text-blue-800 p-1"
                        title="Düzenle"
                      >
                        <Edit className="h-5 w-5" />
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-3">
            <button
              onClick={() => setCurrentPhase('chat')}
              className="btn-secondary"
              disabled={isLoading}
            >
              Konuşmaya Dön
            </button>
            <button
              onClick={handleSubmitForApproval}
              disabled={isLoading || generatedSteps.length === 0}
              className="btn-primary flex items-center disabled:opacity-50"
            >
              {isLoading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Gönderiliyor...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  Onaya Gönder
                </>
              )}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
