import axios from 'axios';
import { getEnv } from '@vellum/shared';
import { logAi } from '../logger';
import { chatComplete } from '../ai/openrouter';
import { Readability } from '@mozilla/readability';
import { parseHTML } from 'linkedom';

/**
 * Fetch, extract, and summarize URL content via OpenRouter (text models)
 */
export async function fulfillUrlsum(
  input: { url: string },
  model = 'openrouter/auto'
): Promise<{ bullets: string[]; entities: string[]; summary: string }> {
  getEnv(); // ensure env loaded for OpenRouter headers
  // Normalize URL - add https:// if missing
  const normalizedUrl = input.url.startsWith('http://') || input.url.startsWith('https://')
    ? input.url
    : `https://${input.url}`;

  // Fetch HTML (best-effort)
  let html = '';
  try {
    const { data } = await axios.get(normalizedUrl, {
      responseType: 'text',
      headers: { 'Accept': 'text/html,application/xhtml+xml' },
      timeout: 15000,
      maxContentLength: 2 * 1024 * 1024,
    });
    html = String(data || '');
  } catch {
    html = '';
  }

  // Extract readable text
  let pageText = '';
  try {
    const { document } = parseHTML(html || '');
    const reader = new Readability(document as any);
    const article = reader.parse();
    const textContent = article?.textContent || document.body?.textContent || '';
    pageText = textContent.replace(/\s+/g, ' ').trim();
  } catch {
    pageText = '';
  }
  // Truncate prompt context
  const MAX_CHARS = 8000;
  if (pageText.length > MAX_CHARS) {
    pageText = pageText.slice(0, MAX_CHARS);
  }

  const system = [
    'You summarize webpages for users. Return a concise, structured output.',
    'Follow the requested output format exactly.',
  ].join('\n');
  const user = [
    `Summarize the following webpage content from: ${normalizedUrl}`,
    '',
    'CONTENT:',
    pageText || '(Content could not be fetched. Summarize the page based on the URL hints.)',
    '',
    'Provide:',
    '- A brief 2-3 sentence summary',
    '- 5-7 key bullet points of the main information',
    '- 5-10 important entities (people, organizations, products, locations)',
    '',
    'Format your response EXACTLY like this:',
    '',
    'SUMMARY:',
    '[your summary here]',
    '',
    'BULLETS:',
    '- [bullet 1]',
    '- [bullet 2]',
    '...',
    '',
    'ENTITIES:',
    '[entity1], [entity2], [entity3], ...',
  ].join('\n');

  const endpoint = 'https://openrouter.ai/api/v1/chat/completions';
  logAi('request', {
    provider: 'openrouter',
    model,
    endpoint,
    promptLen: user.length,
  });
  const started = Date.now();
  const { text } = await chatComplete(model, [
    { role: 'system', content: system },
    { role: 'user', content: user },
  ], { temperature: 0.2, max_tokens: 600 });
  logAi('response', {
    provider: 'openrouter',
    model,
    endpoint,
    durationMs: Date.now() - started,
    status: 200,
  });

  // Parse structured result
  let summary = '';
  let bullets: string[] = [];
  let entities: string[] = [];

  const lines = text.split('\n').map((l: string) => l.trim());
  let section: 'none' | 'summary' | 'bullets' | 'entities' = 'none';
  for (const line of lines) {
    if (/^summary:/i.test(line)) { section = 'summary'; continue; }
    if (/^bullets:/i.test(line)) { section = 'bullets'; continue; }
    if (/^entities:/i.test(line)) { section = 'entities'; continue; }
    if (section === 'summary') {
      if (line) summary += (summary ? ' ' : '') + line;
    } else if (section === 'bullets') {
      const m = line.match(/^-+\s*(.+)$/);
      if (m) bullets.push(m[1].trim());
    } else if (section === 'entities') {
      const parts = line.split(/[,;]/).map((s: string) => s.trim()).filter(Boolean);
      if (parts.length) entities.push(...parts);
    }
  }
  // Fallbacks
  if (!summary && text) {
    summary = text.split('\n')[0]?.trim() ?? '';
  }
  if (!bullets.length && text) {
    bullets = text
      .split('\n')
      .filter((l: string) => l.startsWith('- '))
      .map((l: string) => l.replace(/^-+\s*/, '').trim())
      .slice(0, 7);
  }
  entities = Array.from(new Set(entities)).slice(0, 12);

  return {
    summary: summary || 'Unable to generate summary from the provided URL.',
    bullets,
    entities,
  };
}

