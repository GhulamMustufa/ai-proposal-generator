const BLOCK_TAGS_RE = /<\/?(p|div|br|h[1-6]|li|tr|blockquote|pre|section|article|header|footer|ul|ol)[^>]*\s*\/?>/gi;

const ENTITIES: Record<string, string> = {
  "&amp;": "&",
  "&lt;": "<",
  "&gt;": ">",
  "&nbsp;": " ",
  "&quot;": '"',
  "&apos;": "'",
  "&#39;": "'",
  "&mdash;": "—",
  "&ndash;": "–",
  "&hellip;": "...",
  "&bull;": "•",
  "&copy;": "©",
  "&reg;": "®",
  "&trade;": "™",
};

export function cleanDescription(raw: string): string {
  return (
    raw
      // Remove script/style blocks entirely
      .replace(/<(script|style)[^>]*>[\s\S]*?<\/\1>/gi, "")
      // Replace block-level tags with a newline so paragraphs don't run together
      .replace(BLOCK_TAGS_RE, "\n")
      // Strip all remaining tags
      .replace(/<[^>]+>/g, "")
      // Decode named HTML entities
      .replace(/&[a-z]+;/gi, (e) => ENTITIES[e.toLowerCase()] ?? e)
      // Decode decimal numeric entities (e.g. &#8212;)
      .replace(/&#(\d+);/g, (_, n) => String.fromCodePoint(Number(n)))
      // Decode hex numeric entities (e.g. &#x2014;)
      .replace(/&#x([0-9a-f]+);/gi, (_, h) => String.fromCodePoint(parseInt(h, 16)))
      // Normalize line endings
      .replace(/\r\n?/g, "\n")
      // Collapse runs of spaces/tabs on a single line (not newlines)
      .replace(/[^\S\n]+/g, " ")
      // Trim leading/trailing space from each line
      .replace(/^ +| +$/gm, "")
      // Collapse more than two consecutive blank lines into one
      .replace(/\n{3,}/g, "\n\n")
      .trim()
  );
}
