import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Req,
} from '@nestjs/common';
import { PersonasService } from './personas.service';
import { CreatePersonaDto } from './dto/create-persona.dto';
import { UpdatePersonaDto } from './dto/update-persona.dto';
import { ClerkAuthGuard } from '../auth/clerk-auth.guard';

@Controller('api/personas')
@UseGuards(ClerkAuthGuard)
export class PersonasController {
  constructor(private readonly personasService: PersonasService) {}

  @Post()
  create(@Req() req: any, @Body() createPersonaDto: CreatePersonaDto) {
    return this.personasService.create(req.user.id, createPersonaDto);
  }

  @Get()
  findAll(@Req() req: any) {
    return this.personasService.findAll(req.user.id);
  }

  @Get(':id')
  findOne(@Req() req: any, @Param('id') id: string) {
    return this.personasService.findOne(req.user.id, id);
  }

  @Patch(':id')
  update(
    @Req() req: any,
    @Param('id') id: string,
    @Body() updatePersonaDto: UpdatePersonaDto,
  ) {
    return this.personasService.update(req.user.id, id, updatePersonaDto);
  }

  @Delete(':id')
  remove(@Req() req: any, @Param('id') id: string) {
    return this.personasService.remove(req.user.id, id);
  }
}
