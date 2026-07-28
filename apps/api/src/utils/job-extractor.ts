import { load } from 'cheerio';

function cleanText(text: string) {
  return text
    .replace(/\s+/g, ' ')
    .replace(/\n\s*\n/g, '\n')
    .trim();
}

function isValidUrl(value: string) {
  try {
    const url = new URL(value);
    return url.protocol === 'http:' || url.protocol === 'https:';
  } catch {
    return false;
  }
}

export function extractJobTextFromHtml(html: string) {
  const $ = load(html);
  $('script, style, noscript, svg, nav, footer, header, form').remove();

  const prioritizedSelectors = [
    'main',
    'article',
    "[role='main']",
    '.job-description',
    '.jobDescriptionContent',
    '.description',
    '.posting-description',
    '.jobs-description',
  ];

  let extracted = '';
  for (const selector of prioritizedSelectors) {
    const candidate = $(selector).first().text();
    if (candidate && candidate.trim().length > 200) {
      extracted = candidate;
      break;
    }
  }

  if (!extracted) extracted = $('body').text();
  return cleanText(extracted);
}

export async function resolveJobDescription(input: string, maxChars: number) {
  if (!isValidUrl(input)) {
    return {
      source: 'text' as const,
      text: cleanText(input).slice(0, maxChars),
    };
  }

  const response = await fetch(input, {
    headers: {
      'User-Agent': 'Mozilla/5.0 PitchPilotBot/1.0',
      Accept: 'text/html,application/xhtml+xml',
    },
    cache: 'no-store',
  });

  if (!response.ok) throw new Error(`Failed to fetch URL (${response.status})`);
  const html = await response.text();
  const extractedText = extractJobTextFromHtml(html);
  if (!extractedText)
    throw new Error('Could not extract readable job description from URL');
  return { source: 'url' as const, text: extractedText.slice(0, maxChars) };
}
