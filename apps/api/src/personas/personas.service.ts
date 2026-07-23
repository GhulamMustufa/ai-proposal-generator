import { Injectable, Inject, NotFoundException } from '@nestjs/common';
import { CreatePersonaDto } from './dto/create-persona.dto';
import { UpdatePersonaDto } from './dto/update-persona.dto';
import { DB_CONNECTION } from '../db/db.module';
import { personas } from '../db/schema';
import { eq, and } from 'drizzle-orm';
import { NeonHttpDatabase } from 'drizzle-orm/neon-http';

@Injectable()
export class PersonasService {
  constructor(
    @Inject(DB_CONNECTION)
    private readonly db: NeonHttpDatabase<any>,
  ) {}

  async create(userId: string, createPersonaDto: CreatePersonaDto) {
    const [persona] = await this.db
      .insert(personas)
      .values({
        userId,
        name: createPersonaDto.name,
        skills: createPersonaDto.skills || [],
        idealSalary: createPersonaDto.idealSalary,
        yearsOfExperience: createPersonaDto.yearsOfExperience,
        resumeText: createPersonaDto.resumeText,
      })
      .returning();
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
}
