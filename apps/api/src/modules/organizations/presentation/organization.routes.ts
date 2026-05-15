import { Router } from 'express';
import { authenticate } from '../../../shared/auth/authenticate.js';
import { badRequest } from '../../../shared/errors/app-error.js';
import { asyncHandler } from '../../../shared/http/async-handler.js';
import { organizationService } from '../application/organization.service.js';
import { createOrganizationSchema, organizationParamsSchema } from './organization.validators.js';

export const organizationRoutes = Router();

organizationRoutes.post(
  '/organizations',
  authenticate,
  asyncHandler(async (req, res) => {
    if (!req.auth) {
      throw badRequest('Missing auth context');
    }

    const { body } = createOrganizationSchema.parse(req);
    const organization = await organizationService.create({
      userId: req.auth.userId,
      name: body.name,
    });

    res.status(201).json({ organization });
  }),
);

organizationRoutes.get(
  '/organizations',
  authenticate,
  asyncHandler(async (req, res) => {
    if (!req.auth) {
      throw badRequest('Missing auth context');
    }

    const organizations = await organizationService.listForUser(req.auth.userId);
    res.status(200).json({ organizations });
  }),
);

organizationRoutes.get(
  '/orgs/:orgId',
  authenticate,
  asyncHandler(async (req, res) => {
    if (!req.auth) {
      throw badRequest('Missing auth context');
    }

    const { params } = organizationParamsSchema.parse(req);
    const organization = await organizationService.getForUser({
      userId: req.auth.userId,
      organizationId: params.orgId,
    });

    res.status(200).json({ organization });
  }),
);
