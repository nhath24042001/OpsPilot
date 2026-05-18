import type { Request, Response } from 'express';
import { getAuthContext } from '../../../shared/auth/auth-context.js';
import { getTenantContext } from '../../access-control/presentation/tenant-context.js';
import { aiAssistantModule } from '../ai-assistant.module.js';
import {
  askKnowledgeBaseSchema,
  incidentAssistantParamsSchema,
  recommendRunbooksSchema,
} from './ai-assistant.validators.js';

export const aiAssistantController = {
  async ask(req: Request, res: Response) {
    const tenant = getTenantContext(req);
    const auth = getAuthContext(req);
    const { body } = askKnowledgeBaseSchema.parse(req);
    const result = await aiAssistantModule.aiAssistantService.ask({
      organizationId: tenant.organizationId,
      userId: auth.userId,
      question: body.question,
      topK: body.topK,
    });

    res.status(200).json({
      answer: result.answer,
      sources: result.sources,
      conversationId: result.conversationId,
      rateLimit: result.rateLimit,
    });
  },

  async recommendRunbooks(req: Request, res: Response) {
    const tenant = getTenantContext(req);
    const { params, body } = recommendRunbooksSchema.parse(req);
    const result = await aiAssistantModule.aiAssistantService.recommendRunbooks({
      organizationId: tenant.organizationId,
      incidentId: params.incidentId,
      topK: body.topK,
    });

    res.status(200).json(result);
  },

  async generatePostmortem(req: Request, res: Response) {
    const tenant = getTenantContext(req);
    const auth = getAuthContext(req);
    const { params } = incidentAssistantParamsSchema.parse(req);
    const result = await aiAssistantModule.aiAssistantService.generatePostmortem({
      organizationId: tenant.organizationId,
      incidentId: params.incidentId,
      generatedByUserId: auth.userId,
    });

    res.status(201).json(result);
  },
};
