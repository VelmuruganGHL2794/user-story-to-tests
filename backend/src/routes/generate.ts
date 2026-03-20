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
