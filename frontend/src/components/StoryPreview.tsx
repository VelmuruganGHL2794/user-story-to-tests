import type { StoryData } from '../types';

interface StoryPreviewProps {
  story: StoryData;
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export default function StoryPreview({ story }: StoryPreviewProps) {
  return (
    <div style={{
      background: '#F8F9FA',
      border: '1px solid #DEE2E6',
      borderRadius: 8,
      padding: 20,
      marginTop: 16,
    }}>
      <h3 style={{ margin: '0 0 4px', fontSize: 18, color: '#212529' }}>
        {story.title}
      </h3>
      <span style={{ fontSize: 12, color: '#6C757D' }}>Task ID: {story.taskId}</span>

      {story.description && (
        <div style={{ marginTop: 16 }}>
          <label style={labelStyle}>Description</label>
          <p style={textStyle}>{story.description}</p>
        </div>
      )}

      <div style={{ marginTop: 16 }}>
        <label style={labelStyle}>Acceptance Criteria</label>
        <pre style={{
          ...textStyle,
          whiteSpace: 'pre-wrap',
          background: '#FFF',
          border: '1px solid #E9ECEF',
          borderRadius: 6,
          padding: 12,
          maxHeight: 200,
          overflow: 'auto',
        }}>
          {story.acceptanceCriteria || '(none found)'}
        </pre>
      </div>

      {story.prdContent && (
        <div style={{ marginTop: 16 }}>
          <label style={labelStyle}>PRD Content (extracted)</label>
          <pre style={{
            ...textStyle,
            whiteSpace: 'pre-wrap',
            background: '#FFF',
            border: '1px solid #E9ECEF',
            borderRadius: 6,
            padding: 12,
            maxHeight: 160,
            overflow: 'auto',
            fontSize: 12,
          }}>
            {story.prdContent}
          </pre>
        </div>
      )}

      {story.attachments.length > 0 && (
        <div style={{ marginTop: 16 }}>
          <label style={labelStyle}>Attachments ({story.attachments.length})</label>
          <ul style={{ margin: '4px 0 0', paddingLeft: 20, fontSize: 13, color: '#495057' }}>
            {story.attachments.map((a, i) => (
              <li key={i}>{a.name} &mdash; {formatBytes(a.size)}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

const labelStyle: React.CSSProperties = {
  display: 'block',
  fontSize: 12,
  fontWeight: 600,
  textTransform: 'uppercase',
  letterSpacing: '0.5px',
  color: '#6C757D',
  marginBottom: 4,
};

const textStyle: React.CSSProperties = {
  margin: 0,
  fontSize: 14,
  color: '#495057',
  lineHeight: 1.5,
};
