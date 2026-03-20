import { describe, it, expect, vi, beforeEach } from 'vitest';
import request from 'supertest';

vi.mock('../integrations/clickupClient', () => ({
  extractTaskId: vi.fn((input: string) => {
    if (input === 'invalid!!') throw new Error('Invalid ClickUp task URL or ID');
    return 'abc123';
  }),
  fetchTask: vi.fn(async () => ({
    id: 'abc123',
    name: 'User Login Feature',
    description: 'As a user, I want to login\n## Acceptance Criteria\n- Given valid email\n- When user clicks login\n- Then dashboard shown',
    custom_fields: [
      { name: 'Acceptance Criteria', value: 'Given valid email and password, user can login successfully' },
    ],
  })),
  extractAcceptanceCriteria: vi.fn(() => 'Given valid email and password, user can login successfully'),
  listAttachments: vi.fn(async () => [
    { id: 'att1', title: 'PRD_Login.pdf', url: 'https://example.com/prd.pdf', extension: 'pdf', size: 2048 },
  ]),
  filterPrdAttachments: vi.fn((attachments: unknown[]) => attachments),
  downloadAttachment: vi.fn(async () => Buffer.from('fake pdf content')),
}));

vi.mock('../parsers/pdfParser', () => ({
  extractPdfText: vi.fn(async () => 'Extracted text from PRD document'),
}));

vi.mock('../parsers/docxParser', () => ({
  extractDocxText: vi.fn(async () => 'Extracted text from DOCX document'),
}));

vi.mock('../integrations/openaiClient', () => ({
  generateTestCases: vi.fn(async () => ({
    content: JSON.stringify({
      testCases: [
        {
          id: 'TC001',
          title: 'Successful login with valid credentials',
          category: 'Positive',
          steps: [
            { stepNo: 'S01', action: 'Navigate to /login', expectedResult: 'Login page displayed' },
            { stepNo: 'S02', action: 'Enter valid credentials', expectedResult: 'Fields populated' },
            { stepNo: 'S03', action: 'Click Submit', expectedResult: 'Redirected to dashboard' },
          ],
          testData: 'email: user@example.com, password: P@ssword1',
          expectedResult: 'User authenticated and redirected',
        },
        {
          id: 'TC002',
          title: 'Login fails with invalid password',
          category: 'Negative',
          steps: [
            { stepNo: 'S01', action: 'Navigate to /login', expectedResult: 'Login page displayed' },
            { stepNo: 'S02', action: 'Enter invalid password', expectedResult: 'Fields populated' },
            { stepNo: 'S03', action: 'Click Submit', expectedResult: 'Error message shown' },
          ],
          testData: 'email: user@example.com, password: wrong',
          expectedResult: 'Login rejected with error message',
        },
      ],
    }),
    usage: { total_tokens: 1200, prompt_tokens: 500, completion_tokens: 700 },
  })),
}));

let app: typeof import('../app').default;

beforeEach(async () => {
  vi.unstubAllEnvs();
  const mod = await import('../app');
  app = mod.default;
});

describe('GET /api/health', () => {
  it('returns status ok', async () => {
    const res = await request(app).get('/api/health');
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ status: 'ok', version: '2.0.0' });
  });
});

describe('POST /api/fetch-story', () => {
  it('returns 400 when taskInput is missing', async () => {
    const res = await request(app)
      .post('/api/fetch-story')
      .send({});
    expect(res.status).toBe(400);
    expect(res.body.error).toBe('Validation failed');
  });

  it('returns story data for valid task input', async () => {
    const res = await request(app)
      .post('/api/fetch-story')
      .send({ taskInput: '86a1b2c3d' });
    expect(res.status).toBe(200);
    expect(res.body.taskId).toBe('abc123');
    expect(res.body.title).toBe('User Login Feature');
    expect(res.body.acceptanceCriteria).toBe('Given valid email and password, user can login successfully');
    expect(res.body.prdContent).toContain('Extracted text from PRD document');
    expect(res.body.attachments).toHaveLength(1);
    expect(res.body.attachments[0].name).toBe('PRD_Login.pdf');
  });

  it('returns 400 for invalid task URL format', async () => {
    const res = await request(app)
      .post('/api/fetch-story')
      .send({ taskInput: 'invalid!!' });
    expect(res.status).toBe(400);
    expect(res.body.error).toContain('Invalid ClickUp');
  });
});

describe('POST /api/generate-tests', () => {
  it('returns 400 when required fields are missing', async () => {
    const res = await request(app)
      .post('/api/generate-tests')
      .send({});
    expect(res.status).toBe(400);
    expect(res.body.error).toBe('Validation failed');
  });

  it('returns 400 when storyTitle is empty', async () => {
    const res = await request(app)
      .post('/api/generate-tests')
      .send({ storyTitle: '', acceptanceCriteria: 'some AC' });
    expect(res.status).toBe(400);
  });

  it('returns test cases for valid input', async () => {
    const res = await request(app)
      .post('/api/generate-tests')
      .send({
        storyTitle: 'User Login',
        acceptanceCriteria: 'Given valid email and password, user can login',
      });
    expect(res.status).toBe(200);
    expect(res.body.testCases).toHaveLength(2);
    expect(res.body.testCases[0].id).toBe('TC001');
    expect(res.body.testCases[0].category).toBe('Positive');
    expect(res.body.testCases[0].steps).toHaveLength(3);
    expect(res.body.testCases[1].category).toBe('Negative');
    expect(res.body.totalTokens).toBe(1200);
    expect(res.body.promptTokens).toBe(500);
    expect(res.body.completionTokens).toBe(700);
  });

  it('accepts optional fields', async () => {
    const res = await request(app)
      .post('/api/generate-tests')
      .send({
        storyTitle: 'User Login',
        acceptanceCriteria: 'AC here',
        description: 'As a user, I want to login',
        prdContent: 'PRD extracted text',
        additionalInfo: 'Must support SSO',
      });
    expect(res.status).toBe(200);
    expect(res.body.testCases).toHaveLength(2);
  });
});
