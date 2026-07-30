import { Injectable, NestMiddleware, BadRequestException } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';

@Injectable()
export class TenantScopingMiddleware implements NestMiddleware {
  use(req: Request, _res: Response, next: NextFunction) {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return next();
    }

    const token = authHeader.split(' ')[1];
    try {
      const parts = token.split('.');
      if (parts.length !== 3) {
        return next();
      }
      const payload = JSON.parse(Buffer.from(parts[1], 'base64').toString());
      if (payload.tenantId) {
        (req as any).tenantId = payload.tenantId;
      }
    } catch {
      // token parsing failed, continue without tenant scoping
    }

    next();
  }
}