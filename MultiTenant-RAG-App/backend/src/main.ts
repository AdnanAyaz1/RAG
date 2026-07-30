import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ConfigService } from '@nestjs/config';
import { ValidationPipe } from '@nestjs/common';
import helmet from 'helmet';
import cors from 'cors';
import { TenantScopingMiddleware } from './common/middleware/tenant-scoping.middleware';
import { RequestLoggingMiddleware } from './common/middleware/request-logging.middleware';
import { GlobalErrorFilter } from './common/filters/global-error.filter';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const config = app.get(ConfigService);

  app.use(helmet());
  app.enableCors({
    origin: config.get('CORS_ORIGIN', 'http://localhost:3001'),
    credentials: true,
  });
  app.useGlobalPipes(new ValidationPipe({ transform: true }));
  app.useGlobalFilters(new GlobalErrorFilter());
  app.use(new RequestLoggingMiddleware().use.bind(new RequestLoggingMiddleware()));
  app.use(new TenantScopingMiddleware().use.bind(new TenantScopingMiddleware()));

  await app.listen(config.get('PORT', 3000));
}

bootstrap();
