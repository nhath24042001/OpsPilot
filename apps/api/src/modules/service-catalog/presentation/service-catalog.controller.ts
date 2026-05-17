import type { Request, Response } from 'express';
import { getTenantContext } from '../../access-control/presentation/tenant-context.js';
import { serviceCatalogModule } from '../service-catalog.module.js';
import {
  createServiceSchema,
  deleteServiceSchema,
  listServicesSchema,
  updateServiceSchema,
} from './service-catalog.validators.js';

export const serviceCatalogController = {
  async create(req: Request, res: Response) {
    const tenant = getTenantContext(req);
    const { body } = createServiceSchema.parse(req);
    const result = await serviceCatalogModule.serviceCatalogService.create({
      organizationId: tenant.organizationId,
      name: body.name,
      description: body.description,
      ownerMemberId: body.ownerMemberId,
    });

    res.status(201).json(result);
  },

  async list(req: Request, res: Response) {
    const tenant = getTenantContext(req);
    const { query } = listServicesSchema.parse(req);
    const page = await serviceCatalogModule.serviceCatalogService.list(tenant.organizationId, query);

    res.status(200).json({ services: page.items, pageInfo: page.pageInfo });
  },

  async update(req: Request, res: Response) {
    const tenant = getTenantContext(req);
    const { body, params } = updateServiceSchema.parse(req);
    const result = await serviceCatalogModule.serviceCatalogService.update({
      organizationId: tenant.organizationId,
      serviceId: params.serviceId,
      name: body.name,
      description: body.description,
      ownerMemberId: body.ownerMemberId,
    });

    res.status(200).json(result);
  },

  async delete(req: Request, res: Response) {
    const tenant = getTenantContext(req);
    const { params } = deleteServiceSchema.parse(req);
    await serviceCatalogModule.serviceCatalogService.delete({
      organizationId: tenant.organizationId,
      serviceId: params.serviceId,
    });

    res.status(204).send();
  },
};
