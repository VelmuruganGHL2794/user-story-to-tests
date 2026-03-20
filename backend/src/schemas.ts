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
