import { Injectable, UnauthorizedException, ConflictException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { UsersService } from '../user/user.service';
import { TenantService } from '../tenant/tenant.service';
import { LoginDto, RegisterDto } from './dto/index';
import { v4 as uuid } from 'uuid';
import * as bcrypt from 'bcrypt';

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly tenantService: TenantService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  async login(dto: LoginDto) {
    const user = await this.usersService.findByEmail(dto.email);
    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }
    const valid = await this.validatePassword(dto.password, user.passwordHash);
    if (!valid) {
      throw new UnauthorizedException('Invalid credentials');
    }
    const tenant = await this.tenantService.findById(user.tenantId);
    const payload = {
      sub: user.id,
      tenantId: user.tenantId,
      email: user.email,
      role: user.role,
    };
    return {
      accessToken: this.jwtService.sign(payload),
      refreshToken: this.generateRefreshToken(),
      user: this.sanitizeUser(user),
      tenant: { id: tenant.id, name: tenant.name, slug: tenant.slug },
    };
  }

  async register(dto: RegisterDto) {
    const existing = await this.usersService.findByEmail(dto.email);
    if (existing) {
      throw new ConflictException('Email already registered');
    }
    const tenant = await this.tenantService.create({
      name: dto.companyName || dto.email.split('@')[0],
      slug: this.slugify(dto.companyName || dto.email.split('@')[0]),
    });
    const hashedPassword = await this.hashPassword(dto.password);
    const user = await this.usersService.create({
      email: dto.email,
      passwordHash: hashedPassword,
      tenantId: tenant.id,
      role: 'tenant_admin',
      displayName: dto.displayName || dto.email,
    });
    const payload = {
      sub: user.id,
      tenantId: user.tenantId,
      email: user.email,
      role: user.role,
    };
    return {
      accessToken: this.jwtService.sign(payload),
      refreshToken: this.generateRefreshToken(),
      user: this.sanitizeUser(user),
      tenant: { id: tenant.id, name: tenant.name, slug: tenant.slug },
    };
  }

  async refreshToken(refreshToken: string) {
    try {
      const payload = this.jwtService.verify(refreshToken, {
        secret: this.configService.get('JWT_REFRESH_SECRET'),
      });
      const user = await this.usersService.findById(payload.sub);
      if (!user || user.refreshToken !== refreshToken) {
        throw new UnauthorizedException('Invalid refresh token');
      }
      const tenant = await this.tenantService.findById(user.tenantId);
      const newPayload = {
        sub: user.id,
        tenantId: user.tenantId,
        email: user.email,
        role: user.role,
      };
      return {
        accessToken: this.jwtService.sign(newPayload),
        refreshToken: this.generateRefreshToken(),
        user: this.sanitizeUser(user),
        tenant: { id: tenant.id, name: tenant.name, slug: tenant.slug },
      };
    } catch {
      throw new UnauthorizedException('Invalid refresh token');
    }
  }

  async logout(refreshToken: string) {
    const user = await this.usersService.findByRefreshToken(refreshToken);
    if (user) {
      await this.usersService.clearRefreshToken(user.id);
    }
    return { message: 'Logged out' };
  }

  private async hashPassword(password: string): Promise<string> {
    const saltRounds = 12;
    return bcrypt.hash(password, saltRounds);
  }

  private async validatePassword(password: string, hash: string): Promise<boolean> {
    return bcrypt.compare(password, hash);
  }

  private generateRefreshToken(): string {
    return uuid();
  }

  private slugify(name: string): string {
    return name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
  }

  private sanitizeUser(user: any) {
    const { passwordHash, ...safe } = user;
    return safe;
  }
}