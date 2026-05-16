import type { Request, Response } from 'express';
import { getAuthContext } from '../../../shared/auth/auth-context.js';
import { organizationsModule } from '../organizations.module.js';
import { createOrganizationSchema, organizationParamsSchema } from './organization.validators.js';

export const organizationController = {
  async create(req: Request, res: Response) {
    const auth = getAuthContext(req);
    const { body } = createOrganizationSchema.parse(req);

    const { organization } = await organizationsModule.organizationService.create({
      userId: auth.userId,
      name: body.name,
    });

    res.status(201).json({ organization });
  },

  async list(req: Request, res: Response) {
    const auth = getAuthContext(req);
    const { organizations } = await organizationsModule.organizationService.list(auth.userId);
    res.status(200).json({ organizations });
  },

  async get(req: Request, res: Response) {
    const auth = getAuthContext(req);
    const { params } = organizationParamsSchema.parse(req);

    const { organization } = await organizationsModule.organizationService.get({
      userId: auth.userId,
      organizationId: params.orgId,
    });

    res.status(200).json({ organization });
  },
};
