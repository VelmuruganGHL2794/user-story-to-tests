import { Router } from 'express';
import { FetchStoryRequestSchema } from '../schemas';
import {
  extractTaskId, fetchTask, extractAcceptanceCriteria,
  listAttachments, filterPrdAttachments, downloadAttachment,
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

    const raw        = texts.join('\n\n---\n\n');
    const prdContent = raw.length > MAX_PRD_CHARS
      ? raw.slice(0, MAX_PRD_CHARS) + '\n...[truncated]'
      : raw;

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
