import { useState } from 'react';

interface ManualFormProps {
  onGenerate: (data: {
    storyTitle: string;
    acceptanceCriteria: string;
    description: string;
    additionalInfo: string;
  }) => Promise<void>;
  loading: boolean;
}

export default function ManualForm({ onGenerate, loading }: ManualFormProps) {
  const [storyTitle, setStoryTitle] = useState('');
  const [acceptanceCriteria, setAcceptanceCriteria] = useState('');
  const [description, setDescription] = useState('');
  const [additionalInfo, setAdditionalInfo] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!storyTitle.trim() || !acceptanceCriteria.trim()) return;
    await onGenerate({
      storyTitle: storyTitle.trim(),
      acceptanceCriteria: acceptanceCriteria.trim(),
      description: description.trim(),
      additionalInfo: additionalInfo.trim(),
    });
  };

  return (
    <form onSubmit={handleSubmit}>
      <div style={{ marginBottom: 16 }}>
        <label style={labelStyle} htmlFor="story-title">
          Story Title <span style={{ color: '#E74C3C' }}>*</span>
        </label>
        <input
          id="story-title"
          type="text"
          value={storyTitle}
          onChange={(e) => setStoryTitle(e.target.value)}
          placeholder="e.g., User Login via Email and Password"
          disabled={loading}
          style={inputStyle}
        />
      </div>

      <div style={{ marginBottom: 16 }}>
        <label style={labelStyle} htmlFor="acceptance-criteria">
          Acceptance Criteria <span style={{ color: '#E74C3C' }}>*</span>
        </label>
        <textarea
          id="acceptance-criteria"
          value={acceptanceCriteria}
          onChange={(e) => setAcceptanceCriteria(e.target.value)}
          placeholder={"Given a valid email and password\nWhen the user clicks Login\nThen they are redirected to the dashboard"}
          rows={5}
          disabled={loading}
          style={{ ...inputStyle, resize: 'vertical' }}
        />
      </div>

      <div style={{ marginBottom: 16 }}>
        <label style={labelStyle} htmlFor="description">
          Description (optional)
        </label>
        <textarea
          id="description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="As a user, I want to..."
          rows={3}
          disabled={loading}
          style={{ ...inputStyle, resize: 'vertical' }}
        />
      </div>

      <div style={{ marginBottom: 16 }}>
        <label style={labelStyle} htmlFor="manual-additional-info">
          Additional Notes (optional)
        </label>
        <textarea
          id="manual-additional-info"
          value={additionalInfo}
          onChange={(e) => setAdditionalInfo(e.target.value)}
          placeholder="e.g., Must support SSO, multi-language..."
          rows={2}
          disabled={loading}
          style={{ ...inputStyle, resize: 'vertical' }}
        />
      </div>

      <button
        type="submit"
        disabled={loading || !storyTitle.trim() || !acceptanceCriteria.trim()}
        style={{
          ...btnStyle,
          background: loading ? '#6C757D' : '#27AE60',
          width: '100%',
          fontSize: 15,
          padding: '12px 24px',
        }}
      >
        {loading ? 'Generating Test Cases...' : 'Generate Tests'}
      </button>
    </form>
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
