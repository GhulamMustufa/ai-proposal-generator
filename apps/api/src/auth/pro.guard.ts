import {
  Injectable,
  CanActivate,
  ExecutionContext,
  UnauthorizedException,
  HttpException,
  HttpStatus,
  Inject,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { REQUIRES_PRO_KEY } from './require-pro.decorator';
import { DB_CONNECTION } from '../db/db.module';
import { users } from '../db/schema';
import { eq } from 'drizzle-orm';

@Injectable()
export class ProGuard implements CanActivate {
  constructor(
    private reflector: Reflector,
    @Inject(DB_CONNECTION) private readonly db: any,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const requiresPro = this.reflector.getAllAndOverride<boolean>(REQUIRES_PRO_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (!requiresPro) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const user = request.user;

    if (!user || !user.id) {
      throw new UnauthorizedException('Authentication required');
    }

    const userRecords = await this.db.select().from(users).where(eq(users.id, user.id));
    
    if (userRecords.length === 0) {
      throw new UnauthorizedException('User record not found');
    }

    const subscriptionStatus = userRecords[0].subscriptionStatus;

    if (subscriptionStatus !== 'pro') {
      // Use 402 Payment Required status code
      throw new HttpException('Pro subscription required for this feature.', 402);
    }

    return true;
  }
}
