import axios from 'axios';
import { getEnv } from '@vellum/shared';
import { logAi } from '../logger';

/**
 * Use Gemini with Google Search to fetch, extract, and summarize URL content
 */
export async function fulfillUrlsum(
  input: { url: string }
): Promise<{ bullets: string[]; entities: string[]; summary: string }> {
  const env = getEnv();
  const endpoint = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent';
  
  // Normalize URL - add https:// if missing
  const normalizedUrl = input.url.startsWith('http://') || input.url.startsWith('https://') 
    ? input.url 
    : `https://${input.url}`;
  
  const prompt = [
    `Visit this URL and analyze its content: ${normalizedUrl}`,
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

  let data: any;
  let geminiStartTime = 0;
  try {
    logAi('request', { 
      provider: 'gemini', 
      model: 'gemini-2.5-flash', 
      endpoint, 
      promptLen: prompt.length
    });
    geminiStartTime = Date.now();
    
    ({ data } = await axios.post(
      endpoint,
      {
        contents: [
          {
            role: 'user',
            parts: [{ text: prompt }],
          },
        ],
        tools: [
          {
            googleSearch: {},
          },
        ],
        generationConfig: {
          candidateCount: 1,
          temperature: 0.3,
        },
      },
      {
        headers: {
          'Content-Type': 'application/json',
          'x-goog-api-key': env.GEMINI_API_KEY,
        },
        timeout: 30000,
      }
    ));
    
    logAi('response', { 
      provider: 'gemini', 
      model: 'gemini-2.5-flash', 
      endpoint, 
      durationMs: Date.now() - geminiStartTime, 
      status: 200, 
      candidates: data?.candidates?.length 
    });
  } catch (error) {
    if (axios.isAxiosError(error)) {
      const status = error.response?.status;
      const apiError = (error.response?.data as any)?.error;
      const apiMessage = apiError?.message ?? error.message;
      const statusLabel = status ? ` (${status})` : '';
      const statusCode = apiError?.status ? ` [${apiError.status}]` : '';
      logAi('error', { 
        provider: 'gemini', 
        model: 'gemini-2.5-flash', 
        endpoint, 
        status, 
        message: apiMessage 
      });
      throw new Error(`Gemini URL summarization failed${statusLabel}${statusCode}: ${apiMessage}`);
    }
    throw error;
  }

  const textPart = data?.candidates?.[0]?.content?.parts?.find((p: any) => p.text)?.text;
  
  if (!textPart) {
    throw new Error('Gemini did not return a summary for the URL');
  }

  console.log('Gemini response:', textPart.substring(0, 500)); // Debug log

  // Try multiple parsing strategies
  let summary = '';
  let bullets: string[] = [];
  let entities: string[] = [];

  // Strategy 1: Try structured format with headers
  const summaryMatch = textPart.match(/SUMMARY:\s*\n([\s\S]*?)(?=\n\s*BULLETS:|\n\s*ENTITIES:|$)/i);
  const bulletsMatch = textPart.match(/BULLETS:\s*\n([\s\S]*?)(?=\n\s*ENTITIES:|$)/i);
  const entitiesMatch = textPart.match(/ENTITIES:\s*\n([\s\S]*?)$/i);

  if (summaryMatch) {
    summary = summaryMatch[1].trim();
  }

  if (bulletsMatch) {
    bullets = bulletsMatch[1]
      .split('\n')
      .map((line: string) => line.trim())
      .filter((line: string) => line.startsWith('-') || line.startsWith('•') || line.startsWith('*'))
      .map((line: string) => line.replace(/^[-•*]\s*/, '').trim())
      .filter((line: string) => line.length > 0);
  }

  if (entitiesMatch) {
    entities = entitiesMatch[1]
      .split(/,|\n/)
      .map((e: string) => e.trim())
      .filter((e: string) => e.length > 0 && !e.startsWith('-') && !e.startsWith('•'));
  }

  // Strategy 2: Fallback - extract bullets from anywhere in response
  if (bullets.length === 0) {
    const lines = textPart.split('\n');
    bullets = lines
      .filter((line: string) => {
        const trimmed = line.trim();
        return (trimmed.startsWith('-') || trimmed.startsWith('•') || trimmed.startsWith('*')) && trimmed.length > 3;
      })
      .map((line: string) => line.trim().replace(/^[-•*]\s*/, '').trim())
      .filter((line: string) => line.length > 10); // Filter very short bullets
  }

  // Strategy 3: If no summary found, use first paragraph
  if (!summary) {
    const paragraphs = textPart.split(/\n\n+/).filter((p: string) => p.trim().length > 50);
    if (paragraphs.length > 0) {
      summary = paragraphs[0].trim().replace(/^(SUMMARY:|Summary:)\s*/i, '');
    }
  }

  // Strategy 4: Extract entities from text if not found
  if (entities.length === 0) {
    // Look for capitalized words that might be entities
    const words = textPart.match(/\b[A-Z][a-z]+(?:\s+[A-Z][a-z]+)*\b/g) || [];
    const uniqueWords = [...new Set(words)] as string[];
    const uniqueEntities = uniqueWords.filter((w: string) => 
      w.length > 2 && !['The', 'This', 'That', 'These', 'Those', 'Summary', 'Bullets', 'Entities'].includes(w)
    );
    entities = uniqueEntities.slice(0, 15);
  }

  // Final validation
  if (!summary && bullets.length === 0) {
    // Last resort: use the raw text as summary and extract sentences as bullets
    summary = textPart.substring(0, 300).trim();
    const sentences = textPart.split(/[.!?]+/).filter((s: string) => s.trim().length > 20);
    bullets = sentences.slice(0, 7).map((s: string) => s.trim());
  }

  return {
    summary: summary || 'Unable to generate summary from the provided URL.',
    bullets: bullets.slice(0, 10),
    entities: entities.slice(0, 15),
  };
}

