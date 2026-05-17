import type { Request, Response } from 'express';
import { getTenantContext } from '../../access-control/presentation/tenant-context.js';
import { incidentsModule } from '../incidents.module.js';
import {
  assignIncidentSchema,
  createIncidentSchema,
  incidentParamsSchema,
  listIncidentsSchema,
  resolveIncidentSchema,
} from './incident.validators.js';

export const incidentController = {
  async create(req: Request, res: Response) {
    const tenant = getTenantContext(req);
    const { body } = createIncidentSchema.parse(req);
    const result = await incidentsModule.incidentService.create({
      organizationId: tenant.organizationId,
      serviceId: body.serviceId,
      commanderMemberId: body.commanderMemberId,
      assignedMemberId: body.assignedMemberId,
      title: body.title,
      description: body.description,
      severity: body.severity,
    });

    res.status(201).json(result);
  },

  async list(req: Request, res: Response) {
    const tenant = getTenantContext(req);
    const { query } = listIncidentsSchema.parse(req);
    const page = await incidentsModule.incidentService.list(tenant.organizationId, query);

    res.status(200).json({ incidents: page.items, pageInfo: page.pageInfo });
  },

  async get(req: Request, res: Response) {
    const tenant = getTenantContext(req);
    const { params } = incidentParamsSchema.parse(req);
    const result = await incidentsModule.incidentService.get({
      organizationId: tenant.organizationId,
      incidentId: params.incidentId,
    });

    res.status(200).json(result);
  },

  async acknowledge(req: Request, res: Response) {
    const tenant = getTenantContext(req);
    const { params } = incidentParamsSchema.parse(req);
    const result = await incidentsModule.incidentService.acknowledge({
      organizationId: tenant.organizationId,
      incidentId: params.incidentId,
    });

    res.status(200).json(result);
  },

  async assign(req: Request, res: Response) {
    const tenant = getTenantContext(req);
    const { body, params } = assignIncidentSchema.parse(req);
    const result = await incidentsModule.incidentService.assign({
      organizationId: tenant.organizationId,
      incidentId: params.incidentId,
      assignedMemberId: body.assignedMemberId,
    });

    res.status(200).json(result);
  },

  async resolve(req: Request, res: Response) {
    const tenant = getTenantContext(req);
    const { body, params } = resolveIncidentSchema.parse(req);
    const result = await incidentsModule.incidentService.resolve({
      organizationId: tenant.organizationId,
      incidentId: params.incidentId,
      rootCause: body.rootCause,
      resolution: body.resolution,
    });

    res.status(200).json(result);
  },

  async cancel(req: Request, res: Response) {
    const tenant = getTenantContext(req);
    const { params } = incidentParamsSchema.parse(req);
    const result = await incidentsModule.incidentService.cancel({
      organizationId: tenant.organizationId,
      incidentId: params.incidentId,
    });

    res.status(200).json(result);
  },
};
