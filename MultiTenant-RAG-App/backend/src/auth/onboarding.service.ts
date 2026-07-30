import { Injectable, NotFoundException } from '@nestjs/common';
import { TenantsService } from '../tenant/tenant.service';

@Injectable()
export class OnboardingService {
  constructor(private readonly tenantsService: TenantsService) {}

  async complete(tenantId: string, dto: any) {
    const tenant = await this.tenantsService.findById(tenantId);
    if (!tenant) {
      throw new NotFoundException('Tenant not found');
    }
    return {
      ...tenant,
      onboarding: {
        companyName: dto.companyName,
        companySize: dto.companySize,
        industry: dto.industry,
        useCase: dto.useCase,
        completedAt: new Date().toISOString(),
      },
    };
  }
}