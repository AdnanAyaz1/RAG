import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';

@Injectable()
export class UsersService {
  async findByEmail(email: string) {
    return null;
  }

  async findById(id: string) {
    return {
      id,
      email: 'user@example.com',
      tenantId: 'default-tenant',
      role: 'tenant_admin',
      displayName: 'Test User',
    };
  }

  async create(dto: any) {
    return {
      id: 'new-user-id',
      ...dto,
      createdAt: new Date().toISOString(),
    };
  }
}