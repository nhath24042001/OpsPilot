import type { createCreateServiceUseCase } from './use-cases/create-service.use-case.js';
import type { createDeleteServiceUseCase } from './use-cases/delete-service.use-case.js';
import type { createListServicesUseCase } from './use-cases/list-services.use-case.js';
import type { createUpdateServiceUseCase } from './use-cases/update-service.use-case.js';

export type ServiceCatalogUseCases = {
  createService: ReturnType<typeof createCreateServiceUseCase>;
  listServices: ReturnType<typeof createListServicesUseCase>;
  updateService: ReturnType<typeof createUpdateServiceUseCase>;
  deleteService: ReturnType<typeof createDeleteServiceUseCase>;
};

export const createServiceCatalogService = (useCases: ServiceCatalogUseCases) => ({
  create: useCases.createService.execute.bind(useCases.createService),
  list: useCases.listServices.execute.bind(useCases.listServices),
  update: useCases.updateService.execute.bind(useCases.updateService),
  delete: useCases.deleteService.execute.bind(useCases.deleteService),
});
