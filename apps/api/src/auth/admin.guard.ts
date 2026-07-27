import {
  Injectable,
  CanActivate,
  ExecutionContext,
  UnauthorizedException,
  ForbiddenException,
  Inject,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { DB_CONNECTION } from '../db/db.module';
import { users } from '../db/schema';
import { eq } from 'drizzle-orm';

@Injectable()
export class AdminGuard implements CanActivate {
  constructor(
    private configService: ConfigService,
    @Inject(DB_CONNECTION) private readonly db: any,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const user = request.user;

    if (!user || !user.id) {
      throw new UnauthorizedException('Authentication required');
    }

    const userRecords = await this.db.select().from(users).where(eq(users.id, user.id));
    
    if (userRecords.length === 0) {
      throw new ForbiddenException('User record not found');
    }

    if (userRecords[0].role !== 'admin') {
      throw new ForbiddenException('Admin privileges required');
    }

    return true;
  }
}
