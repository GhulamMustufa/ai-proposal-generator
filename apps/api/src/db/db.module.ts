import { Module, Global } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { neon } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';
import * as schema from './schema';

// This is an Injection Token. We use it to identify our database provider when injecting it into other services.
export const DB_CONNECTION = 'DB_CONNECTION';

/**
 * DbModule
 *
 * We use the @Global() decorator so we only have to import this module once in the AppModule.
 * The DB_CONNECTION provider will then be accessible everywhere in our application.
 */
@Global()
@Module({
  providers: [
    {
      // The 'provide' token is what we will use in our @Inject() decorators
      provide: DB_CONNECTION,
      // 'inject' tells Nest to pass the ConfigService into our factory function
      inject: [ConfigService],
      // The factory runs when the app starts, initializing our Neon DB connection
      useFactory: (configService: ConfigService) => {
        const databaseUrl = configService.get<string>('DATABASE_URL');
        if (!databaseUrl) {
          throw new Error(
            'DATABASE_URL is not defined in environment variables.',
          );
        }

        // We use the Neon serverless HTTP driver, which is optimized for fast, connectionless querying.
        const sql = neon(databaseUrl);

        // Return the Drizzle ORM instance with our schema attached for type-safe queries.
        return drizzle(sql, { schema });
      },
    },
  ],
  // Exporting the provider makes it available to other modules that import DbModule
  exports: [DB_CONNECTION],
})
export class DbModule {}
