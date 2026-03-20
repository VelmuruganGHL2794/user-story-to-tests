import { useState } from 'react';
import type { StoryData } from '../types';
import StoryPreview from './StoryPreview';

interface ClickUpFormProps {
  onFetch: (taskInput: string) => Promise<void>;
  onGenerate: (additionalInfo: string) => Promise<void>;
  storyData: StoryData | null;
  loading: { fetching: boolean; generating: boolean };
}

export default function ClickUpForm({ onFetch, onGenerate, storyData, loading }: ClickUpFormProps) {
  const [taskInput, setTaskInput] = useState('');
  const [additionalInfo, setAdditionalInfo] = useState('');

  const handleFetch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!taskInput.trim()) return;
    await onFetch(taskInput.trim());
  };

  const handleGenerate = async () => {
    await onGenerate(additionalInfo);
  };

  return (
    <div>
      <form onSubmit={handleFetch} style={{ display: 'flex', gap: 10, alignItems: 'flex-end' }}>
        <div style={{ flex: 1 }}>
          <label style={labelStyle} htmlFor="task-input">
            ClickUp Task URL or ID
          </label>
          <input
            id="task-input"
            type="text"
            value={taskInput}
            onChange={(e) => setTaskInput(e.target.value)}
            placeholder="https://app.clickup.com/t/86a1b2c3d or 86a1b2c3d"
            disabled={loading.fetching}
            style={inputStyle}
          />
        </div>
        <button
          type="submit"
          disabled={loading.fetching || !taskInput.trim()}
          style={{
            ...btnStyle,
            background: loading.fetching ? '#6C757D' : '#2563EB',
            minWidth: 120,
          }}
        >
          {loading.fetching ? 'Fetching...' : 'Fetch Task'}
        </button>
      </form>

      {storyData && (
        <>
          <StoryPreview story={storyData} />

          <div style={{ marginTop: 16 }}>
            <label style={labelStyle} htmlFor="additional-info">
              Additional Notes (optional)
            </label>
            <textarea
              id="additional-info"
              value={additionalInfo}
              onChange={(e) => setAdditionalInfo(e.target.value)}
              placeholder="e.g., Must support SSO, multi-language, specific edge cases..."
              rows={3}
              disabled={loading.generating}
              style={{ ...inputStyle, resize: 'vertical' }}
            />
          </div>

          <button
            onClick={handleGenerate}
            disabled={loading.generating}
            style={{
              ...btnStyle,
              marginTop: 12,
              background: loading.generating ? '#6C757D' : '#27AE60',
              width: '100%',
              fontSize: 15,
              padding: '12px 24px',
            }}
          >
            {loading.generating ? 'Generating Test Cases...' : 'Generate Tests'}
          </button>
        </>
      )}
    </div>
  );
}

const labelStyle: React.CSSProperties = {
  display: 'block',
  fontSize: 13,
  fontWeight: 600,
  color: '#374151',
  marginBottom: 6,
};

const inputStyle: React.CSSProperties = {
  width: '100%',
  padding: '10px 12px',
  fontSize: 14,
  border: '1px solid #D1D5DB',
  borderRadius: 6,
  outline: 'none',
  fontFamily: 'inherit',
  boxSizing: 'border-box',
};

const btnStyle: React.CSSProperties = {
  padding: '10px 20px',
  fontSize: 14,
  fontWeight: 600,
  color: '#FFF',
  border: 'none',
  borderRadius: 6,
  cursor: 'pointer',
};
