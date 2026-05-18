export type RagSource = {
  documentId: string;
  documentTitle: string;
  chunkId: string;
  chunkIndex: number;
  content: string;
  score: number;
};

export type AssistantSource = {
  documentId: string;
  title: string;
  chunkId: string;
  score: number;
};
