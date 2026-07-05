/** Gate utilities — normalization, byte counting, negation guard. */

const HTML_ENTITIES: Record<string, string> = {
  "&amp;": "&",
  "&lt;": "<",
  "&gt;": ">",
  "&quot;": '"',
  "&#39;": "'",
  "&nbsp;": " ",
};

const NEGATION_CUES = [
  "never",
  "banned",
  "do not",
  "don't",
  "there is no",
  "avoid",
  "not intended",
  "not ",
];

export function normalize(text: string): string {
  let result = text
    .replace(/[\u2018\u2019]/g, "'")
    .replace(/[\u201C\u201D]/g, '"')
    .replace(/[\u2013\u2014]/g, "-");

  for (const [entity, char] of Object.entries(HTML_ENTITIES)) {
    result = result.split(entity).join(char);
  }

  return result.replace(/\s+/g, " ").trim();
}

export function utf8Bytes(value: string): number {
  return new TextEncoder().encode(value).length;
}

/** True when ~90 preceding chars contain negation cues (term used to prohibit itself). */
export function hasNegationContext(text: string, matchIndex: number): boolean {
  const start = Math.max(0, matchIndex - 90);
  const preceding = text.slice(start, matchIndex).toLowerCase();
  return NEGATION_CUES.some((cue) => preceding.includes(cue));
}

export function equalsNormalized(a: string, b: string): boolean {
  return normalize(a) === normalize(b);
}
