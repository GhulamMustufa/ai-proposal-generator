import { Controller, Get, Put, Body, UseGuards, Req } from '@nestjs/common';
import { ProfileService } from './profile.service';
import { ClerkAuthGuard } from '../auth/clerk-auth.guard';

@Controller('api/profile')
export class ProfileController {
  constructor(private readonly profileService: ProfileService) {}

  @Get()
  @UseGuards(ClerkAuthGuard)
  async getProfile(@Req() req: any) {
    const userId = req.user.id;
    return this.profileService.getProfile(userId);
  }

  @Put('filters')
  @UseGuards(ClerkAuthGuard)
  async updateJobFilters(@Req() req: any, @Body() body: any) {
    const userId = req.user.id;
    return this.profileService.updateJobFilters(userId, body.jobFilters);
  }
}
