import { useState } from 'react';
import type { StoryData, TestCase, GenerateResponse } from './types';
import { fetchStory, generateTests } from './api';
import ClickUpForm from './components/ClickUpForm';
import ManualForm from './components/ManualForm';
import TestResults from './components/TestResults';
import ErrorBanner from './components/ErrorBanner';

type Tab = 'clickup' | 'manual' | 'results';

function App() {
  const [storyData, setStoryData]   = useState<StoryData | null>(null);
  const [testCases, setTestCases]   = useState<TestCase[]>([]);
  const [genMeta, setGenMeta]       = useState({ model: '', totalTokens: 0 });
  const [loading, setLoading]       = useState({ fetching: false, generating: false });
  const [error, setError]           = useState<string | null>(null);
  const [activeTab, setActiveTab]   = useState<Tab>('clickup');

  const handleFetchStory = async (taskInput: string) => {
    setError(null);
    setLoading((prev) => ({ ...prev, fetching: true }));
    try {
      const data = await fetchStory(taskInput);
      setStoryData(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch story');
    } finally {
      setLoading((prev) => ({ ...prev, fetching: false }));
    }
  };

  const handleClickUpGenerate = async (additionalInfo: string) => {
    if (!storyData) return;
    setError(null);
    setLoading((prev) => ({ ...prev, generating: true }));
    try {
      const result: GenerateResponse = await generateTests({
        storyTitle:         storyData.title,
        acceptanceCriteria: storyData.acceptanceCriteria,
        description:        storyData.description || undefined,
        prdContent:         storyData.prdContent || undefined,
        additionalInfo:     additionalInfo || undefined,
      });
      setTestCases(result.testCases);
      setGenMeta({ model: result.model, totalTokens: result.totalTokens });
      setActiveTab('results');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to generate tests');
    } finally {
      setLoading((prev) => ({ ...prev, generating: false }));
    }
  };

  const handleManualGenerate = async (data: {
    storyTitle: string;
    acceptanceCriteria: string;
    description: string;
    additionalInfo: string;
  }) => {
    setError(null);
    setLoading((prev) => ({ ...prev, generating: true }));
    try {
      const result: GenerateResponse = await generateTests({
        storyTitle:         data.storyTitle,
        acceptanceCriteria: data.acceptanceCriteria,
        description:        data.description || undefined,
        additionalInfo:     data.additionalInfo || undefined,
      });
      setTestCases(result.testCases);
      setGenMeta({ model: result.model, totalTokens: result.totalTokens });
      setActiveTab('results');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to generate tests');
    } finally {
      setLoading((prev) => ({ ...prev, generating: false }));
    }
  };

  const tabs: { key: Tab; label: string; disabled?: boolean }[] = [
    { key: 'clickup', label: 'ClickUp Import' },
    { key: 'manual',  label: 'Manual Entry' },
    { key: 'results', label: `Results (${testCases.length})`, disabled: testCases.length === 0 },
  ];

  return (
    <div style={{
      minHeight: '100vh',
      background: '#F9FAFB',
      fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif",
    }}>
      {/* Header */}
      <header style={{
        background: '#FFF',
        borderBottom: '1px solid #E5E7EB',
        padding: '16px 0',
      }}>
        <div style={{ maxWidth: 900, margin: '0 auto', padding: '0 24px' }}>
          <h1 style={{ margin: 0, fontSize: 22, fontWeight: 700, color: '#111827' }}>
            User Story to Tests
          </h1>
          <p style={{ margin: '2px 0 0', fontSize: 13, color: '#6B7280' }}>
            v2.0 &middot; OpenAI + ClickUp Integration
          </p>
        </div>
      </header>

      {/* Main */}
      <main style={{ maxWidth: 900, margin: '0 auto', padding: '24px 24px 48px' }}>
        {error && <ErrorBanner message={error} onDismiss={() => setError(null)} />}

        {/* Tab Nav */}
        <div style={{
          display: 'flex',
          gap: 0,
          borderBottom: '2px solid #E5E7EB',
          marginBottom: 24,
        }}>
          {tabs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => !tab.disabled && setActiveTab(tab.key)}
              disabled={tab.disabled}
              style={{
                padding: '10px 20px',
                fontSize: 14,
                fontWeight: 600,
                border: 'none',
                background: 'none',
                cursor: tab.disabled ? 'default' : 'pointer',
                color: tab.disabled
                  ? '#D1D5DB'
                  : activeTab === tab.key
                    ? '#2563EB'
                    : '#6B7280',
                borderBottom: activeTab === tab.key
                  ? '2px solid #2563EB'
                  : '2px solid transparent',
                marginBottom: -2,
                transition: 'color 0.15s, border-color 0.15s',
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        {activeTab === 'clickup' && (
          <ClickUpForm
            onFetch={handleFetchStory}
            onGenerate={handleClickUpGenerate}
            storyData={storyData}
            loading={loading}
          />
        )}

        {activeTab === 'manual' && (
          <ManualForm
            onGenerate={handleManualGenerate}
            loading={loading.generating}
          />
        )}

        {activeTab === 'results' && testCases.length > 0 && (
          <TestResults
            testCases={testCases}
            model={genMeta.model}
            totalTokens={genMeta.totalTokens}
          />
        )}
      </main>
    </div>
  );
}

export default App;
