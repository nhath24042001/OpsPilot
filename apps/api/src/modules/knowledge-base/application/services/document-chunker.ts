export type TextChunk = {
  chunkIndex: number;
  content: string;
  tokenCount: number;
};

type ChunkOptions = {
  maxChars: number;
  overlapChars: number;
};

const DEFAULT_OPTIONS: ChunkOptions = {
  maxChars: 1200,
  overlapChars: 160,
};

const normalizeText = (text: string): string =>
  text
    .replace(/\r\n/g, '\n')
    .replace(/[ \t]+\n/g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim();

const estimateTokens = (text: string): number => {
  const words = text.match(/\S+/g);
  return words?.length ?? 0;
};

const findBoundary = (text: string, start: number, hardEnd: number): number => {
  const window = text.slice(start, hardEnd);
  const paragraph = window.lastIndexOf('\n\n');
  if (paragraph > Math.floor(window.length * 0.5)) {
    return start + paragraph;
  }

  const newline = window.lastIndexOf('\n');
  if (newline > Math.floor(window.length * 0.6)) {
    return start + newline;
  }

  const sentence = Math.max(window.lastIndexOf('. '), window.lastIndexOf('? '), window.lastIndexOf('! '));
  if (sentence > Math.floor(window.length * 0.6)) {
    return start + sentence + 1;
  }

  return hardEnd;
};

export const chunkDocumentText = (
  rawText: string,
  options: Partial<ChunkOptions> = {},
): TextChunk[] => {
  const text = normalizeText(rawText);
  if (text.length === 0) {
    return [];
  }

  const maxChars = options.maxChars ?? DEFAULT_OPTIONS.maxChars;
  const overlapChars = Math.min(options.overlapChars ?? DEFAULT_OPTIONS.overlapChars, maxChars - 1);
  const chunks: TextChunk[] = [];
  let start = 0;

  while (start < text.length) {
    const hardEnd = Math.min(start + maxChars, text.length);
    const end = hardEnd === text.length ? hardEnd : findBoundary(text, start, hardEnd);
    const content = text.slice(start, end).trim();

    if (content.length > 0) {
      chunks.push({
        chunkIndex: chunks.length,
        content,
        tokenCount: estimateTokens(content),
      });
    }

    if (end === text.length) {
      break;
    }

    start = Math.max(end - overlapChars, start + 1);
  }

  return chunks;
};
