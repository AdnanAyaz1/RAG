import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';

@Injectable()
export class UsersService {
  private users: Map<string, any> = new Map();

  async findByEmail(email: string) {
    for (const user of this.users.values()) {
      if (user.email === email) return user;
    }
    return null;
  }

  async findById(id: string) {
    return this.users.get(id) || null;
  }

  async findByRefreshToken(refreshToken: string) {
    for (const user of this.users.values()) {
      if (user.refreshToken === refreshToken) return user;
    }
    return null;
  }

  async create(dto: any) {
    const id = 'user-' + Date.now();
    const user = {
      id,
      email: dto.email,
      passwordHash: dto.passwordHash,
      tenantId: dto.tenantId,
      role: dto.role || 'tenant_admin',
      displayName: dto.displayName || dto.email,
      refreshToken: null,
      createdAt: new Date().toISOString(),
    };
    this.users.set(id, user);
    return user;
  }

  async clearRefreshToken(userId: string) {
    const user = this.users.get(userId);
    if (user) {
      user.refreshToken = null;
    }
  }

  async updatePassword(userId: string, newHash: string) {
    const user = this.users.get(userId);
    if (user) {
      user.passwordHash = newHash;
    }
    return user;
  }
}