import type { GenerateConfigResponse } from '@/types/app-config';
import { parseAndValidateConfig } from '@/utils/validate-config';

const DOCS_URL = 'https://docs.expo.dev/llms-full.txt';
const MAX_DOC_CONTEXT_CHARS = 24_000;
const MAX_DOC_BLOCK_CHARS = 3_000;
const MAX_DOC_BLOCKS = 8;

const SYSTEM_INSTRUCTION = `You are Expo Architect, an expert Expo SDK 55 configurator.
Return only JSON with the shape { "expo": { ... } } suitable for app.json.
Rules:
- Keep output valid JSON, no markdown.
- Use Expo SDK 55 fields and conventions.
- Set web.output to "server" so API routes work.
- If permissions are requested, include android.permissions and relevant ios.infoPlist keys.
- Use concise but production-ready defaults.`;

function withDeadline<T>(promise: Promise<T>, timeoutMs: number, label: string) {
  return Promise.race<T>([
    promise,
    new Promise<T>((_, reject) => {
      setTimeout(() => reject(new Error(`${label} timed out after ${timeoutMs}ms`)), timeoutMs);
    }),
  ]);
}

async function fetchExpoDocs() {
  const response = await withDeadline(fetch(DOCS_URL, { cache: 'no-store' }), 10_000, 'Expo docs fetch');
  if (!response.ok) {
    throw new Error(`Failed to fetch Expo docs context (${response.status}).`);
  }

  return response.text();
}

function buildDocsContext(prompt: string, docs: string) {
  const baseKeywords = [
    'app.json',
    'app config',
    'configuration',
    'expo',
    'orientation',
    'permissions',
    'android.permissions',
    'ios.infoplist',
    'splash',
    'slug',
    'name',
    'web.output',
    'plugins',
  ];

  const promptKeywords = prompt
    .toLowerCase()
    .split(/[^a-z0-9.#_-]+/g)
    .filter((token) => token.length > 2);

  const keywords = Array.from(new Set([...baseKeywords, ...promptKeywords]));
  const blocks = docs.split(/\n{2,}/g).map((block) => block.trim()).filter(Boolean);

  const scoredBlocks = blocks
    .map((block) => {
      const lower = block.toLowerCase();
      let score = 0;
      for (const keyword of keywords) {
        if (lower.includes(keyword)) {
          score += keyword.length > 8 ? 3 : 1;
        }
      }

      if (lower.includes('app.json') || lower.includes('app config')) {
        score += 5;
      }

      return { block, score };
    })
    .filter((item) => item.score > 0)
    .sort((a, b) => b.score - a.score);

  if (scoredBlocks.length === 0) {
    return docs.slice(0, MAX_DOC_CONTEXT_CHARS);
  }

  const selected: string[] = [];
  let totalChars = 0;
  for (const item of scoredBlocks) {
    if (selected.length >= MAX_DOC_BLOCKS || totalChars >= MAX_DOC_CONTEXT_CHARS) {
      break;
    }

    const snippet = item.block.slice(0, MAX_DOC_BLOCK_CHARS);
    if (!snippet) {
      continue;
    }

    selected.push(snippet);
    totalChars += snippet.length;
  }

  return selected.join('\n\n---\n\n').slice(0, MAX_DOC_CONTEXT_CHARS);
}

async function generateWithOpenAI(prompt: string, docs: string) {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return null;
  }

  const model = process.env.OPENAI_MODEL ?? 'gpt-4o-mini';
  const response = await withDeadline(
    fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model,
        response_format: { type: 'json_object' },
        messages: [
          { role: 'system', content: SYSTEM_INSTRUCTION },
          {
            role: 'user',
            content: `Expo docs context:\n${docs}\n\nUser request:\n${prompt}`,
          },
        ],
      }),
    }),
    25_000,
    'OpenAI request'
  );

  if (!response.ok) {
    const payload = await response.text();
    throw new Error(`OpenAI error (${response.status}): ${payload}`);
  }

  const payload = (await response.json()) as {
    choices?: { message?: { content?: string } }[];
  };

  return payload.choices?.[0]?.message?.content ?? null;
}

async function generateWithAnthropic(prompt: string, docs: string) {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return null;
  }

  const model = process.env.ANTHROPIC_MODEL ?? 'claude-3-5-sonnet-20241022';
  const response = await withDeadline(
    fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model,
        max_tokens: 1200,
        system: SYSTEM_INSTRUCTION,
        messages: [
          {
            role: 'user',
            content: `Expo docs context:\n${docs}\n\nUser request:\n${prompt}`,
          },
        ],
      }),
    }),
    25_000,
    'Anthropic request'
  );

  if (!response.ok) {
    const payload = await response.text();
    throw new Error(`Anthropic error (${response.status}): ${payload}`);
  }

  const payload = (await response.json()) as {
    content?: { type?: string; text?: string }[];
  };

  return payload.content?.find((item) => item.type === 'text')?.text ?? null;
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as { prompt?: string };
    const prompt = body.prompt?.trim();

    if (!prompt) {
      return Response.json({ error: 'Missing prompt.' }, { status: 400 });
    }

    const docs = await fetchExpoDocs();
    const docsContext = buildDocsContext(prompt, docs);

    const openAIText = await generateWithOpenAI(prompt, docsContext);
    if (openAIText) {
      const config = parseAndValidateConfig(openAIText);
      const response: GenerateConfigResponse = { config, source: 'openai' };
      return Response.json(response);
    }

    const anthropicText = await generateWithAnthropic(prompt, docsContext);
    if (anthropicText) {
      const config = parseAndValidateConfig(anthropicText);
      const response: GenerateConfigResponse = { config, source: 'anthropic' };
      return Response.json(response);
    }

    return Response.json(
      {
        error:
          'No model credentials found. Set OPENAI_API_KEY or ANTHROPIC_API_KEY in your environment.',
      },
      { status: 500 }
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to generate config.';
    return Response.json({ error: message }, { status: 500 });
  }
}
