'use client';

import { useEffect, useState } from 'react';
import { Settings, Plus, Edit, Trash2, Activity, Key } from 'lucide-react';
import { api } from '@/lib/api';

interface AIConfig {
  id: string;
  name: string;
  provider: string;
  model: string;
  isActive: boolean;
  maxTokens?: number;
  temperature?: number;
  createdAt: string;
}

export default function AdminPage() {
  const [configs, setConfigs] = useState<AIConfig[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingConfig, setEditingConfig] = useState<AIConfig | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    provider: 'openai',
    model: 'gpt-4',
    apiKey: '',
    maxTokens: '2000',
    temperature: '0.7',
  });

  useEffect(() => {
    loadConfigs();
  }, []);

  const loadConfigs = async () => {
    try {
      setIsLoading(true);
      const data = await api.getAIConfigurations();
      setConfigs(data);
    } catch (error) {
      console.error('Failed to load configurations:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const configData = {
        name: formData.name,
        provider: formData.provider,
        model: formData.model,
        apiKey: formData.apiKey,
        maxTokens: parseInt(formData.maxTokens),
        temperature: parseFloat(formData.temperature),
      };

      if (editingConfig) {
        await api.updateAIConfiguration(editingConfig.id, configData);
      } else {
        await api.createAIConfiguration(configData);
      }

      await loadConfigs();
      setShowForm(false);
      setEditingConfig(null);
      resetForm();
    } catch (error) {
      console.error('Failed to save configuration:', error);
      alert('Failed to save configuration');
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      provider: 'openai',
      model: 'gpt-4',
      apiKey: '',
      maxTokens: '2000',
      temperature: '0.7',
    });
  };

  const handleEdit = (config: AIConfig) => {
    setEditingConfig(config);
    setFormData({
      name: config.name,
      provider: config.provider,
      model: config.model,
      apiKey: '',
      maxTokens: config.maxTokens?.toString() || '2000',
      temperature: config.temperature?.toString() || '0.7',
    });
    setShowForm(true);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Admin Panel</h1>
          <p className="text-gray-600 mt-1">
            Manage AI configurations and system settings
          </p>
        </div>
        <button
          onClick={() => {
            setShowForm(true);
            setEditingConfig(null);
            resetForm();
          }}
          className="btn-primary flex items-center"
        >
          <Plus className="h-5 w-5 mr-2" />
          New Configuration
        </button>
      </div>

      {/* Stats */}
      <div className="grid md:grid-cols-3 gap-6">
        <div className="card">
          <div className="flex items-center gap-3">
            <div className="bg-primary-100 p-3 rounded-lg">
              <Settings className="h-6 w-6 text-primary-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Total Configs</p>
              <p className="text-2xl font-bold text-gray-900">
                {isLoading ? '...' : configs.length}
              </p>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="flex items-center gap-3">
            <div className="bg-green-100 p-3 rounded-lg">
              <Activity className="h-6 w-6 text-green-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Active</p>
              <p className="text-2xl font-bold text-gray-900">
                {isLoading ? '...' : configs.filter((c) => c.isActive).length}
              </p>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="flex items-center gap-3">
            <div className="bg-purple-100 p-3 rounded-lg">
              <Key className="h-6 w-6 text-purple-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Providers</p>
              <p className="text-2xl font-bold text-gray-900">
                {isLoading
                  ? '...'
                  : new Set(configs.map((c) => c.provider)).size}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Configuration Form */}
      {showForm && (
        <div className="card bg-gray-50">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">
            {editingConfig ? 'Edit Configuration' : 'New AI Configuration'}
          </h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="label">Configuration Name *</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  className="input"
                  placeholder="Production GPT-4"
                  required
                />
              </div>

              <div>
                <label className="label">Provider *</label>
                <select
                  value={formData.provider}
                  onChange={(e) =>
                    setFormData({ ...formData, provider: e.target.value })
                  }
                  className="input"
                  required
                >
                  <option value="openai">OpenAI</option>
                  <option value="anthropic">Anthropic</option>
                  <option value="azure">Azure OpenAI</option>
                </select>
              </div>

              <div>
                <label className="label">Model *</label>
                <input
                  type="text"
                  value={formData.model}
                  onChange={(e) =>
                    setFormData({ ...formData, model: e.target.value })
                  }
                  className="input"
                  placeholder="gpt-4"
                  required
                />
              </div>

              <div>
                <label className="label">API Key *</label>
                <input
                  type="password"
                  value={formData.apiKey}
                  onChange={(e) =>
                    setFormData({ ...formData, apiKey: e.target.value })
                  }
                  className="input"
                  placeholder={editingConfig ? 'Leave blank to keep current' : 'sk-...'}
                  required={!editingConfig}
                />
              </div>

              <div>
                <label className="label">Max Tokens</label>
                <input
                  type="number"
                  value={formData.maxTokens}
                  onChange={(e) =>
                    setFormData({ ...formData, maxTokens: e.target.value })
                  }
                  className="input"
                  min="1"
                  max="32000"
                />
              </div>

              <div>
                <label className="label">Temperature</label>
                <input
                  type="number"
                  value={formData.temperature}
                  onChange={(e) =>
                    setFormData({ ...formData, temperature: e.target.value })
                  }
                  className="input"
                  min="0"
                  max="2"
                  step="0.1"
                />
              </div>
            </div>

            <div className="flex gap-3">
              <button type="submit" className="btn-primary">
                {editingConfig ? 'Update' : 'Create'} Configuration
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowForm(false);
                  setEditingConfig(null);
                  resetForm();
                }}
                className="btn-secondary"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Configurations List */}
      <div className="card">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">
          AI Configurations
        </h2>

        {isLoading ? (
          <div className="text-center py-8">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
          </div>
        ) : configs.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <Settings className="h-12 w-12 mx-auto mb-3 text-gray-400" />
            <p>No configurations yet. Create your first one!</p>
          </div>
        ) : (
          <div className="space-y-3">
            {configs.map((config) => (
              <div
                key={config.id}
                className="border border-gray-200 rounded-lg p-4 flex items-center justify-between hover:border-primary-300 transition-colors"
              >
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="font-semibold text-gray-900">{config.name}</h3>
                    {config.isActive && (
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                        Active
                      </span>
                    )}
                  </div>
                  <div className="flex flex-wrap gap-4 text-sm text-gray-600">
                    <span>
                      <span className="font-medium">Provider:</span> {config.provider}
                    </span>
                    <span>
                      <span className="font-medium">Model:</span> {config.model}
                    </span>
                    {config.maxTokens && (
                      <span>
                        <span className="font-medium">Max Tokens:</span>{' '}
                        {config.maxTokens}
                      </span>
                    )}
                    {config.temperature && (
                      <span>
                        <span className="font-medium">Temperature:</span>{' '}
                        {config.temperature}
                      </span>
                    )}
                  </div>
                </div>

                <div className="flex gap-2 ml-4">
                  <button
                    onClick={() => handleEdit(config)}
                    className="text-primary-600 hover:text-primary-700 p-2"
                    title="Edit"
                  >
                    <Edit className="h-5 w-5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
