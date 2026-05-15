import { Router } from 'express';
import { authenticate } from '../../../shared/auth/authenticate.js';
import { getAuthContext } from '../../../shared/auth/auth-context.js';
import { asyncHandler } from '../../../shared/http/async-handler.js';
import { organizationService } from '../application/organization.service.js';
import { createOrganizationSchema, organizationParamsSchema } from './organization.validators.js';

export const organizationRoutes = Router();

organizationRoutes.post(
  '/organizations',
  authenticate,
  asyncHandler(async (req, res) => {
    const auth = getAuthContext(req);

    const { body } = createOrganizationSchema.parse(req);
    const organization = await organizationService.create({
      userId: auth.userId,
      name: body.name,
    });

    res.status(201).json({ organization });
  }),
);

organizationRoutes.get(
  '/organizations',
  authenticate,
  asyncHandler(async (req, res) => {
    const auth = getAuthContext(req);

    const organizations = await organizationService.listForUser(auth.userId);
    res.status(200).json({ organizations });
  }),
);

organizationRoutes.get(
  '/orgs/:orgId',
  authenticate,
  asyncHandler(async (req, res) => {
    const auth = getAuthContext(req);

    const { params } = organizationParamsSchema.parse(req);
    const organization = await organizationService.getForUser({
      userId: auth.userId,
      organizationId: params.orgId,
    });

    res.status(200).json({ organization });
  }),
);
