import OpenAI from 'openai';

let _client: OpenAI | null = null;

function getClient(): OpenAI {
  if (!_client) {
    if (!process.env.OPENAI_API_KEY) {
      throw new Error('OPENAI_API_KEY environment variable is not set. Add it to your .env file.');
    }
    _client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  }
  return _client;
}

export async function generateTestCases(
  systemPrompt: string,
  userPrompt: string
): Promise<{ content: string; usage: OpenAI.CompletionUsage | undefined }> {
  const openai = getClient();

  const response = await openai.chat.completions.create({
    model:           process.env.OPENAI_MODEL       ?? 'gpt-4o',
    temperature:     Number(process.env.OPENAI_TEMPERATURE ?? 0.2),
    max_tokens:      Number(process.env.OPENAI_MAX_TOKENS  ?? 2500),
    response_format: { type: 'json_object' },
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
