import { Injectable, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

/** Nest-managed Prisma client with application lifecycle hooks. */
@Injectable()
export class PrismaService
  extends PrismaClient
  implements OnModuleInit, OnModuleDestroy
{
  /** Opens the Prisma connection when the module starts. */
  async onModuleInit(): Promise<void> {
    await this.$connect();
  }

  /** Closes the Prisma connection when the module shuts down. */
  async onModuleDestroy(): Promise<void> {
    await this.$disconnect();
  }
}
