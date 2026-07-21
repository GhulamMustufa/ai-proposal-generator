import { Injectable, CanActivate, ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { verifyToken } from '@clerk/clerk-sdk-node';
import { ConfigService } from '@nestjs/config';

/**
 * ClerkAuthGuard
 * 
 * This NestJS Guard protects our routes by intercepting the HTTP request and verifying the JWT 
 * token provided in the Authorization header. It ensures only authenticated users can access the route.
 */
@Injectable()
export class ClerkAuthGuard implements CanActivate {
  constructor(private configService: ConfigService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const authHeader = request.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new UnauthorizedException('Missing or invalid Authorization header');
    }

    const token = authHeader.split(' ')[1];

    // --- LOCAL DEVELOPMENT BYPASS ---
    // If you use a token starting with "dev_", it will automatically bypass Clerk validation
    // and use the remaining string as the userId. E.g., Bearer dev_user_123 -> userId = "user_123"
    if (process.env.NODE_ENV !== 'production' && token.startsWith('dev_')) {
      request.user = { id: token.replace('dev_', '') };
      return true;
    }
    // --------------------------------

    const secretKey = this.configService.get<string>('CLERK_SECRET_KEY');

    try {
      // Verify the JWT with Clerk's SDK using our secret key
      const decoded = await verifyToken(token, { secretKey, issuer: null });
      
      // Attach the decoded user payload to the request. 
      // Controllers can now access it via @Req() req -> req.user.id
      request.user = { id: decoded.sub };
      return true;
    } catch (error) {
      throw new UnauthorizedException('Invalid or expired token');
    }
  }
}
