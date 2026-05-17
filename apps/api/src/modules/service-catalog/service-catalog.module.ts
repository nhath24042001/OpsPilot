import { createServiceCatalogService } from './application/service-catalog.service.js';
import { createCreateServiceUseCase } from './application/use-cases/create-service.use-case.js';
import { createDeleteServiceUseCase } from './application/use-cases/delete-service.use-case.js';
import { createListServicesUseCase } from './application/use-cases/list-services.use-case.js';
import { createUpdateServiceUseCase } from './application/use-cases/update-service.use-case.js';
import { prismaServiceRepository } from './infrastructure/prisma/prisma-service.repository.js';

export const createServiceCatalogModule = () => {
  const serviceRepository = prismaServiceRepository;
  const useCases = {
    createService: createCreateServiceUseCase({ serviceRepository }),
    listServices: createListServicesUseCase({ serviceRepository }),
    updateService: createUpdateServiceUseCase({ serviceRepository }),
    deleteService: createDeleteServiceUseCase({ serviceRepository }),
  };

  return {
    serviceCatalogService: createServiceCatalogService(useCases),
    serviceRepository,
  };
};

export const serviceCatalogModule = createServiceCatalogModule();
