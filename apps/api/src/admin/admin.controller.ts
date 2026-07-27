import { Controller, Get, Post, Body, UseGuards, Put, Param } from '@nestjs/common';
import { AdminService } from './admin.service';
import { ClerkAuthGuard } from '../auth/clerk-auth.guard';
import { AdminGuard } from '../auth/admin.guard';

@Controller('api/admin')
@UseGuards(ClerkAuthGuard, AdminGuard)
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  @Get('check')
  async checkAdmin() {
    return { isAdmin: true };
  }

  @Get('stats')
  async getStats() {
    return this.adminService.getStats();
  }

  @Get('queues')
  async getQueues() {
    return this.adminService.getQueuesStatus();
  }

  @Get('queues/:queueName/failed')
  async getFailedJobs(@Param('queueName') queueName: string) {
    return this.adminService.getFailedJobs(queueName);
  }

  @Get('queues/:queueName/active')
  async getActiveJobs(@Param('queueName') queueName: string) {
    return this.adminService.getActiveJobs(queueName);
  }

  @Get('queues/:queueName/completed')
  async getCompletedJobs(@Param('queueName') queueName: string) {
    return this.adminService.getCompletedJobs(queueName);
  }

  @Get('queues/:queueName/waiting')
  async getWaitingJobs(@Param('queueName') queueName: string) {
    return this.adminService.getWaitingJobs(queueName);
  }

  @Get('queues/:queueName/repeatable')
  async getRepeatableJobs(@Param('queueName') queueName: string) {
    return this.adminService.getRepeatableJobs(queueName);
  }

  @Post('scrapers/trigger')
  async triggerAllScrapers() {
    return this.adminService.triggerAllScrapers();
  }

  @Post('scrapers/trigger/:scraperName')
  async triggerScraper(@Param('scraperName') scraperName: string) {
    return this.adminService.triggerScraper(scraperName);
  }

  @Post('queues/clear')
  async clearQueues() {
    return this.adminService.clearQueues();
  }

  @Get('users')
  async getUsers() {
    return this.adminService.getUsers();
  }

  @Put('users/:id/subscription')
  async updateUserSubscription(@Param('id') id: string, @Body('status') status: string) {
    return this.adminService.updateUserSubscription(id, status);
  }

  @Get('jobs')
  async getRecentJobs() {
    return this.adminService.getRecentJobs();
  }

  @Get('matches')
  async getRecentMatches() {
    return this.adminService.getRecentMatches();
  }
}
