# User Story to Tests — Architecture & Implementation Guide v2.0

> **Re-architected with:** OpenAI API · ClickUp Integration · PRD Document Parsing
> **Version:** 2.0 · March 2026

---

## Table of Contents

1. [Executive Summary](#1-executive-summary)
2. [System Overview](#2-system-overview)
3. [Project Structure](#3-project-structure)
4. [ClickUp Integration](#4-clickup-integration)
5. [PRD Document Parsing](#5-prd-document-parsing)
6. [OpenAI Integration](#6-openai-integration)
7. [Backend API Design](#7-backend-api-design)
8. [Frontend Architecture](#8-frontend-architecture)
9. [Complete Technology Stack](#9-complete-technology-stack)
10. [Environment Configuration](#10-environment-configuration)
11. [Security Considerations](#11-security-considerations)
12. [Implementation Plan](#12-implementation-plan)
13. [Key Implementation References](#13-key-implementation-references)
14. [Summary & Quick Start](#14-summary--quick-start)

---

## 1. Executive Summary

This document provides a complete blueprint for re-implementing the **User Story to Tests** platform from scratch. The revised system:

- Replaces the **Groq LLM backend** with the **OpenAI API** (GPT-4o)
- Introduces a native **ClickUp integration** so testers never need to copy-paste story text — they simply provide a ClickUp task URL or ID, and the platform automatically retrieves the task description, acceptance criteria, and any attached PRD documents

| Attribute | Details |
|---|---|
| **Project** | User Story to Tests v2.0 |
| **LLM Provider** | OpenAI API (GPT-4o / GPT-4-turbo) |
| **Story Source** | ClickUp Tasks (description, acceptance criteria, attachments) |
| **Document Parsing** | PDF / DOCX PRD files attached to ClickUp tasks |
| **Frontend** | React 18 + Vite + TypeScript |
| **Backend** | Node.js + Express + TypeScript |
| **Validation** | Zod (runtime schema safety on all inputs and LLM outputs) |

---

## 2. System Overview

### 2.1 High-Level Architecture

The application follows a classic **three-tier architecture**:

```
┌─────────────────────────────────────────────────────────────────────┐
│                        FRONTEND  (port 5173)                        │
│                                                                     │
│   React SPA · ClickUp Task Input · PRD Viewer · Test Case Results   │
└───────────────────────────┬─────────────────────────────────────────┘
                            │  HTTP (REST)
                            ▼
┌─────────────────────────────────────────────────────────────────────┐
│                       BACKEND API  (port 8080)                      │
│                                                                     │
│   Express Routes · ClickUp Client · Document Parser                 │
│   OpenAI Client · Zod Validator                                     │
└──────────────┬───────────────────────────────┬──────────────────────┘
               │                              │
               ▼                              ▼
┌──────────────────────┐          ┌───────────────────────┐
│   ClickUp REST API   │          │   OpenAI Chat API     │
│                      │          │   (GPT-4o)            │
│  · Task details      │          │                       │
│  · Attachments       │          │  · Test case gen      │
│  · PRD file download │          │  · JSON output        │
└──────────────────────┘          └───────────────────────┘
```

> **Key Design Principle:** All ClickUp API calls, document parsing, and OpenAI prompting happen exclusively on the backend. API keys are **never** exposed to the browser.

---

### 2.2 End-to-End Data Flow

```
1. User enters ClickUp Task URL / ID in the frontend form
        │
        ▼
2. Frontend  →  POST /api/fetch-story  →  Backend
        │
        ▼
3. Backend calls ClickUp REST API
   → Retrieves: task title, description, custom fields (acceptance criteria),
                attachment metadata
        │
        ▼
4. Backend downloads each attached PDF/DOCX
   → Extracts plain text (pdf-parse / mammoth)
        │
        ▼
5. Combined story data returned to frontend for preview & confirmation
        │
        ▼
6. User clicks "Generate Tests"
   Frontend  →  POST /api/generate-tests  →  Backend
        │
        ▼
7. Backend builds OpenAI prompt from story data + extracted PRD text
        │
        ▼
8. OpenAI returns structured JSON test cases (validated by Zod)
        │
        ▼
9. Backend responds with test cases + token usage
   Frontend renders results
```

---

## 3. Project Structure

```
user-story-to-tests/
├── .env                                      # All secrets (OpenAI key, ClickUp token, ports)
├── .gitignore                                # Must include .env
├── package.json                              # Monorepo root — workspaces + concurrently scripts
│
├── backend/
│   ├── package.json
│   ├── tsconfig.json
│   └── src/
│       ├── server.ts                         # Express app entry — middleware, routes, error handler
│       ├── schemas.ts                        # Zod schemas for all request/response shapes
│       ├── prompt.ts                         # System prompt + buildPrompt() factory
│       ├── routes/
│       │   ├── fetchStory.ts                 # POST /api/fetch-story
│       │   └── generate.ts                  # POST /api/generate-tests
│       ├── integrations/
│       │   ├── clickupClient.ts              # ClickUp REST API wrapper
│       │   └── openaiClient.ts              # OpenAI SDK wrapper
│       └── parsers/
│           ├── pdfParser.ts                  # PDF text extraction (pdf-parse)
│           └── docxParser.ts                 # DOCX text extraction (mammoth)
│
└── frontend/
    ├── package.json
    ├── tsconfig.json
    ├── vite.config.ts
    ├── index.html
    └── src/
        ├── main.tsx                          # React entry point
        ├── App.tsx                           # Root component — global state + tab navigation
        ├── api.ts                            # Typed API client (fetchStory, generateTests)
        ├── types.ts                          # Shared TypeScript interfaces
        └── components/
            ├── ClickUpForm.tsx               # Task URL/ID input + StoryPreview panel
            ├── StoryPreview.tsx              # Read-only display of fetched story data
            ├── ManualForm.tsx                # Fallback manual entry form
            ├── TestResults.tsx              # Collapsible test case list + category badges
            ├── TestCaseCard.tsx              # Single test case: steps, test data, expected result
            └── ErrorBanner.tsx              # Dismissible error message bar
```

---

## 4. ClickUp Integration

### 4.1 Authentication

All ClickUp API calls originate from the **backend only** using a Personal API Token stored in `.env`.

```
CLICKUP_API_KEY=pk_XXXXXXXXXXXXXXXXXXXX
```

Header used on every request:
```
Authorization: Bearer <CLICKUP_API_KEY>
```

---

### 4.2 ClickUp API Endpoints Used

| Endpoint | Method | Purpose |
|---|---|---|
| `/api/v2/task/{task_id}` | GET | Fetch task title, description, status, custom fields |
| `/api/v2/task/{task_id}/attachment` | GET | List all attachments (name, type, download URL) |
| `{attachment.url}` | GET | Stream/download PRD file content (PDF or DOCX) |

---

### 4.3 Task ID Extraction

Users can paste any of the following formats:

```
# Full URL
https://app.clickup.com/t/{workspace_id}/{task_id}

# Short URL
https://app.clickup.com/t/{task_id}

# Raw Task ID
86a1b2c3d
```

`extractTaskId()` normalises all three formats into a plain task ID using regex before making API calls.

```typescript
// backend/src/integrations/clickupClient.ts

export function extractTaskId(input: string): string {
  // Match /t/{optional_workspace_id}/{task_id} or raw ID
  const urlMatch = input.match(/\/t\/(?:[^/]+\/)?([a-zA-Z0-9]+)\/?$/);
  if (urlMatch) return urlMatch[1];
  // Assume raw task ID
  if (/^[a-zA-Z0-9]+$/.test(input.trim())) return input.trim();
  throw new Error('Invalid ClickUp task URL or ID format');
}
```

---

### 4.4 Acceptance Criteria Mapping

The backend checks **two locations** in order:

1. **Custom Field** named `Acceptance Criteria` (type: `text` or `long-text`) on the task
2. **Fallback:** Parse the task `description` for a markdown section starting with `## Acceptance Criteria` or `**Acceptance Criteria**`

```typescript
// backend/src/integrations/clickupClient.ts

export function extractAcceptanceCriteria(task: ClickUpTask): string {
  // 1. Check custom fields first
  const acField = task.custom_fields?.find(
    (f) => f.name.toLowerCase() === 'acceptance criteria'
  );
  if (acField?.value) return acField.value as string;

  // 2. Fallback: parse description markdown
  const match = task.description?.match(
    /(?:##\s*acceptance criteria|[*]{2}acceptance criteria[*]{2})([\s\S]*?)(?=\n#|\n[*]{2}|$)/i
  );
  return match?.[1]?.trim() ?? '';
}
```

> **Best Practice:** Standardise your ClickUp workspace to use a custom field named exactly `Acceptance Criteria` for reliable extraction without parsing heuristics.

---

### 4.5 Attachment Filtering

Not every attachment is a PRD. The backend filters by:

- **File extension:** `.pdf`, `.docx`, `.doc`
- **Filename heuristic (optional):** contains `PRD`, `product-requirements`, or `requirements` (case-insensitive)

```typescript
// backend/src/integrations/clickupClient.ts

export function filterPrdAttachments(attachments: Attachment[]): Attachment[] {
  const PRD_EXTENSIONS = ['.pdf', '.docx', '.doc'];
  const PRD_KEYWORDS   = ['prd', 'product-requirements', 'requirements'];

  return attachments.filter((a) => {
    const name = a.title.toLowerCase();
    const hasExt = PRD_EXTENSIONS.some((ext) => name.endsWith(ext));
    const hasKeyword = PRD_KEYWORDS.some((kw) => name.includes(kw));
    return hasExt || hasKeyword;
  });
}
```

---

### 4.6 Full `clickupClient.ts` Implementation

```typescript
// backend/src/integrations/clickupClient.ts
import fetch from 'node-fetch';

const BASE_URL = 'https://api.clickup.com/api/v2';

interface ClickUpTask {
  id: string;
  name: string;
  description: string;
  custom_fields: { name: string; value: unknown }[];
}

interface Attachment {
  id: string;
  title: string;
  url: string;
  extension: string;
  size: number;
}

export function extractTaskId(input: string): string {
  const urlMatch = input.match(/\/t\/(?:[^/]+\/)?([a-zA-Z0-9]+)\/?$/);
  if (urlMatch) return urlMatch[1];
  if (/^[a-zA-Z0-9]+$/.test(input.trim())) return input.trim();
  throw new Error('Invalid ClickUp task URL or ID');
}

export async function fetchTask(taskId: string): Promise<ClickUpTask> {
  const res = await fetch(`${BASE_URL}/task/${taskId}`, {
    headers: { Authorization: `Bearer ${process.env.CLICKUP_API_KEY}` },
  });
  if (!res.ok) throw new Error(`ClickUp fetch failed: ${res.status}`);
  return res.json() as Promise<ClickUpTask>;
}

export async function listAttachments(taskId: string): Promise<Attachment[]> {
  const res = await fetch(`${BASE_URL}/task/${taskId}/attachment`, {
    headers: { Authorization: `Bearer ${process.env.CLICKUP_API_KEY}` },
  });
  if (!res.ok) return [];
  const data = (await res.json()) as { attachments: Attachment[] };
  return data.attachments ?? [];
}

export async function downloadAttachment(url: string): Promise<Buffer> {
  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${process.env.CLICKUP_API_KEY}` },
  });
  if (!res.ok) throw new Error(`Attachment download failed: ${res.status}`);
  return Buffer.from(await res.arrayBuffer());
}

export function extractAcceptanceCriteria(task: ClickUpTask): string {
  const acField = task.custom_fields?.find(
    (f) => f.name.toLowerCase() === 'acceptance criteria'
  );
  if (acField?.value) return acField.value as string;
  const match = task.description?.match(
    /(?:##\s*acceptance criteria|[*]{2}acceptance criteria[*]{2})([\s\S]*?)(?=\n#|\n[*]{2}|$)/i
  );
  return match?.[1]?.trim() ?? '';
}

export function filterPrdAttachments(attachments: Attachment[]): Attachment[] {
  const EXTENSIONS = ['.pdf', '.docx', '.doc'];
  const KEYWORDS   = ['prd', 'product-requirements', 'requirements'];
  return attachments.filter((a) => {
    const name = a.title.toLowerCase();
    return EXTENSIONS.some((ext) => name.endsWith(ext)) ||
           KEYWORDS.some((kw) => name.includes(kw));
  });
}
```

---

## 5. PRD Document Parsing

### 5.1 Supported Formats

| Format | Library | Notes |
|---|---|---|
| `.pdf` | `pdf-parse` | Extracts raw text; preserves line breaks |
| `.docx` | `mammoth` | Converts to plain text; strips styles |
| `.doc` | `libreoffice` (CLI) | Convert `.doc` → `.docx` first, then use mammoth |

---

### 5.2 Parsing Pipeline

```
1. Backend receives downloadUrl from ClickUp attachment metadata
        │
        ▼
2. File fetched as Buffer via node-fetch with ClickUp auth header
        │
        ▼
3. MIME type / extension determines parser (pdfParser or docxParser)
        │
        ▼
4. Extracted text truncated to MAX_PRD_CHARS (default: 8,000)
   to stay within OpenAI context limits
        │
        ▼
5. Multiple attachments → joined with separator → collectively truncated
```

---

### 5.3 Parser Implementations

```typescript
// backend/src/parsers/pdfParser.ts
import pdfParse from 'pdf-parse';

export async function extractPdfText(buffer: Buffer): Promise<string> {
  const data = await pdfParse(buffer);
  return data.text.trim();
}
```

```typescript
// backend/src/parsers/docxParser.ts
import mammoth from 'mammoth';

export async function extractDocxText(buffer: Buffer): Promise<string> {
  const result = await mammoth.extractRawText({ buffer });
  return result.value.trim();
}
```

---

### 5.4 Token Budget Strategy

| Content Block | Max Chars | Strategy |
|---|---|---|
| System Prompt | ~2,400 | Fixed — no truncation |
| Story Title + Description | ~3,000 | Truncate description if needed |
| Acceptance Criteria | Full | Always included (critical for test gen) |
| PRD Extracted Text | ~8,000 | Summarise if > 8,000 chars |
| LLM Response (test cases) | — | `max_tokens=2500` on OpenAI request |

---

### 5.5 `parseAttachments()` Orchestrator

```typescript
// backend/src/routes/fetchStory.ts (excerpt)
import { filterPrdAttachments, downloadAttachment, listAttachments } from '../integrations/clickupClient';
import { extractPdfText } from '../parsers/pdfParser';
import { extractDocxText } from '../parsers/docxParser';

const MAX_PRD_CHARS = 8000;

export async function parseAttachments(taskId: string): Promise<string> {
  const all        = await listAttachments(taskId);
  const prds       = filterPrdAttachments(all);
  const texts: string[] = [];

  for (const attachment of prds) {
    const buffer = await downloadAttachment(attachment.url);
    const ext    = attachment.title.split('.').pop()?.toLowerCase();
    const text   = ext === 'pdf'
      ? await extractPdfText(buffer)
      : await extractDocxText(buffer);
    texts.push(`[${attachment.title}]\n${text}`);
  }

  const combined = texts.join('\n\n---\n\n');
  return combined.length > MAX_PRD_CHARS
    ? combined.slice(0, MAX_PRD_CHARS) + '\n...[truncated]'
    : combined;
}
```

---

## 6. OpenAI Integration

### 6.1 Configuration

```typescript
// backend/src/integrations/openaiClient.ts
import OpenAI from 'openai';

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export async function generateTestCases(
  systemPrompt: string,
  userPrompt: string
): Promise<{ content: string; usage: OpenAI.CompletionUsage | undefined }> {
  const response = await openai.chat.completions.create({
    model:           process.env.OPENAI_MODEL       ?? 'gpt-4o',
    temperature:     Number(process.env.OPENAI_TEMPERATURE ?? 0.2),
    max_tokens:      Number(process.env.OPENAI_MAX_TOKENS  ?? 2500),
    response_format: { type: 'json_object' },      // ← Guarantees valid JSON output
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user',   content: userPrompt   },
    ],
  });

  return {
    content: response.choices[0].message.content ?? '{}',
    usage:   response.usage,
  };
}
```

> **Why `response_format: { type: 'json_object' }`?**
> This OpenAI feature guarantees the model always returns valid JSON, eliminating the need for manual JSON extraction or repair from the LLM response — a key improvement over v1.

---

### 6.2 Environment Variables

| Variable | Default | Purpose |
|---|---|---|
| `OPENAI_API_KEY` | *(required)* | Authentication |
| `OPENAI_MODEL` | `gpt-4o` | Model for test case generation |
| `OPENAI_TEMPERATURE` | `0.2` | Low temperature for deterministic output |
| `OPENAI_MAX_TOKENS` | `2500` | Max tokens for the model response |

---

### 6.3 Prompt Engineering

```typescript
// backend/src/prompt.ts

export const SYSTEM_PROMPT = `
You are a senior QA engineer. Your job is to generate comprehensive test cases from user stories.

RULES:
- Always output ONLY valid JSON — no markdown fences, no prose, no explanation.
- Generate test cases covering ALL 5 categories:
    • Positive        — happy path / expected behaviour
    • Negative        — invalid inputs, error conditions
    • Edge            — boundary values, empty inputs, limits
    • Authorization   — access control, role-based permissions
    • Non-Functional  — performance, security, usability
- Each test case MUST include: id, title, category, steps (array), testData, expectedResult.
- Base test cases on Acceptance Criteria first.
- Use PRD content (if provided) to enrich edge cases and non-functional tests.

OUTPUT FORMAT:
{
  "testCases": [
    {
      "id": "TC001",
      "title": "string",
      "category": "Positive | Negative | Edge | Authorization | Non-Functional",
      "steps": [
        { "stepNo": "S01", "action": "string", "expectedResult": "string" }
      ],
      "testData": "string",
      "expectedResult": "string"
    }
  ]
}
`.trim();

export interface BuildPromptOptions {
  storyTitle:          string;
  acceptanceCriteria:  string;
  description?:        string;
  prdContent?:         string;
  additionalInfo?:     string;
}

export function buildPrompt(opts: BuildPromptOptions): string {
  const parts: string[] = [
    `STORY TITLE:\n${opts.storyTitle}`,
  ];
  if (opts.description)
    parts.push(`DESCRIPTION:\n${opts.description}`);
  parts.push(`ACCEPTANCE CRITERIA:\n${opts.acceptanceCriteria}`);
  if (opts.prdContent)
    parts.push(`PRD CONTEXT (extracted from attached documents):\n${opts.prdContent}`);
  if (opts.additionalInfo)
    parts.push(`ADDITIONAL NOTES:\n${opts.additionalInfo}`);

  return parts.join('\n\n---\n\n');
}
```

---

### 6.4 Zod Response Schema

```typescript
// backend/src/schemas.ts
import { z } from 'zod';

export const GenerateRequestSchema = z.object({
  storyTitle:         z.string().min(1),
  acceptanceCriteria: z.string().min(1),
  description:        z.string().optional(),
  prdContent:         z.string().optional(),
  additionalInfo:     z.string().optional(),
});

export const StepSchema = z.object({
  stepNo:         z.string(),
  action:         z.string(),
  expectedResult: z.string(),
});

export const TestCaseSchema = z.object({
  id:             z.string(),
  title:          z.string(),
  category:       z.enum(['Positive', 'Negative', 'Edge', 'Authorization', 'Non-Functional']),
  steps:          z.array(StepSchema),
  testData:       z.string(),
  expectedResult: z.string(),
});

export const GenerateResponseSchema = z.object({
  testCases:         z.array(TestCaseSchema),
  model:             z.string(),
  totalTokens:       z.number(),
  promptTokens:      z.number(),
  completionTokens:  z.number(),
});

export const FetchStoryRequestSchema = z.object({
  taskInput: z.string().min(1),
});

export const StoryDataSchema = z.object({
  taskId:              z.string(),
  title:               z.string(),
  description:         z.string(),
  acceptanceCriteria:  z.string(),
  prdContent:          z.string(),
  attachments:         z.array(z.object({ name: z.string(), type: z.string(), size: z.number() })),
});
```

---

## 7. Backend API Design

### 7.1 Endpoints

| Method | Route | Description |
|---|---|---|
| `GET` | `/api/health` | Liveness check — returns `{ status: 'ok', version }` |
| `POST` | `/api/fetch-story` | Fetch ClickUp task + parse PRD attachments |
| `POST` | `/api/generate-tests` | Send story data to OpenAI, return test cases |

---

### 7.2 `POST /api/fetch-story`

**Request Body:**
```json
{ "taskInput": "https://app.clickup.com/t/86a1b2c3d" }
```

**Success Response `200`:**
```json
{
  "taskId": "86a1b2c3d",
  "title": "User Login via Email and Password",
  "description": "As a user, I want to log in...",
  "acceptanceCriteria": "Given a valid email and password...",
  "prdContent": "Extracted text from PRD.pdf...",
  "attachments": [
    { "name": "PRD_Login.pdf", "type": "application/pdf", "size": 204800 }
  ]
}
```

**Error Responses:**
| Code | Reason |
|---|---|
| `400` | `taskInput` missing or malformed |
| `401` | Invalid ClickUp API key |
| `404` | Task ID does not exist in ClickUp |
| `500` | File download or parsing failure |

---

### 7.3 `POST /api/generate-tests`

**Request Body:**
```json
{
  "storyTitle": "User Login via Email and Password",
  "acceptanceCriteria": "Given a valid email and password...",
  "description": "As a user, I want to log in...",
  "prdContent": "Extracted PRD text (optional)...",
  "additionalInfo": "Must support SSO (optional)..."
}
```

**Success Response `200`:**
```json
{
  "testCases": [
    {
      "id": "TC001",
      "title": "Successful login with valid credentials",
      "category": "Positive",
      "steps": [
        { "stepNo": "S01", "action": "Navigate to /login", "expectedResult": "Login page displayed" },
        { "stepNo": "S02", "action": "Enter valid email + password", "expectedResult": "Fields populated" },
        { "stepNo": "S03", "action": "Click Submit", "expectedResult": "Redirected to dashboard" }
      ],
      "testData": "email: user@example.com, password: P@ssword1",
      "expectedResult": "User is authenticated and redirected to dashboard"
    }
  ],
  "model": "gpt-4o",
  "totalTokens": 1842,
  "promptTokens": 610,
  "completionTokens": 1232
}
```

---

### 7.4 `server.ts` — Express Setup

```typescript
// backend/src/server.ts
import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import { fetchStoryRouter } from './routes/fetchStory';
import { generateRouter }   from './routes/generate';

const app  = express();
const PORT = process.env.PORT ?? 8080;

app.use(cors({ origin: process.env.CORS_ORIGIN ?? 'http://localhost:5173' }));
app.use(express.json({ limit: '10mb' }));

app.get('/api/health', (_req, res) => res.json({ status: 'ok', version: '2.0.0' }));
app.use('/api', fetchStoryRouter);
app.use('/api', generateRouter);

// Global error handler
app.use((err: Error, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error(err);
  res.status(500).json({
    error: process.env.NODE_ENV === 'production' ? 'Internal Server Error' : err.message,
  });
});

app.listen(PORT, () => console.log(`Backend running on http://localhost:${PORT}`));
```

---

### 7.5 `routes/fetchStory.ts`

```typescript
// backend/src/routes/fetchStory.ts
import { Router } from 'express';
import { FetchStoryRequestSchema } from '../schemas';
import {
  extractTaskId, fetchTask, extractAcceptanceCriteria, listAttachments, filterPrdAttachments, downloadAttachment,
} from '../integrations/clickupClient';
import { extractPdfText }  from '../parsers/pdfParser';
import { extractDocxText } from '../parsers/docxParser';

export const fetchStoryRouter = Router();
const MAX_PRD_CHARS = 8000;

fetchStoryRouter.post('/fetch-story', async (req, res, next) => {
  try {
    const { taskInput } = FetchStoryRequestSchema.parse(req.body);
    const taskId        = extractTaskId(taskInput);
    const task          = await fetchTask(taskId);
    const ac            = extractAcceptanceCriteria(task);
    const allAttach     = await listAttachments(taskId);
    const prdAttach     = filterPrdAttachments(allAttach);

    const texts: string[] = [];
    for (const a of prdAttach) {
      const buffer = await downloadAttachment(a.url);
      const ext    = a.title.split('.').pop()?.toLowerCase();
      const text   = ext === 'pdf' ? await extractPdfText(buffer) : await extractDocxText(buffer);
      texts.push(`[${a.title}]\n${text}`);
    }

    const raw       = texts.join('\n\n---\n\n');
    const prdContent = raw.length > MAX_PRD_CHARS ? raw.slice(0, MAX_PRD_CHARS) + '\n...[truncated]' : raw;

    res.json({
      taskId,
      title:              task.name,
      description:        task.description ?? '',
      acceptanceCriteria: ac,
      prdContent,
      attachments:        prdAttach.map((a) => ({ name: a.title, type: a.extension, size: a.size })),
    });
  } catch (err) {
    next(err);
  }
});
```

---

### 7.6 `routes/generate.ts`

```typescript
// backend/src/routes/generate.ts
import { Router } from 'express';
import { GenerateRequestSchema, GenerateResponseSchema } from '../schemas';
import { generateTestCases } from '../integrations/openaiClient';
import { SYSTEM_PROMPT, buildPrompt } from '../prompt';

export const generateRouter = Router();

generateRouter.post('/generate-tests', async (req, res, next) => {
  try {
    const input      = GenerateRequestSchema.parse(req.body);
    const userPrompt = buildPrompt(input);
    const { content, usage } = await generateTestCases(SYSTEM_PROMPT, userPrompt);

    const parsed   = JSON.parse(content);
    const validated = GenerateResponseSchema.parse({
      ...parsed,
      model:            process.env.OPENAI_MODEL ?? 'gpt-4o',
      totalTokens:      usage?.total_tokens      ?? 0,
      promptTokens:     usage?.prompt_tokens     ?? 0,
      completionTokens: usage?.completion_tokens ?? 0,
    });

    res.json(validated);
  } catch (err) {
    next(err);
  }
});
```

---

## 8. Frontend Architecture

### 8.1 Component Hierarchy

```
App.tsx                          ← Global state + tab navigation
├── ClickUpForm.tsx              ← Task URL/ID input + StoryPreview + Generate button
│   └── StoryPreview.tsx         ← Read-only: title, description, AC, attachments
├── ManualForm.tsx               ← Fallback: manual title + AC entry
├── TestResults.tsx              ← Collapsible test case list + export
│   └── TestCaseCard.tsx         ← Steps table, test data, expected result
└── ErrorBanner.tsx              ← Dismissible error bar
```

---

### 8.2 TypeScript Types

```typescript
// frontend/src/types.ts

export interface GenerateRequest {
  storyTitle:          string;
  acceptanceCriteria:  string;
  description?:        string;
  prdContent?:         string;
  additionalInfo?:     string;
}

export interface StoryData {
  taskId:              string;
  title:               string;
  description:         string;
  acceptanceCriteria:  string;
  prdContent:          string;
  attachments:         { name: string; type: string; size: number }[];
}

export interface Step {
  stepNo:         string;
  action:         string;
  expectedResult: string;
}

export interface TestCase {
  id:             string;
  title:          string;
  category:       'Positive' | 'Negative' | 'Edge' | 'Authorization' | 'Non-Functional';
  steps:          Step[];
  testData:       string;
  expectedResult: string;
}

export interface GenerateResponse {
  testCases:         TestCase[];
  model:             string;
  totalTokens:       number;
  promptTokens:      number;
  completionTokens:  number;
}
```

---

### 8.3 API Client

```typescript
// frontend/src/api.ts

const BASE = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:8080/api';

export async function fetchStory(taskInput: string): Promise<StoryData> {
  const res = await fetch(`${BASE}/fetch-story`, {
    method:  'POST',
    headers: { 'Content-Type': 'application/json' },
    body:    JSON.stringify({ taskInput }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error((err as { error?: string }).error ?? `Error ${res.status}`);
  }
  return res.json();
}

export async function generateTests(payload: GenerateRequest): Promise<GenerateResponse> {
  const res = await fetch(`${BASE}/generate-tests`, {
    method:  'POST',
    headers: { 'Content-Type': 'application/json' },
    body:    JSON.stringify(payload),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error((err as { error?: string }).error ?? `Error ${res.status}`);
  }
  return res.json();
}
```

---

### 8.4 State Management (`App.tsx`)

```typescript
// frontend/src/App.tsx (state slice)

const [storyData,  setStoryData]  = useState<StoryData | null>(null);
const [testCases,  setTestCases]  = useState<TestCase[]>([]);
const [loading,    setLoading]    = useState({ fetching: false, generating: false });
const [error,      setError]      = useState<string | null>(null);
const [activeTab,  setActiveTab]  = useState<'clickup' | 'manual' | 'results'>('clickup');
```

---

### 8.5 ClickUp Form UX Flow

```
1. User pastes ClickUp task URL or ID → text input
        │
        ▼
2. Clicks "Fetch Task" (or on blur)
   → loading.fetching = true
   → calls fetchStory(taskInput)
        │
        ▼
3. On success:
   → StoryPreview panel appears (title, description, AC, attachment list)
   → loading.fetching = false
        │
        ▼
4. User reviews data, optionally adds "Additional Notes"
        │
        ▼
5. Clicks "Generate Tests"
   → loading.generating = true
   → calls generateTests({ ...storyData, additionalInfo })
        │
        ▼
6. On success:
   → testCases populated
   → activeTab switches to 'results'
   → TestResults renders
```

---

### 8.6 Category Color Coding

| Category | Badge Colour |
|---|---|
| Positive | Green `#27AE60` |
| Negative | Red `#E74C3C` |
| Edge | Orange `#E67E22` |
| Authorization | Purple `#8E44AD` |
| Non-Functional | Grey `#7F8C8D` |

---

## 9. Complete Technology Stack

### Backend

| Package | Version | Role |
|---|---|---|
| `express` | ^4.19 | HTTP server / routing |
| `cors` | ^2.8 | Cross-origin requests |
| `dotenv` | ^16.4 | Environment config |
| `zod` | ^3.22 | Runtime validation |
| `openai` | ^4.x | OpenAI SDK *(replaces Groq)* |
| `node-fetch` | ^3.3 | ClickUp API + file download |
| `pdf-parse` | ^1.1 | PDF text extraction |
| `mammoth` | ^1.7 | DOCX text extraction |
| `typescript` | ^5.4 | Type safety |
| `tsx` | ^4.7 | TypeScript dev runner |

### Frontend

| Package | Version | Role |
|---|---|---|
| `react` + `react-dom` | ^18.2 | UI framework |
| `vite` | ^5.2 | Build tool + dev server |
| `typescript` | ^5.2 | Type safety |
| `@vitejs/plugin-react` | ^4.2 | React support for Vite |

### Tooling

| Package | Version | Role |
|---|---|---|
| `concurrently` | ^8.2 | Run backend + frontend together |

---

## 10. Environment Configuration

Create a single `.env` at the repository root:

```bash
# Server
PORT=8080
CORS_ORIGIN=http://localhost:5173

# OpenAI (replaces groq_API_KEY)
OPENAI_API_KEY=sk-proj-...
OPENAI_MODEL=gpt-4o
OPENAI_TEMPERATURE=0.2
OPENAI_MAX_TOKENS=2500

# ClickUp
CLICKUP_API_KEY=pk_XXXXXXXXXXXXXXXXXXXXXXXX

# Frontend (Vite reads VITE_ prefix)
VITE_API_BASE_URL=http://localhost:8080/api
```

> ⚠️ **Always add `.env` to `.gitignore` immediately.**

---

### Obtaining API Keys

**OpenAI API Key:**
1. Go to [https://platform.openai.com/api-keys](https://platform.openai.com/api-keys)
2. Create a new secret key → copy into `OPENAI_API_KEY`
3. Ensure billing is enabled on your account

**ClickUp API Key:**
1. Log in to ClickUp → Settings (bottom-left avatar) → **Apps**
2. Click **Generate** under Personal API Token → copy the `pk_` value
3. The token has the same permissions as your user account

---

## 11. Security Considerations

### Never Expose Secrets
- `OPENAI_API_KEY` and `CLICKUP_API_KEY` must **never** be committed to git
- Add `.env` to `.gitignore` immediately
- For CI/CD use platform secret stores (GitHub Actions Secrets, Vault, AWS SSM, etc.)

### Backend-Only API Calls
All ClickUp and OpenAI calls originate exclusively from the Express backend. CORS is locked to the frontend origin — the browser never holds API keys.

### Input Validation
Every inbound request body is validated with Zod before processing. Invalid inputs are rejected with `400` errors — raw user input is never forwarded directly to external APIs.

### In-Memory File Processing
Downloaded attachment files are processed as `Buffer` objects in memory and never written to disk. This avoids temporary file security concerns and simplifies cleanup.

### Rate Limiting *(Recommended for Production)*
```bash
npm install express-rate-limit
```
```typescript
import rateLimit from 'express-rate-limit';

const limiter = rateLimit({ windowMs: 60_000, max: 20 });
app.use('/api/fetch-story',    limiter);
app.use('/api/generate-tests', limiter);
```

---

## 12. Implementation Plan

### Phase 1 — Project Scaffolding
- [ ] Initialise monorepo with npm workspaces (`backend` + `frontend`)
- [ ] Configure TypeScript (strict mode), ESLint, and Prettier for both workspaces
- [ ] Set up `concurrently` in root `package.json` for unified dev start
- [ ] Create `.env` with all required variables; add `.env` to `.gitignore`

### Phase 2 — Backend Core
- [ ] Scaffold Express server with CORS, body parser, health endpoint, and error middleware (`server.ts`)
- [ ] Implement Zod schemas (`schemas.ts`) for all request/response types
- [ ] Implement `openaiClient.ts` wrapping `@openai/openai-node` with env-driven config
- [ ] Port and extend `prompt.ts` — update `buildPrompt()` to accept `prdContent` parameter
- [ ] Implement `POST /api/generate-tests` route (swap Groq → OpenAI client)

### Phase 3 — ClickUp Integration
- [ ] Implement `clickupClient.ts`: `extractTaskId()`, `fetchTask()`, `listAttachments()`, `downloadAttachment()`, `extractAcceptanceCriteria()`, `filterPrdAttachments()`
- [ ] Implement `pdfParser.ts` (pdf-parse) and `docxParser.ts` (mammoth)
- [ ] Implement `parseAttachments()` orchestrator (filter → download → parse → truncate)
- [ ] Implement `POST /api/fetch-story` route combining all of the above

### Phase 4 — Frontend
- [ ] Scaffold React + Vite + TypeScript project
- [ ] Implement `types.ts` (interfaces matching backend schemas)
- [ ] Implement `api.ts` client (`fetchStory`, `generateTests`) with typed responses
- [ ] Build `ClickUpForm` component (task input, loading state, StoryPreview panel)
- [ ] Build `StoryPreview` component (read-only display of fetched data + attachment list)
- [ ] Build `ManualForm` component (fallback for non-ClickUp usage)
- [ ] Build `TestResults` + `TestCaseCard` components (category badges, copy-to-clipboard)
- [ ] Wire up `App.tsx` global state and tab navigation

### Phase 5 — Testing & Hardening
- [ ] Unit tests for `extractTaskId()`, `parseAttachments()`, `buildPrompt()`
- [ ] Integration tests for `/api/fetch-story` and `/api/generate-tests` using mocked APIs
- [ ] End-to-end test with a real ClickUp task (staging workspace)
- [ ] Add rate limiting, request logging (`morgan`), and structured error responses
- [ ] Security review: no secrets in frontend bundle, CORS config validation

---

## 13. Key Implementation References

### v1 → v2 Migration Diff

| Aspect | v1 (Groq) | v2 (OpenAI) |
|---|---|---|
| **LLM Client** | Custom `node-fetch` wrapper | Official `@openai/openai-node` SDK |
| **Auth Env Var** | `groq_API_KEY` | `OPENAI_API_KEY` |
| **Model** | `openai/gpt-oss-120b` | `gpt-4o` (configurable) |
| **JSON Enforcement** | Prompt instruction only | `response_format: { type: 'json_object' }` |
| **Input Source** | Manual form only | ClickUp fetch + manual fallback |
| **PRD Support** | None | PDF + DOCX parsing from ClickUp attachments |
| **New Routes** | `/api/generate-tests` only | + `/api/fetch-story` |
| **New Backend Files** | — | `clickupClient.ts`, `pdfParser.ts`, `docxParser.ts` |
| **New Frontend Components** | — | `ClickUpForm`, `StoryPreview`, `ErrorBanner` |

---

### Key Function Signatures

```typescript
// ── ClickUp ──────────────────────────────────────────────────────────────────
extractTaskId(input: string): string
fetchTask(taskId: string): Promise<ClickUpTask>
listAttachments(taskId: string): Promise<Attachment[]>
downloadAttachment(url: string): Promise<Buffer>
extractAcceptanceCriteria(task: ClickUpTask): string
filterPrdAttachments(attachments: Attachment[]): Attachment[]

// ── Parsers ──────────────────────────────────────────────────────────────────
extractPdfText(buffer: Buffer): Promise<string>
extractDocxText(buffer: Buffer): Promise<string>

// ── OpenAI ───────────────────────────────────────────────────────────────────
generateTestCases(systemPrompt: string, userPrompt: string):
  Promise<{ content: string; usage: OpenAI.CompletionUsage | undefined }>

// ── Prompt ───────────────────────────────────────────────────────────────────
buildPrompt(opts: BuildPromptOptions): string
```

---

### Root `package.json` Scripts

```json
{
  "workspaces": ["backend", "frontend"],
  "scripts": {
    "install:all": "npm install && npm install --workspace=backend && npm install --workspace=frontend",
    "dev":         "concurrently \"npm run dev --workspace=backend\" \"npm run dev --workspace=frontend\"",
    "build":       "npm run build --workspace=backend && npm run build --workspace=frontend",
    "typecheck":   "npm run typecheck --workspace=backend && npm run typecheck --workspace=frontend"
  }
}
```

---

## 14. Summary & Quick Start

### What Changed from v1

- **OpenAI replaces Groq** — the official SDK is more stable, supports `response_format: json_object` for guaranteed JSON output, and gives access to GPT-4o for higher-quality test case generation.

- **ClickUp integration eliminates manual copy-paste** — testers paste a task URL, and the system automatically retrieves the story title, description, acceptance criteria (from custom fields or markdown parsing), and PRD documents attached to the task.

### What Stays the Same

- TypeScript end-to-end (backend + frontend)
- Zod validation at every boundary
- Clean separation of concerns between frontend and backend
- Monorepo structure — easy to run locally, deploy independently

---

### Quick Start

```bash
# 1. Clone the repository
git clone <repo-url>
cd user-story-to-tests

# 2. Create .env (copy template and fill in your keys)
cp .env.example .env
# → Set OPENAI_API_KEY and CLICKUP_API_KEY

# 3. Install all dependencies
npm run install:all

# 4. Start both frontend and backend
npm run dev

# 5. Open in browser
open http://localhost:5173
```

---

*User Story to Tests v2.0 · Architecture & Implementation Guide · March 2026*
