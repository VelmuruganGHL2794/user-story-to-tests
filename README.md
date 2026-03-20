# User Story to Tests

An AI-powered tool that automatically generates comprehensive test cases from user stories. Supports importing stories directly from ClickUp or entering them manually, then uses OpenAI to produce structured test cases across five categories: Positive, Negative, Edge, Authorization, and Non-Functional.

---

## Table of Contents

- [Features](#features)
- [Architecture](#architecture)
- [Prerequisites](#prerequisites)
- [Getting Started](#getting-started)
  - [1. Clone the Repository](#1-clone-the-repository)
  - [2. Install Dependencies](#2-install-dependencies)
  - [3. Configure Environment Variables](#3-configure-environment-variables)
  - [4. Run in Development Mode](#4-run-in-development-mode)
- [Building for Production](#building-for-production)
- [Running Tests](#running-tests)
- [API Reference](#api-reference)
  - [Health Check](#health-check)
  - [Fetch Story from ClickUp](#fetch-story-from-clickup)
  - [Generate Test Cases](#generate-test-cases)
- [Usage Guide](#usage-guide)
  - [ClickUp Import Flow](#clickup-import-flow)
  - [Manual Entry Flow](#manual-entry-flow)
- [Project Structure](#project-structure)
- [Configuration Reference](#configuration-reference)
- [Troubleshooting](#troubleshooting)

---

## Features

- **ClickUp Integration** — Import user stories directly by task URL or ID. Automatically extracts title, description, acceptance criteria, and attached PRD documents (PDF/DOCX).
- **Manual Entry** — Paste or type user stories and acceptance criteria directly into the UI.
- **AI-Powered Generation** — Uses OpenAI (GPT-4o by default) with structured JSON output to produce detailed test cases.
- **Five Test Categories** — Generates Positive, Negative, Edge, Authorization, and Non-Functional test cases.
- **Structured Output** — Each test case includes an ID, title, category, step-by-step actions with expected results, test data, and an overall expected result.
- **Rate Limiting** — Built-in API rate limiting (20 requests/minute) to prevent abuse.
- **Input Validation** — Zod-based request/response validation on both endpoints.
- **Token Usage Tracking** — Displays the OpenAI model used and token consumption for each generation.

---

## Architecture

| Layer    | Technology                          |
|----------|-------------------------------------|
| Frontend | React 18, TypeScript, Vite          |
| Backend  | Node.js, Express, TypeScript        |
| AI       | OpenAI API (GPT-4o, JSON mode)      |
| PM Tool  | ClickUp API v2                      |
| Parsing  | mammoth (DOCX), pdf-parse (PDF)     |
| Validation | Zod                               |
| Testing  | Vitest, Supertest                   |

The project uses **npm workspaces** with two packages: `backend` and `frontend`.

---

## Prerequisites

- **Node.js** >= 18.x
- **npm** >= 9.x
- An **OpenAI API key** ([platform.openai.com](https://platform.openai.com))
- *(Optional)* A **ClickUp API key** — only needed if using the ClickUp import feature ([app.clickup.com/settings/apps](https://app.clickup.com/settings/apps))

---

## Getting Started

### 1. Clone the Repository

```bash
git clone https://github.com/VelmuruganGHL2794/user-story-to-tests.git
cd user-story-to-tests
```

### 2. Install Dependencies

Install all dependencies (root + both workspaces) in one command:

```bash
npm install
```

Or use the explicit script:

```bash
npm run install:all
```

### 3. Configure Environment Variables

Copy the example file and fill in your keys:

```bash
cp .env.example .env
```

Edit `.env` with your values:

```
# Server
PORT=8080
CORS_ORIGIN=http://localhost:5173

# OpenAI (required)
OPENAI_API_KEY=sk-proj-your-key-here
OPENAI_MODEL=gpt-4o
OPENAI_TEMPERATURE=0.2
OPENAI_MAX_TOKENS=2500

# ClickUp (optional — only for ClickUp import)
CLICKUP_API_KEY=pk_your-key-here

# Frontend
VITE_API_BASE_URL=http://localhost:8080/api
```

> **Important:** Never commit your `.env` file. It is already listed in `.gitignore`.

### 4. Run in Development Mode

Start both the backend and frontend concurrently:

```bash
npm run dev
```

This runs:
- **Backend** at `http://localhost:8080` (via `tsx watch` with hot reload)
- **Frontend** at `http://localhost:5173` (via Vite dev server)

To run them individually:

```bash
# Backend only
npm run dev --workspace=backend

# Frontend only
npm run dev --workspace=frontend
```

---

## Building for Production

Compile TypeScript and build the Vite frontend:

```bash
npm run build
```

This runs the build script in both workspaces:
- **Backend** — `tsc` compiles to `backend/dist/`
- **Frontend** — `tsc && vite build` outputs to `frontend/dist/`

Start the production backend server:

```bash
npm start --workspace=backend
```

Serve the frontend `dist/` folder with any static file server (e.g., `npx serve frontend/dist`).

To type-check without emitting files:

```bash
npm run typecheck
```

---

## Running Tests

The backend includes unit and integration tests using Vitest:

```bash
# Run all tests once
npm test

# Run tests in watch mode
npm run test:watch --workspace=backend

# Run tests with coverage report
npm run test:coverage --workspace=backend
```

---

## API Reference

All endpoints are prefixed with `/api`. Rate limited to 20 requests per minute.

### Health Check

```
GET /api/health
```

**Response:**

```json
{ "status": "ok", "version": "2.0.0" }
```

### Fetch Story from ClickUp

```
POST /api/fetch-story
Content-Type: application/json
```

**Request body:**

| Field       | Type   | Required | Description                              |
|-------------|--------|----------|------------------------------------------|
| `taskInput` | string | Yes      | ClickUp task URL or task ID              |

**Example:**

```json
{ "taskInput": "https://app.clickup.com/t/abc123" }
```

**Response:**

```json
{
  "taskId": "abc123",
  "title": "User login feature",
  "description": "As a user, I want to log in...",
  "acceptanceCriteria": "Given valid credentials...",
  "prdContent": "[requirements.pdf]\nExtracted text...",
  "attachments": [
    { "name": "requirements.pdf", "type": "pdf", "size": 204800 }
  ]
}
```

### Generate Test Cases

```
POST /api/generate-tests
Content-Type: application/json
```

**Request body:**

| Field                | Type   | Required | Description                              |
|----------------------|--------|----------|------------------------------------------|
| `storyTitle`         | string | Yes      | Title of the user story                  |
| `acceptanceCriteria` | string | Yes      | Acceptance criteria text                 |
| `description`        | string | No       | Story description                        |
| `prdContent`         | string | No       | Extracted PRD document text              |
| `additionalInfo`     | string | No       | Extra context or notes for the AI        |

**Example:**

```json
{
  "storyTitle": "User login feature",
  "acceptanceCriteria": "Given valid credentials, the user should be authenticated",
  "description": "As a user, I want to log in so that I can access my dashboard",
  "additionalInfo": "Supports SSO via Google"
}
```

**Response:**

```json
{
  "testCases": [
    {
      "id": "TC001",
      "title": "Verify successful login with valid credentials",
      "category": "Positive",
      "steps": [
        { "stepNo": "S01", "action": "Navigate to login page", "expectedResult": "Login form is displayed" },
        { "stepNo": "S02", "action": "Enter valid email and password", "expectedResult": "Fields accept input" },
        { "stepNo": "S03", "action": "Click Sign In", "expectedResult": "User is redirected to dashboard" }
      ],
      "testData": "email: user@example.com, password: ValidPass123",
      "expectedResult": "User is authenticated and sees the dashboard"
    }
  ],
  "model": "gpt-4o",
  "totalTokens": 1850,
  "promptTokens": 620,
  "completionTokens": 1230
}
```

---

## Usage Guide

### ClickUp Import Flow

1. Open the app at `http://localhost:5173`.
2. On the **ClickUp Import** tab, paste a ClickUp task URL (e.g., `https://app.clickup.com/t/abc123`) or a plain task ID.
3. Click **Fetch Story**. The app pulls the title, description, acceptance criteria, and any attached PRD documents (PDF/DOCX).
4. Review the imported story data. Optionally add notes in the **Additional Info** field.
5. Click **Generate Tests**. The AI produces structured test cases across all five categories.
6. Switch to the **Results** tab to view, review, and copy the generated test cases.

### Manual Entry Flow

1. Open the app and switch to the **Manual Entry** tab.
2. Fill in the **Story Title** and **Acceptance Criteria** (required).
3. Optionally provide a **Description** and **Additional Info** for richer test generation.
4. Click **Generate Tests**.
5. View results on the **Results** tab.

---

## Project Structure

```
user-story-to-tests/
├── .env.example                  # Environment variable template
├── .gitignore
├── package.json                  # Root workspace config & shared scripts
├── package-lock.json
├── ARCHITECTURE.md               # Detailed architecture documentation
│
├── backend/
│   ├── package.json              # Backend dependencies & scripts
│   ├── tsconfig.json
│   ├── vitest.config.ts
│   └── src/
│       ├── server.ts             # Entry point — starts Express server
│       ├── app.ts                # Express app setup (CORS, rate limiting, routes)
│       ├── schemas.ts            # Zod schemas for request/response validation
│       ├── prompt.ts             # System prompt & user prompt builder for OpenAI
│       ├── routes/
│       │   ├── fetchStory.ts     # POST /api/fetch-story — ClickUp integration
│       │   └── generate.ts       # POST /api/generate-tests — OpenAI generation
│       ├── integrations/
│       │   ├── clickupClient.ts  # ClickUp API client (tasks, attachments)
│       │   └── openaiClient.ts   # OpenAI API client (chat completions)
│       ├── parsers/
│       │   ├── pdfParser.ts      # PDF text extraction
│       │   └── docxParser.ts     # DOCX text extraction
│       └── __tests__/            # Unit & integration tests
│
└── frontend/
    ├── package.json              # Frontend dependencies & scripts
    ├── tsconfig.json
    ├── vite.config.ts
    ├── index.html                # Vite entry HTML
    └── src/
        ├── main.tsx              # React entry point
        ├── App.tsx               # Main app component with tab navigation
        ├── api.ts                # API client functions
        ├── types.ts              # TypeScript interfaces
        └── components/
            ├── ClickUpForm.tsx   # ClickUp import form
            ├── ManualForm.tsx    # Manual story entry form
            ├── StoryPreview.tsx  # Imported story data preview
            ├── TestResults.tsx   # Test case results display
            ├── TestCaseCard.tsx  # Individual test case card
            └── ErrorBanner.tsx   # Error notification banner
```

---

## Configuration Reference

| Variable              | Default                     | Description                                      |
|-----------------------|-----------------------------|--------------------------------------------------|
| `PORT`                | `8080`                      | Backend server port                              |
| `CORS_ORIGIN`         | `http://localhost:5173`     | Allowed CORS origin for the frontend             |
| `OPENAI_API_KEY`      | *(required)*                | Your OpenAI API key                              |
| `OPENAI_MODEL`        | `gpt-4o`                   | OpenAI model to use for generation               |
| `OPENAI_TEMPERATURE`  | `0.2`                      | Sampling temperature (lower = more deterministic)|
| `OPENAI_MAX_TOKENS`   | `2500`                     | Maximum tokens in the AI response                |
| `CLICKUP_API_KEY`     | *(optional)*                | ClickUp personal API token                       |
| `VITE_API_BASE_URL`   | `http://localhost:8080/api` | Backend API URL used by the frontend             |

---

## Troubleshooting

| Problem | Solution |
|---------|----------|
| `OPENAI_API_KEY environment variable is not set` | Create a `.env` file in the project root with your key. See [Configure Environment Variables](#3-configure-environment-variables). |
| `CLICKUP_API_KEY environment variable is not set` | Add your ClickUp API key to `.env`, or use the Manual Entry tab instead. |
| `ClickUp fetch failed: 401` | Your ClickUp API key is invalid or expired. Generate a new one at [app.clickup.com/settings/apps](https://app.clickup.com/settings/apps). |
| `ClickUp fetch failed: 404` | The task ID or URL is incorrect, or you don't have access to that task. |
| `Too many requests, please try again later` | Rate limit exceeded (20 req/min). Wait a minute and retry. |
| Frontend can't reach backend | Ensure both services are running and `VITE_API_BASE_URL` in `.env` matches the backend URL. |
| `npm install` fails | Make sure you're using Node.js >= 18. Run `node -v` to check. |
| OpenAI returns incomplete test cases | Increase `OPENAI_MAX_TOKENS` in `.env` (e.g., `4000`). |
