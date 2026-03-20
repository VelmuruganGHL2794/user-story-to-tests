import type { StoryData, GenerateRequest, GenerateResponse } from './types';

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
