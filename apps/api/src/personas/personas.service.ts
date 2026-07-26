import { Injectable, Inject, NotFoundException, Logger } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { CreatePersonaDto } from './dto/create-persona.dto';
import { UpdatePersonaDto } from './dto/update-persona.dto';
import { DB_CONNECTION } from '../db/db.module';
import { personas } from '../db/schema';
import { eq, and } from 'drizzle-orm';
import { NeonHttpDatabase } from 'drizzle-orm/neon-http';

@Injectable()
export class PersonasService {
  private readonly logger = new Logger(PersonasService.name);

  constructor(
    @Inject(DB_CONNECTION)
    private readonly db: NeonHttpDatabase<any>,
    @InjectQueue('matcher-queue') private readonly matcherQueue: Queue,
  ) {}

  async create(userId: string, createPersonaDto: CreatePersonaDto) {
    const [persona] = await this.db
      .insert(personas)
      .values({
        userId,
        name: createPersonaDto.name,
        skills: createPersonaDto.skills || [],
        dreamCompanies: createPersonaDto.dreamCompanies || [],
        jobFilters: createPersonaDto.jobFilters || {},
        yearsOfExperience: createPersonaDto.yearsOfExperience,
        resumeText: createPersonaDto.resumeText,
      })
      .returning();

    this.logger.log(`Persona created: ${persona.id}. Dispatching backfill job...`);
    await this.matcherQueue.add('match-persona', { personaId: persona.id });
    
    return persona;
  }

  async findAll(userId: string) {
    // JIT user provisioning (handles E2E tests and webhook race conditions)
    try {
      await this.db
        .insert(require('../db/schema').users)
        .values({ id: userId, email: `${userId}@placeholder.local` })
        .onConflictDoNothing();
    } catch (e) {
      // ignore
    }

    return this.db
      .select()
      .from(personas)
      .where(eq(personas.userId, userId))
      .orderBy(personas.createdAt);
  }

  async findOne(userId: string, id: string) {
    const [persona] = await this.db
      .select()
      .from(personas)
      .where(and(eq(personas.id, id), eq(personas.userId, userId)));

    if (!persona) {
      throw new NotFoundException(`Persona #${id} not found`);
    }
    return persona;
  }

  async update(userId: string, id: string, updatePersonaDto: UpdatePersonaDto) {
    const [updated] = await this.db
      .update(personas)
      .set({
        ...updatePersonaDto,
      })
      .where(and(eq(personas.id, id), eq(personas.userId, userId)))
      .returning();

    if (!updated) {
      throw new NotFoundException(`Persona #${id} not found or not yours`);
    }
    return updated;
  }

  async remove(userId: string, id: string) {
    const [deleted] = await this.db
      .delete(personas)
      .where(and(eq(personas.id, id), eq(personas.userId, userId)))
      .returning();

    if (!deleted) {
      throw new NotFoundException(`Persona #${id} not found or not yours`);
    }
    return deleted;
  }

  async syncJobs(userId: string, id: string) {
    // Verify persona exists and belongs to user
    const persona = await this.findOne(userId, id);
    
    this.logger.log(`Dispatching sync job for persona: ${persona.id}`);
    await this.matcherQueue.add('sync-persona', { personaId: persona.id });
    
    return { status: 'sync_queued', personaId: persona.id };
  }
}
