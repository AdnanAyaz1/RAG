import { Injectable, NotFoundException } from '@nestjs/common';

@Injectable()
export class TenantService {
  async getMyTenant() {
    return { id: 'current-tenant-id', name: 'My Organization', slug: 'my-org' };
  }

  async create(dto: { name: string; slug: string }) {
    return {
      id: 'new-tenant-id',
      name: dto.name,
      slug: dto.slug,
      createdAt: new Date().toISOString(),
    };
  }

  async findById(id: string) {
    return { id, name: 'Tenant', slug: id, createdAt: new Date().toISOString() };
  }
}