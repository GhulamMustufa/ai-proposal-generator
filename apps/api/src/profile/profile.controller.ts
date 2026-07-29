import { Controller, Get, Put, Post, Body, UseGuards, Req, UseInterceptors, UploadedFile, HttpException, HttpStatus } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
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

  @Get('plan')
  @UseGuards(ClerkAuthGuard)
  async getPlan(@Req() req: any) {
    const userId = req.user.id;
    return this.profileService.getPlan(userId);
  }

  @Put('api-keys')
  @UseGuards(ClerkAuthGuard)
  async updateApiKeys(@Req() req: any, @Body() body: any) {
    const userId = req.user.id;
    return this.profileService.updateApiKeys(userId, body.apiKeys);
  }

  @Put('default-persona')
  @UseGuards(ClerkAuthGuard)
  async updateDefaultPersona(@Req() req: any, @Body() body: any) {
    const userId = req.user.id;
    return this.profileService.updateDefaultPersona(userId, body.defaultPersonaId);
  }

  @Post('parse-pdf')
  @UseGuards(ClerkAuthGuard)
  @UseInterceptors(FileInterceptor('file'))
  async parsePdf(@UploadedFile() file: Express.Multer.File) {
    if (!file) {
      throw new HttpException('No file uploaded', HttpStatus.BAD_REQUEST);
    }
    if (file.mimetype !== 'application/pdf') {
      throw new HttpException('File must be a PDF', HttpStatus.BAD_REQUEST);
    }

    try {
      const pdf = require('pdf-parse');
      const data = await pdf(file.buffer);
      return { text: data.text };
    } catch (error) {
      console.error('Failed to parse PDF', error);
      throw new HttpException('Failed to parse PDF', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }
}
