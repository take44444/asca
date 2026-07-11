import { Module } from '@nestjs/common';
import { PrismaService } from './prisma.service';

/** Provides the application-wide Prisma database client. */
@Module({
  providers: [PrismaService],
  exports: [PrismaService],
})
export class PrismaModule {}
