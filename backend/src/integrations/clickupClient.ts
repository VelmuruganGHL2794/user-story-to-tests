import fetch from 'node-fetch';

const BASE_URL = 'https://api.clickup.com/api/v2';

export interface ClickUpTask {
  id: string;
  name: string;
  description: string;
  custom_fields: { name: string; value: unknown }[];
}

export interface Attachment {
  id: string;
  title: string;
  url: string;
  extension: string;
  size: number;
}

function getApiKey(): string {
  const key = process.env.CLICKUP_API_KEY;
  if (!key) {
    throw new Error('CLICKUP_API_KEY environment variable is not set. Add it to your .env file.');
  }
  return key;
}

export function extractTaskId(input: string): string {
  const urlMatch = input.match(/\/t\/(?:[^/]+\/)?([a-zA-Z0-9]+)\/?$/);
  if (urlMatch) return urlMatch[1];
  if (/^[a-zA-Z0-9]+$/.test(input.trim())) return input.trim();
  throw new Error('Invalid ClickUp task URL or ID');
}

export async function fetchTask(taskId: string): Promise<ClickUpTask> {
  const res = await fetch(`${BASE_URL}/task/${taskId}`, {
    headers: { Authorization: `Bearer ${getApiKey()}` },
  });
  if (!res.ok) throw new Error(`ClickUp fetch failed: ${res.status}`);
  return res.json() as Promise<ClickUpTask>;
}

export async function listAttachments(taskId: string): Promise<Attachment[]> {
  const res = await fetch(`${BASE_URL}/task/${taskId}/attachment`, {
    headers: { Authorization: `Bearer ${getApiKey()}` },
  });
  if (!res.ok) return [];
  const data = (await res.json()) as { attachments: Attachment[] };
  return data.attachments ?? [];
}

export async function downloadAttachment(url: string): Promise<Buffer> {
  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${getApiKey()}` },
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
