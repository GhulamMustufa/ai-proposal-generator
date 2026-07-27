import { Injectable, Inject, NotFoundException, Logger } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { CreatePersonaDto } from './dto/create-persona.dto';
import { UpdatePersonaDto } from './dto/update-persona.dto';
import { DB_CONNECTION } from '../db/db.module';
import { personas } from '../db/schema';
import { eq, and } from 'drizzle-orm';
import { NeonHttpDatabase } from 'drizzle-orm/neon-http';
import { generateEmbedding } from '../utils/embeddings';

@Injectable()
export class PersonasService {
  private readonly logger = new Logger(PersonasService.name);

  constructor(
    @Inject(DB_CONNECTION)
    private readonly db: NeonHttpDatabase<any>,
    @InjectQueue('matcher-queue') private readonly matcherQueue: Queue,
  ) {}

  async create(userId: string, createPersonaDto: CreatePersonaDto) {
    const skillsText = createPersonaDto.skills?.join(', ') || '';
    const textToEmbed = `${createPersonaDto.name} ${skillsText} ${createPersonaDto.resumeText || ''}`;
    const embedding = await generateEmbedding(textToEmbed);

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
        embedding,
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
    const persona = await this.findOne(userId, id);
    
    let embedding = persona.embedding;
    
    // Only re-embed if relevant fields changed
    const needsNewEmbedding = 
      updatePersonaDto.name !== undefined || 
      updatePersonaDto.skills !== undefined || 
      updatePersonaDto.resumeText !== undefined;
      
    if (needsNewEmbedding) {
      const newName = updatePersonaDto.name ?? persona.name;
      const newSkills = updatePersonaDto.skills ?? persona.skills;
      const newResumeText = updatePersonaDto.resumeText ?? persona.resumeText;
      const skillsText = Array.isArray(newSkills) ? newSkills.join(', ') : '';
      const textToEmbed = `${newName} ${skillsText} ${newResumeText || ''}`;
      embedding = await generateEmbedding(textToEmbed);
    }

    const [updated] = await this.db
      .update(personas)
      .set({
        ...updatePersonaDto,
        embedding,
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
    await this.matcherQueue.add(
      'sync-persona', 
      { personaId: persona.id },
      { jobId: `sync-persona-${persona.id}` } // BullMQ deduplication
    );
    
    return { status: 'sync_queued', personaId: persona.id };
  }
}
