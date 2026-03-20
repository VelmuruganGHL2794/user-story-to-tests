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
