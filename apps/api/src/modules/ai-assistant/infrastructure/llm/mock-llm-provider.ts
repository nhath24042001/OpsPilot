import type { LlmProviderPort } from '../../application/ports/llm-provider.port.js';

const trimPrompt = (prompt: string): string => prompt.replace(/\s+/g, ' ').trim().slice(0, 280);

export const mockLlmProvider: LlmProviderPort = {
  async complete(input) {
    if (input.system.includes('postmortem')) {
      return [
        '# Postmortem Draft',
        '',
        '## Summary',
        trimPrompt(input.prompt),
        '',
        '## Impact',
        'Derived from the incident timeline and comments.',
        '',
        '## Root Cause',
        'Use the captured root cause and refine this section before publishing.',
        '',
        '## Follow-up Actions',
        '- Validate monitoring and alert thresholds.',
        '- Add owner-reviewed remediation tasks.',
      ].join('\n');
    }

    return [
      'Based on the indexed OpsPilot knowledge base, here is a source-grounded answer.',
      '',
      trimPrompt(input.prompt),
    ].join('\n');
  },
};
