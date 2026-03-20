import type { TestCase } from '../types';
import TestCaseCard from './TestCaseCard';

interface TestResultsProps {
  testCases: TestCase[];
  model: string;
  totalTokens: number;
}

const CATEGORIES: TestCase['category'][] = [
  'Positive', 'Negative', 'Edge', 'Authorization', 'Non-Functional',
];

export default function TestResults({ testCases, model, totalTokens }: TestResultsProps) {
  const copyAll = () => {
    const text = testCases.map((tc) => {
      const steps = tc.steps
        .map((s) => `  ${s.stepNo}. ${s.action} → ${s.expectedResult}`)
        .join('\n');
      return `[${tc.id}] ${tc.title} (${tc.category})\nSteps:\n${steps}\nTest Data: ${tc.testData}\nExpected: ${tc.expectedResult}`;
    }).join('\n\n---\n\n');
    navigator.clipboard.writeText(text);
  };

  const categoryCounts = CATEGORIES.map((cat) => ({
    cat,
    count: testCases.filter((tc) => tc.category === cat).length,
  })).filter((c) => c.count > 0);

  return (
    <div>
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 16,
      }}>
        <div>
          <h3 style={{ margin: 0, fontSize: 18, color: '#111827' }}>
            Test Cases ({testCases.length})
          </h3>
          <div style={{ display: 'flex', gap: 6, marginTop: 6, flexWrap: 'wrap' }}>
            {categoryCounts.map(({ cat, count }) => (
              <span key={cat} style={{
                fontSize: 12,
                color: '#6B7280',
                background: '#F3F4F6',
                padding: '2px 8px',
                borderRadius: 4,
              }}>
                {cat}: {count}
              </span>
            ))}
          </div>
        </div>
        <div style={{ textAlign: 'right' }}>
          <button onClick={copyAll} style={copyBtnStyle}>
            Copy All
          </button>
          <div style={{ fontSize: 11, color: '#9CA3AF', marginTop: 4 }}>
            {model} &middot; {totalTokens.toLocaleString()} tokens
          </div>
        </div>
      </div>

      {testCases.map((tc) => (
        <TestCaseCard key={tc.id} testCase={tc} />
      ))}
    </div>
  );
}

const copyBtnStyle: React.CSSProperties = {
  padding: '6px 14px',
  fontSize: 13,
  fontWeight: 600,
  color: '#2563EB',
  background: '#EFF6FF',
  border: '1px solid #BFDBFE',
  borderRadius: 6,
  cursor: 'pointer',
};
