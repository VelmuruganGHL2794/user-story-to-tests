import { useState } from 'react';
import type { TestCase } from '../types';

interface TestCaseCardProps {
  testCase: TestCase;
}

const CATEGORY_COLORS: Record<TestCase['category'], string> = {
  Positive:         '#27AE60',
  Negative:         '#E74C3C',
  Edge:             '#E67E22',
  Authorization:    '#8E44AD',
  'Non-Functional': '#7F8C8D',
};

export default function TestCaseCard({ testCase }: TestCaseCardProps) {
  const [expanded, setExpanded] = useState(false);
  const badgeColor = CATEGORY_COLORS[testCase.category];

  return (
    <div style={{
      border: '1px solid #E5E7EB',
      borderRadius: 8,
      marginBottom: 10,
      background: '#FFF',
      overflow: 'hidden',
    }}>
      <div
        onClick={() => setExpanded(!expanded)}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 10,
          padding: '12px 16px',
          cursor: 'pointer',
          userSelect: 'none',
        }}
      >
        <span style={{
          transform: expanded ? 'rotate(90deg)' : 'rotate(0deg)',
          transition: 'transform 0.15s',
          fontSize: 12,
          color: '#9CA3AF',
        }}>
          &#9654;
        </span>

        <span style={{
          fontSize: 12,
          fontWeight: 700,
          color: '#6B7280',
          minWidth: 48,
        }}>
          {testCase.id}
        </span>

        <span style={{
          display: 'inline-block',
          padding: '2px 8px',
          borderRadius: 4,
          fontSize: 11,
          fontWeight: 600,
          color: '#FFF',
          background: badgeColor,
        }}>
          {testCase.category}
        </span>

        <span style={{ fontSize: 14, color: '#111827', flex: 1 }}>
          {testCase.title}
        </span>
      </div>

      {expanded && (
        <div style={{ padding: '0 16px 16px', borderTop: '1px solid #F3F4F6' }}>
          <table style={{
            width: '100%',
            borderCollapse: 'collapse',
            marginTop: 12,
            fontSize: 13,
          }}>
            <thead>
              <tr>
                <th style={thStyle}>Step</th>
                <th style={thStyle}>Action</th>
                <th style={thStyle}>Expected Result</th>
              </tr>
            </thead>
            <tbody>
              {testCase.steps.map((step) => (
                <tr key={step.stepNo}>
                  <td style={{ ...tdStyle, width: 50, textAlign: 'center', fontWeight: 600 }}>
                    {step.stepNo}
                  </td>
                  <td style={tdStyle}>{step.action}</td>
                  <td style={tdStyle}>{step.expectedResult}</td>
                </tr>
              ))}
            </tbody>
          </table>

          <div style={{ display: 'flex', gap: 24, marginTop: 14, fontSize: 13 }}>
            <div style={{ flex: 1 }}>
              <span style={fieldLabel}>Test Data</span>
              <p style={fieldValue}>{testCase.testData}</p>
            </div>
            <div style={{ flex: 1 }}>
              <span style={fieldLabel}>Expected Result</span>
              <p style={fieldValue}>{testCase.expectedResult}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

const thStyle: React.CSSProperties = {
  textAlign: 'left',
  padding: '6px 10px',
  borderBottom: '2px solid #E5E7EB',
  color: '#6B7280',
  fontWeight: 600,
  fontSize: 12,
  textTransform: 'uppercase',
  letterSpacing: '0.3px',
};

const tdStyle: React.CSSProperties = {
  padding: '8px 10px',
  borderBottom: '1px solid #F3F4F6',
  color: '#374151',
  verticalAlign: 'top',
};

const fieldLabel: React.CSSProperties = {
  display: 'block',
  fontSize: 11,
  fontWeight: 600,
  textTransform: 'uppercase',
  letterSpacing: '0.3px',
  color: '#9CA3AF',
  marginBottom: 4,
};

const fieldValue: React.CSSProperties = {
  margin: 0,
  color: '#374151',
  lineHeight: 1.5,
};
