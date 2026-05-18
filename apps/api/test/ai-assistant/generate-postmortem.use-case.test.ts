import { describe, expect, it, vi } from 'vitest';
import { createGeneratePostmortemUseCase } from '../../src/modules/ai-assistant/application/use-cases/generate-postmortem.use-case.js';
import type { LlmProviderPort } from '../../src/modules/ai-assistant/application/ports/llm-provider.port.js';
import type { IncidentForPostmortem } from '../../src/modules/ai-assistant/domain/entities/postmortem.entity.js';
import type { PostmortemRepository } from '../../src/modules/ai-assistant/domain/repositories/postmortem.repository.js';

const baseIncident: IncidentForPostmortem = {
  id: 'incident-1',
  organizationId: 'org-1',
  title: 'Payment outage',
  description: 'Payment API returned 500s',
  severity: 'SEV1',
  status: 'RESOLVED',
  rootCause: 'Database connection pool exhaustion',
  resolution: 'Raised pool limit and restarted workers',
  serviceName: 'payment-service',
  createdAt: new Date('2026-05-18T00:00:00.000Z'),
  resolvedAt: new Date('2026-05-18T01:00:00.000Z'),
  timelineEvents: [
    {
      type: 'INCIDENT_CREATED',
      message: 'Incident created',
      metadata: {},
      createdAt: new Date('2026-05-18T00:00:00.000Z'),
    },
  ],
  comments: [{ body: 'Pool saturation confirmed.', createdAt: new Date('2026-05-18T00:30:00.000Z') }],
};

describe('generate postmortem use case', () => {
  it('requires a resolved incident', async () => {
    const useCase = createGeneratePostmortemUseCase({
      postmortemRepository: {
        findIncident: vi
          .fn<PostmortemRepository['findIncident']>()
          .mockResolvedValue({ ...baseIncident, status: 'ACKNOWLEDGED' }),
        saveDraft: vi.fn(),
      },
      llmProvider: { complete: vi.fn() },
    });

    await expect(
      useCase.execute({
        organizationId: 'org-1',
        incidentId: 'incident-1',
        generatedByUserId: 'user-1',
      }),
    ).rejects.toMatchObject({ code: 'INCIDENT_INVALID_TRANSITION' });
  });

  it('builds a postmortem draft and saves it', async () => {
    const postmortemRepository = {
      findIncident: vi.fn<PostmortemRepository['findIncident']>().mockResolvedValue(baseIncident),
      saveDraft: vi.fn<PostmortemRepository['saveDraft']>().mockResolvedValue({
        id: 'postmortem-1',
        organizationId: 'org-1',
        incidentId: 'incident-1',
        generatedByUserId: 'user-1',
        title: 'Postmortem: Payment outage',
        content: '# Draft',
        createdAt: new Date('2026-05-18T02:00:00.000Z'),
        updatedAt: new Date('2026-05-18T02:00:00.000Z'),
      }),
    };
    const llmProvider = {
      complete: vi.fn<LlmProviderPort['complete']>().mockResolvedValue('# Draft'),
    };
    const useCase = createGeneratePostmortemUseCase({
      postmortemRepository,
      llmProvider,
    });

    const result = await useCase.execute({
      organizationId: 'org-1',
      incidentId: 'incident-1',
      generatedByUserId: 'user-1',
    });

    expect(llmProvider.complete).toHaveBeenCalledWith(
      expect.objectContaining({
        prompt: expect.stringContaining('Database connection pool exhaustion'),
      }),
    );
    expect(postmortemRepository.saveDraft).toHaveBeenCalledWith({
      organizationId: 'org-1',
      incidentId: 'incident-1',
      generatedByUserId: 'user-1',
      title: 'Postmortem: Payment outage',
      content: '# Draft',
    });
    expect(result.postmortem.id).toBe('postmortem-1');
  });
});
