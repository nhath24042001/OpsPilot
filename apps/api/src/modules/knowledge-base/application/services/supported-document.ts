const SUPPORTED_CONTENT_TYPES = new Set([
  'text/markdown',
  'text/plain',
  'application/json',
  'application/x-ndjson',
  'application/octet-stream',
]);

const SUPPORTED_EXTENSIONS = new Set(['.md', '.txt', '.log', '.json']);

export const isSupportedKnowledgeDocument = (input: {
  filename: string;
  contentType: string;
}): boolean => {
  const normalizedName = input.filename.toLowerCase();
  const hasSupportedExtension = [...SUPPORTED_EXTENSIONS].some((extension) =>
    normalizedName.endsWith(extension),
  );

  return hasSupportedExtension && SUPPORTED_CONTENT_TYPES.has(input.contentType);
};
