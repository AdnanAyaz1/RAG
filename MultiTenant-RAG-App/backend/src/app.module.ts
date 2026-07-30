import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { HttpModule } from '@nestjs/axios';
import { TypeOrmModule } from '@nestjs/typeorm';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';

import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthRouteModule } from './auth/auth-route.module';
import { TenantModule } from './tenant/tenant.module';
import { DocumentModule } from './document/document.module';
import { SearchModule } from './search/search.module';
import { UserModule } from './user/user.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env', '.env.local'],
    }),
    HttpModule,
    TypeOrmModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        type: 'oracle',
        host: config.get('DB_HOST', 'oracle-db'),
        port: config.get('DB_PORT', 1521) as number,
        username: config.get('DB_USER', 'app_user'),
        password: config.get('DB_PASSWORD', 'ragapppassword123'),
        sid: config.get('DB_SID', 'XEPDB1'),
        autoLoadEntities: true,
        synchronize: config.get('NODE_ENV') !== 'production',
      }),
    }),
    PassportModule.register({ defaultStrategy: 'jwt' }),
    JwtModule.registerAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        secret: config.get('JWT_SECRET'),
        signOptions: { expiresIn: config.get('JWT_EXPIRATION', '15m') },
      }),
    }),
    AuthRouteModule,
    TenantModule,
    DocumentModule,
    SearchModule,
    UserModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {
  constructor() {}
}