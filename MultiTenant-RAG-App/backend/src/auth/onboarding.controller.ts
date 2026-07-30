import { Controller, Post, Body, UseGuards, Req } from '@nestjs/common';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { OnboardingService } from './onboarding.service';

@Controller('auth/onboarding')
export class OnboardingController {
  constructor(private readonly onboardingService: OnboardingService) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  async completeOnboarding(@Body() dto: any, @Req() req: any) {
    const tenantId = req.user.tenantId;
    return this.onboardingService.complete(tenantId, dto);
  }
}