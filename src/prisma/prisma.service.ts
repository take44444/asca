import { Injectable, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { PrismaBetterSqlite3 } from '@prisma/adapter-better-sqlite3';
import { PrismaClient } from '@prisma/client';

/** Nest-managed Prisma client with application lifecycle hooks. */
@Injectable()
export class PrismaService
  extends PrismaClient
  implements OnModuleInit, OnModuleDestroy
{
  /** Creates the Prisma client with the configured SQLite adapter. */
  constructor() {
    super({
      adapter: new PrismaBetterSqlite3({
        url: process.env.DATABASE_URL ?? 'file:./dev.db',
      }),
    });
  }

  /** Opens the Prisma connection when the module starts. */
  async onModuleInit(): Promise<void> {
    await this.$connect();
  }

  /** Closes the Prisma connection when the module shuts down. */
  async onModuleDestroy(): Promise<void> {
    await this.$disconnect();
  }
}
