import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';

@Injectable()
export class RequestLoggingMiddleware implements NestMiddleware {
  use(req: Request, res: Response, next: NextFunction) {
    const start = Date.now();
    const tenantId = (req as any).tenantId || 'anonymous';

    res.on('finish', () => {
      const duration = Date.now() - start;
      console.log(
        `${req.method} ${req.url} ${res.statusCode} ${duration}ms tenant=${tenantId}`,
      );
    });

    next();
  }
}