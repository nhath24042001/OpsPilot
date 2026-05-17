import { beforeEach, describe, expect, it, vi } from 'vitest';
import { createAddIncidentCommentUseCase } from '../../src/modules/incident-timeline/application/use-cases/add-incident-comment.use-case.js';
import { createListIncidentTimelineUseCase } from '../../src/modules/incident-timeline/application/use-cases/list-incident-timeline.use-case.js';
import type { IncidentTimelineRepository } from '../../src/modules/incident-timeline/domain/repositories/incident-timeline.repository.js';

describe('incident timeline use cases', () => {
  const incidentExists = vi.fn<IncidentTimelineRepository['incidentExists']>();
  const listEvents = vi.fn<IncidentTimelineRepository['listEvents']>();
  const addComment = vi.fn<IncidentTimelineRepository['addComment']>();

  const repository = {
    incidentExists,
    listEvents,
    addComment,
  } as unknown as IncidentTimelineRepository;

  const organizationId = '11111111-1111-1111-1111-111111111111';
  const incidentId = '22222222-2222-2222-2222-222222222222';
  const authorMemberId = '33333333-3333-3333-3333-333333333333';

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('lists timeline events only when incident belongs to organization', async () => {
    incidentExists.mockResolvedValueOnce(true);
    listEvents.mockResolvedValueOnce({
      items: [],
      pageInfo: { limit: 20, nextCursor: null },
    });

    const useCase = createListIncidentTimelineUseCase({ incidentTimelineRepository: repository });
    const result = await useCase.execute({ organizationId, incidentId, limit: 20 });

    expect(incidentExists).toHaveBeenCalledWith({ organizationId, incidentId, limit: 20 });
    expect(listEvents).toHaveBeenCalledWith({ organizationId, incidentId, limit: 20 });
    expect(result.pageInfo.nextCursor).toBeNull();
  });

  it('rejects comments for inaccessible incidents', async () => {
    incidentExists.mockResolvedValueOnce(false);
    const useCase = createAddIncidentCommentUseCase({ incidentTimelineRepository: repository });

    await expect(
      useCase.execute({ organizationId, incidentId, authorMemberId, body: 'Checking logs' }),
    ).rejects.toHaveProperty('code', 'INCIDENT_NOT_FOUND');

    expect(addComment).not.toHaveBeenCalled();
  });
});
