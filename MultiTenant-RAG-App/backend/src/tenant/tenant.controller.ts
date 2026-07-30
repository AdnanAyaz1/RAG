import { Controller, Get, Post, Body, Param } from '@nestjs/common';
import { TenantService } from './tenant.service';

@Controller('tenants')
export class TenantController {
  constructor(private readonly tenantService: TenantService) {}

  @Get('me')
  getMyTenant() {
    return this.tenantService.getMyTenant();
  }

  @Post()
  createTenant(@Body() dto: { name: string; slug: string }) {
    return this.tenantService.create(dto);
  }

  @Get(':id')
  getTenant(@Param('id') id: string) {
    return this.tenantService.findById(id);
  }
}