import type { Request, Response } from 'express';
import { getTenantContext } from '../../access-control/presentation/tenant-context.js';
import { incidentTimelineModule } from '../incident-timeline.module.js';
import {
  addIncidentCommentSchema,
  listIncidentTimelineSchema,
} from './incident-timeline.validators.js';

export const incidentTimelineController = {
  async list(req: Request, res: Response) {
    const tenant = getTenantContext(req);
    const { params, query } = listIncidentTimelineSchema.parse(req);
    const page = await incidentTimelineModule.incidentTimelineService.list({
      organizationId: tenant.organizationId,
      incidentId: params.incidentId,
      limit: query.limit,
      cursor: query.cursor,
    });

    res.status(200).json({ events: page.items, pageInfo: page.pageInfo });
  },

  async addComment(req: Request, res: Response) {
    const tenant = getTenantContext(req);
    const { body, params } = addIncidentCommentSchema.parse(req);
    const result = await incidentTimelineModule.incidentTimelineService.addComment({
      organizationId: tenant.organizationId,
      incidentId: params.incidentId,
      authorMemberId: tenant.memberId,
      body: body.body,
    });

    res.status(201).json(result);
  },
};
